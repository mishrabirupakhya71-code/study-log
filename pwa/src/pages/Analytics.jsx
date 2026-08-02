import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getSubjectStats, getSessionsInRange, getTotalStudyMinutesAllTime } from '../services/db.js';
import { getToday, daysAgo, formatDuration } from '../utils/time.js';

export function Analytics() {
  const [period, setPeriod] = useState('week');
  const [stats, setStats] = useState({});
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => { loadStats(); }, [period]);

  async function loadStats() {
    const endDate = getToday();
    let startDate;
    if (period === 'week') startDate = daysAgo(7);
    else if (period === 'month') startDate = daysAgo(30);
    else startDate = '2000-01-01';
    const subjectStats = await getSubjectStats(startDate, endDate);
    setStats(subjectStats);
    const sessions = await getSessionsInRange(startDate, endDate);
    setTotalMinutes(sessions.reduce((sum, s) => sum + Math.round(s.duration / 60000), 0));
    setSessionCount(sessions.length);
  }

  const sortedSubjects = Object.values(stats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  const maxMinutes = sortedSubjects.length > 0 ? sortedSubjects[0].totalMinutes : 1;

  return (
    <div class="page analytics-page">
      <header class="page-header"><h1>📊 Analytics</h1></header>
      <div class="filter-tabs">
        {['week', 'month', 'all'].map(p => (
          <button class={`filter-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)} key={p}>
            {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-value">{formatDuration(totalMinutes * 60000)}</span><span class="stat-label">{period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'This Month'}</span></div>
        <div class="stat-card"><span class="stat-value">{sessionCount}</span><span class="stat-label">Sessions</span></div>
        <div class="stat-card"><span class="stat-value">{sessionCount > 0 ? formatDuration(Math.round(totalMinutes / sessionCount) * 60000) : '0m'}</span><span class="stat-label">Avg Session</span></div>
      </div>
      <div class="card">
        <h3 class="card-title">Subject Breakdown</h3>
        {sortedSubjects.length > 0 ? (
          <div class="subject-bars">
            {sortedSubjects.map(s => (
              <div class="subject-bar-item" key={s.name}>
                <div class="bar-label"><span class="bar-dot" style={{backgroundColor: s.color}} /><span>{s.name}</span></div>
                <div class="bar-track"><div class="bar-fill" style={{width: `${(s.totalMinutes / maxMinutes) * 100}%`, backgroundColor: s.color}} /></div>
                <span class="bar-value">{formatDuration(s.totalMinutes * 60000)}</span>
              </div>
            ))}
          </div>
        ) : (<div class="empty-state">No study data for this period</div>)}
      </div>
    </div>
  );
}
