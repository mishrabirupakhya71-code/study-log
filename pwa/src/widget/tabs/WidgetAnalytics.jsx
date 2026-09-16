/**
 * Widget Analytics Tab
 * Adapted from pages/Analytics.jsx — uses widget-db
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getSubjectStats, getSessionsInRange, getTotalStudyMinutesAllTime, getTotalStudyMinutesToday, getCurrentStreak, getLongestStreak } from '../widget-db.js';
import { getToday, getWeekStart, formatDuration } from '../../utils/time.js';

const PERIODS = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

export function WidgetAnalytics() {
  const [period, setPeriod] = useState('week');
  const [subjectStats, setSubjectStats] = useState({});
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [avg, setAvg] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => { loadStats(); }, [period]);

  async function loadStats() {
    const today = getToday();
    let startDate;
    if (period === 'week') {
      startDate = getWeekStart();
    } else if (period === 'month') {
      const d = new Date(); d.setDate(1);
      startDate = d.toISOString().split('T')[0];
    } else {
      startDate = '2020-01-01';
    }

    const [stats, sessions] = await Promise.all([
      getSubjectStats(startDate, today),
      getSessionsInRange(startDate, today),
    ]);

    setSubjectStats(stats);
    setSessionCount(sessions.length);

    const total = sessions.reduce((s, se) => s + Math.round(se.duration / 60000), 0);
    setTotalMinutes(total);

    const days = Math.max(1, Math.ceil((new Date(today) - new Date(startDate)) / 86400000));
    setAvg(Math.round(total / days));

    setStreak(await getCurrentStreak());
    setBestStreak(await getLongestStreak());
  }

  const statsArr = Object.values(subjectStats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  const maxMin = statsArr.length ? statsArr[0].totalMinutes : 1;

  return (
    <div class="ss-tab-content ss-analytics">
      <div class="ss-period-tabs">
        {PERIODS.map(p => (
          <button key={p.id} class={`ss-filter-btn ${period === p.id ? 'active' : ''}`} onClick={() => setPeriod(p.id)}>{p.label}</button>
        ))}
      </div>

      <div class="ss-stats-grid">
        <div class="ss-stat-card"><span class="ss-stat-icon">⏰</span><span class="ss-stat-value">{formatDuration(totalMinutes * 60000)}</span><span class="ss-stat-label">Total Study</span></div>
        <div class="ss-stat-card"><span class="ss-stat-icon">📝</span><span class="ss-stat-value">{sessionCount}</span><span class="ss-stat-label">Sessions</span></div>
        <div class="ss-stat-card"><span class="ss-stat-icon">📊</span><span class="ss-stat-value">{formatDuration(avg * 60000)}</span><span class="ss-stat-label">Daily Avg</span></div>
        <div class="ss-stat-card"><span class="ss-stat-icon">🔥</span><span class="ss-stat-value">{streak}</span><span class="ss-stat-label">Streak</span></div>
      </div>

      <div class="ss-subject-breakdown">
        <h3 class="ss-section-title">📚 By Subject</h3>
        {statsArr.length === 0 && <div class="ss-empty-state">No study data yet</div>}
        {statsArr.map(s => {
          const pct = Math.round((s.totalMinutes / maxMin) * 100);
          return (
            <div class="ss-subject-row" key={s.name}>
              <div class="ss-subject-row-header">
                <span class="ss-subject-dot" style={{ backgroundColor: s.color }} />
                <span class="ss-subject-name">{s.name}</span>
                <span class="ss-subject-time">{formatDuration(s.totalMinutes * 60000)}</span>
              </div>
              <div class="ss-progress-bar">
                <div class="ss-progress-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
