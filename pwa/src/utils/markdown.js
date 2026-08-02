import { formatTime, formatDuration } from './time.js';

export function dailyLogMarkdown(date, locationEvents = [], sessions = [], notes = '', photos = []) {
  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let md = `## 📅 Daily Log — ${dateStr}\n\n`;

  // Location log
  if (locationEvents.length > 0) {
    md += `### 🚶 Location Log\n| Time | Event |\n|------|-------|\n`;
    locationEvents.forEach(e => {
      const emoji = { enter_home: '🏠 Arrived Home', exit_home: '🏠 Departed Home', enter_college: '🏫 Arrived College', exit_college: '🏫 Departed College' };
      md += `| ${formatTime(e.timestamp)} | ${emoji[e.event] || e.event} |\n`;
    });
    md += '\n';
  }

  // Study sessions
  if (sessions.length > 0) {
    const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);
    md += `### 📖 Study Sessions\n`;
    sessions.forEach(s => {
      md += `- **${s.subjectName}** — ${formatDuration(s.duration)} (${formatTime(s.startTime)} - ${formatTime(s.endTime)})\n`;
    });
    md += `- **Total: ${formatDuration(totalMs)}**\n\n`;
  }

  // Notes
  if (notes) {
    md += `### 📝 Notes\n${notes}\n\n`;
  }

  // Photos
  if (photos.length > 0) {
    md += `### 📸 Photos\n`;
    photos.forEach(p => {
      md += `![${p.caption || 'Note photo'}](${p.url})\n`;
    });
    md += '\n';
  }

  return md;
}

export function studySessionMarkdown(session) {
  return `## 📖 Study Session — ${session.subjectName}
- **Subject:** ${session.subjectName}
- **Date:** ${session.date}
- **Duration:** ${formatDuration(session.duration)}
- **Start:** ${formatTime(session.startTime)}
- **End:** ${formatTime(session.endTime)}
${session.notes ? `\n### Notes\n${session.notes}` : ''}`;
}

export function assignmentMarkdown(hw) {
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
  return `## 📚 ${hw.subject || 'General'} — ${hw.title}
- **Subject:** ${hw.subject || 'General'}
- **Due Date:** ${new Date(hw.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Priority:** ${priorityEmoji[hw.priority] || ''} ${hw.priority || 'Medium'}
- **Status:** ${hw.status === 'completed' ? '✅ Completed' : '📋 In Progress'}
- **Source:** ${hw.source || 'Manual'}
${hw.description ? `\n### Description\n${hw.description}` : ''}
${hw.photos && hw.photos.length > 0 ? `\n### Photos\n${hw.photos.map(p => `![${p.caption || 'Assignment photo'}](${p.url})`).join('\n')}` : ''}`;
}

export function weeklySummaryMarkdown(weekStart, weekEnd, totalHours, subjectStats, streak, sessionsCount) {
  let md = `## 📊 Weekly Summary — ${weekStart} to ${weekEnd}\n\n`;
  md += `### Overview\n`;
  md += `- **Total Study Time:** ${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m\n`;
  md += `- **Study Sessions:** ${sessionsCount}\n`;
  md += `- **Current Streak:** ${streak} days 🔥\n\n`;

  if (Object.keys(subjectStats).length > 0) {
    md += `### Subject Breakdown\n| Subject | Time | Sessions |\n|---------|------|----------|\n`;
    Object.values(subjectStats).sort((a, b) => b.totalMinutes - a.totalMinutes).forEach(s => {
      md += `| ${s.name} | ${formatDuration(s.totalMinutes * 60000)} | ${s.sessionCount} |\n`;
    });
    md += '\n';
  }

  return md;
}
