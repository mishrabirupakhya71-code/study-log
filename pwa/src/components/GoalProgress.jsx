import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { todayMinutes, weeklyMinutes } from '../store/state.js';
import { getGoal, setGoal, getSessionsInRange, getTotalStudyMinutesToday } from '../services/db.js';
import { getToday, getWeekStart, formatDuration } from '../utils/time.js';

export function GoalProgress() {
  const [dailyTarget, setDailyTarget] = useState(240);
  const [weeklyTarget, setWeeklyTarget] = useState(1500);
  const [editing, setEditing] = useState(null);

  useEffect(() => { loadGoals(); loadProgress(); }, []);

  async function loadGoals() {
    const daily = await getGoal('daily');
    const weekly = await getGoal('weekly');
    if (daily) setDailyTarget(daily.targetMinutes);
    if (weekly) setWeeklyTarget(weekly.targetMinutes);
  }

  async function loadProgress() {
    todayMinutes.value = await getTotalStudyMinutesToday(getToday());
    const weekStart = getWeekStart();
    const sessions = await getSessionsInRange(weekStart, getToday());
    weeklyMinutes.value = sessions.reduce((sum, s) => sum + Math.round(s.duration / 60000), 0);
  }

  async function saveGoal(type, minutes) {
    await setGoal(type, minutes);
    setEditing(null);
  }

  const dailyPct = Math.min(100, Math.round((todayMinutes.value / dailyTarget) * 100));
  const weeklyPct = Math.min(100, Math.round((weeklyMinutes.value / weeklyTarget) * 100));

  return (
    <div class="goal-progress">
      <h3 class="section-title">🎯 Goals</h3>
      <div class="goal-item" onClick={() => setEditing('daily')}>
        <div class="goal-header">
          <span class="goal-label">Today</span>
          <span class="goal-value">{formatDuration(todayMinutes.value * 60000)} / {formatDuration(dailyTarget * 60000)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style={{width: `${dailyPct}%`, backgroundColor: dailyPct >= 100 ? '#39d353' : '#45B7D1'}} /></div>
        <span class="goal-pct">{dailyPct}%</span>
      </div>
      <div class="goal-item" onClick={() => setEditing('weekly')}>
        <div class="goal-header">
          <span class="goal-label">This Week</span>
          <span class="goal-value">{formatDuration(weeklyMinutes.value * 60000)} / {formatDuration(weeklyTarget * 60000)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style={{width: `${weeklyPct}%`, backgroundColor: weeklyPct >= 100 ? '#39d353' : '#4ECDC4'}} /></div>
        <span class="goal-pct">{weeklyPct}%</span>
      </div>
      {editing && (
        <div class="modal-overlay" onClick={() => setEditing(null)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            <h3>Set {editing === 'daily' ? 'Daily' : 'Weekly'} Goal</h3>
            <div class="goal-input-group">
              <input type="number" class="input" value={Math.round((editing === 'daily' ? dailyTarget : weeklyTarget) / 60)} onInput={e => { const hrs = parseInt(e.target.value) || 0; if (editing === 'daily') setDailyTarget(hrs * 60); else setWeeklyTarget(hrs * 60); }} min="1" max="24" />
              <span>hours</span>
            </div>
            <button class="btn btn-primary" onClick={() => saveGoal(editing, editing === 'daily' ? dailyTarget : weeklyTarget)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
