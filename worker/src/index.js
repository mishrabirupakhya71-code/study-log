import { authenticate, corsHeaders } from './auth.js';
import * as github from './github.js';
import * as templates from './templates.js';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // Require authentication (from Tasker or our PWA)
    if (!authenticate(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const url = new URL(request.url);

    try {
      // ----------------------------------------------------
      // ROUTE: /api/location-event
      // Used by Tasker to log entry/exit of Home or College
      // ----------------------------------------------------
      if (request.method === 'POST' && url.pathname === '/api/location-event') {
        const payload = await request.json(); // { event: 'enter_home', timestamp: 1700000... }
        const tz = env.TIMEZONE || 'Asia/Kolkata';
        const ts = Number(payload.timestamp) || Date.now();
        // Compute the LOCAL calendar date in the user's timezone
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
        const title = `📅 Daily Log — ${today}`;

        const existingIssue = await github.findIssue(title, ['daily-log'], env);

        let locationEvents = [payload];
        let sessions = [];
        let notes = '';
        let photos = [];
        let issueBody = templates.dailyLogMarkdown(today, locationEvents, sessions, notes, photos, tz);

        if (existingIssue) {
          // If it exists, append to a new comment instead of parsing markdown
          const timeStr = new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz });
          const commentBody = `### Location Update\n- ${timeStr}: **${payload.event}**`;
          await github.addComment(existingIssue.number, commentBody, env);
          return new Response(JSON.stringify({ success: true, updated: existingIssue.number }), { headers: corsHeaders() });
        } else {
          // Create new issue
          const issue = await github.createIssue({
            title,
            body: issueBody,
            labels: ['daily-log']
          }, env);
          return new Response(JSON.stringify({ success: true, created: issue.number }), { headers: corsHeaders() });
        }
      }

      // ----------------------------------------------------
      // ROUTE: /api/sync/daily-log
      // Used by PWA to sync the full daily log object
      // ----------------------------------------------------
      if (request.method === 'POST' && url.pathname === '/api/sync/daily-log') {
        const { date, locationEvents, sessions, notes, photos } = await request.json();
        const title = `📅 Daily Log — ${date}`;
        const issueBody = templates.dailyLogMarkdown(date, locationEvents, sessions, notes, photos, env.TIMEZONE);

        const existingIssue = await github.findIssue(title, ['daily-log'], env);

        if (existingIssue) {
          await github.updateIssue(existingIssue.number, { body: issueBody }, env);
          return new Response(JSON.stringify({ success: true, updated: existingIssue.number }), { headers: corsHeaders() });
        } else {
          const issue = await github.createIssue({
            title,
            body: issueBody,
            labels: ['daily-log']
          }, env);
          return new Response(JSON.stringify({ success: true, created: issue.number }), { headers: corsHeaders() });
        }
      }

      // ----------------------------------------------------
      // ROUTE: /api/sync/session
      // Used by PWA to sync individual study sessions
      // ----------------------------------------------------
      if (request.method === 'POST' && url.pathname === '/api/sync/session') {
        const session = await request.json();
        const title = `📖 Study Session: ${session.subjectName} (${session.date})`;
        const issueBody = templates.studySessionMarkdown(session, env.TIMEZONE);

        const issue = await github.createIssue({
          title,
          body: issueBody,
          labels: ['study-session', `subject:${session.subjectName.toLowerCase()}`]
        }, env);

        return new Response(JSON.stringify({ success: true, created: issue.number }), { headers: corsHeaders() });
      }

      // ----------------------------------------------------
      // ROUTE: /api/sync/assignment
      // Used by PWA to sync homework tasks
      // ----------------------------------------------------
      if (request.method === 'POST' && url.pathname === '/api/sync/assignment') {
        const hw = await request.json();
        const title = `📚 ${hw.subject || 'General'} — ${hw.title}`;
        const issueBody = templates.assignmentMarkdown(hw);

        // Search if assignment exists by its unique database ID injected as a hidden comment
        const queryTitle = `"${hw.title}"`;
        const existing = await classIssue(queryTitle, ['assignment'], env);

        if (existing) {
          await github.updateIssue(existing.number, {
            state: hw.status === 'completed' ? 'closed' : 'open',
            body: issueBody
          }, env);
          return new Response(JSON.stringify({ success: true, updated: existing.number }), { headers: corsHeaders() });
        } else {
          const issue = await github.createIssue({
            title,
            body: issueBody,
            labels: ['assignment', `subject:${(hw.subject || 'general').toLowerCase()}`]
          }, env);
          return new Response(JSON.stringify({ success: true, created: issue.number }), { headers: corsHeaders() });
        }
      }

      // ----------------------------------------------------
      // ROUTE: /api/upload/photo (Base64 approach)
      // ----------------------------------------------------
      if (request.method === 'POST' && url.pathname === '/api/upload/photo') {
        const payload = await request.json();
        // payload expects: { base64: "...", filename: "photo.jpg" }

        if (!payload.base64 || !payload.filename) {
          throw new Error("Missing base64 payload or filename");
        }

        // Convert base64 back to binary Buffer for the upload API
        const binaryString = atob(payload.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const downloadUrl = await github.uploadReleaseAsset(bytes.buffer, payload.filename, env);
        return new Response(JSON.stringify({ success: true, url: downloadUrl }), { headers: corsHeaders() });
      }

      if (request.method === 'GET' && url.pathname === '/api/debug') {
        const issues = await github.listIssues(null, env);
        const summary = await Promise.all(issues.slice(0, 10).map(async (i) => {
          const comments = await github.listComments(i.number, env);
          return {
            number: i.number,
            title: i.title,
            state: i.state,
            createdAt: i.created_at,
            commentCount: comments.length,
            lastComments: comments.slice(-3).map(c => c.body),
          };
        }));
        return new Response(JSON.stringify(summary, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders() });

    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }
  }
};

// Helper since search might need exact title search
async function classIssue(title, labels, env) {
  return await github.findIssue(title.replace(/"/g, ''), labels, env);
}