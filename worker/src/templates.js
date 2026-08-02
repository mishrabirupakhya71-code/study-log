const DEFAULT_TZ = 'Asia/Kolkata';

function fmtTime(ts, tz) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz || DEFAULT_TZ });
}

function fmtDate(dateStr, tz) {
  // dateStr is YYYY-MM-DD (already local); format the calendar label
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function dailyLogMarkdown(date, locationEvents = [], sessions = [], notes = '', photos = [], tz) {
  const dateStr = fmtDate(date, tz);
  let md = `## 📅 Daily Log — ${dateStr}\n\n`;

  if (locationEvents.length > 0) {
    md += `### 🚶 Location Log\n| Time | Event |\n|------|-------|\n`;
    locationEvents.forEach(e => {
      const emoji = { enter_home: '🏠 Arrived Home', exit_home: '🏠 Departed Home', enter_college: '🏫 Arrived College', exit_college: '🏫 Departed College' };
      const time = fmtTime(e.timestamp, tz);
      md += `| ${time} | ${emoji[e.event] || e.event} |\n`;
    });
    md += '\n';
  }

  if (sessions.length > 0) {
    const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHrs = Math.floor((totalMs / 60000) / 60);
    const totalMins = Math.round((totalMs / 60000) % 60);

    md += `### 📖 Study Sessions\n`;
    sessions.forEach(s => {
      const hrs = Math.floor((s.duration / 60000) / 60);
      const mns = Math.round((s.duration / 60000) % 60);
      const dr = hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`;
      const st = fmtTime(s.startTime, tz);
      const et = fmtTime(s.endTime, tz);
      md += `- **${s.subjectName}** — ${dr} (${st} - ${et})\n`;
    });
    md += `- **Total: ${totalHrs > 0 ? `${totalHrs}h ` : ''}${totalMins}m**\n\n`;
  }

  if (notes) md += `### 📝 Notes\n${notes}\n\n`;
  if (photos.length > 0) {
    md += `### 📸 Photos\n`;
    photos.forEach(p => { md += `![${p.caption || 'Note photo'}](${p.url})\n`; });
    md += '\n';
  }

  return md;
}

export function studySessionMarkdown(session, tz) {
  const hrs = Math.floor((session.duration / 60000) / 60);
  const mns = Math.round((session.duration / 60000) % 60);
  const st = fmtTime(session.startTime, tz);
  const et = fmtTime(session.endTime, tz);

  return `## 📖 Study Session — ${session.subjectName}
- **Subject:** ${session.subjectName}
- **Date:** ${session.date}
- **Duration:** ${hrs > 0 ? `${hrs}h ` : ''}${mns}m
- **Start:** ${st}
- **End:** ${et}
${session.notes ? `\n### Notes\n${session.notes}` : ''}`;
}

export function assignmentMarkdown(hw) {
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
  const d = new Date(hw.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `## 📚 ${hw.subject || 'General'} — ${hw.title}
- **Subject:** ${hw.subject || 'General'}
- **Due Date:** ${d}
- **Priority:** ${priorityEmoji[hw.priority] || ''} ${hw.priority || 'Medium'}
- **Status:** ${hw.status === 'completed' ? '✅ Completed' : '📋 In Progress'}
- **Source:** ${hw.source || 'Manual'}
${hw.description ? `\n### Description\n${hw.description}` : ''}
${hw.photos && hw.photos.length > 0 ? `\n### Photos\n${hw.photos.map(p => `![photo](${p.url})`).join('\n')}` : ''}`;
}