/**
 * Widget Dashboard Tab
 * Adapted from pages/Dashboard.jsx — uses widget-db and widget-state
 */

import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import {
  isTimerRunning, timerStartTime, timerElapsed, timerPausedTime,
  activeSubject, timerDisplay, startTimerTick, stopTimerTick,
  todayMinutes, currentStreak, longestStreak, weeklyMinutes,
} from '../widget-state.js';
import {
  getAllSubjects, addSubject, addSession, getTotalStudyMinutesToday,
  addToSyncQueue, getCurrentStreak, getLongestStreak, getTotalStudyMinutesAllTime,
  getGoal, setGoal, getSessionsInRange, getAllDdays, addDday, deleteDday,
  getStudyHeatmapData,
} from '../widget-db.js';
import { getToday, getWeekStart, formatDuration, daysUntil } from '../../utils/time.js';
import { getStudyLevel } from '../../utils/badges.js';

// ── Inline SubjectPicker ─────────────────────────────────
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'];

function SubjectPicker({ subjects, onSelect, onClose, onSubjectsChange }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const id = await addSubject({ name: newName.trim(), color: selectedColor, totalMinutes: 0 });
    const subject = { id, name: newName.trim(), color: selectedColor, totalMinutes: 0 };
    onSubjectsChange([...subjects, subject]);
    onSelect(subject);
  }

  return (
    <div class="ss-modal-overlay" onClick={onClose}>
      <div class="ss-modal" onClick={e => e.stopPropagation()}>
        <div class="ss-modal-header">
          <h3>{isCreating ? 'Create Subject' : 'Select Subject'}</h3>
          <button class="ss-modal-close" onClick={onClose}>✕</button>
        </div>
        {isCreating ? (
          <div class="ss-subject-create">
            <input type="text" class="ss-input" placeholder="Subject name (e.g., Math)" value={newName} onInput={e => setNewName(e.target.value)} autoFocus />
            <div class="ss-color-grid">
              {COLORS.map(c => (<button class={`ss-color-swatch ${c === selectedColor ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => setSelectedColor(c)} />))}
            </div>
            <div class="ss-modal-actions">
              <button class="ss-btn ss-btn-secondary" onClick={() => setIsCreating(false)}>Back</button>
              <button class="ss-btn ss-btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
            </div>
          </div>
        ) : (
          <div class="ss-subject-list">
            {subjects.map(s => (
              <button class="ss-subject-item" onClick={() => onSelect(s)} key={s.id}>
                <span class="ss-subject-dot" style={{ backgroundColor: s.color }} />
                <span class="ss-subject-name">{s.name}</span>
                <span class="ss-subject-time">{Math.round(s.totalMinutes / 60)}h</span>
              </button>
            ))}
            <button class="ss-subject-item ss-add-new" onClick={() => setIsCreating(true)}>
              <span class="ss-subject-dot">+</span>
              <span class="ss-subject-name">New Subject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Study Timer ──────────────────────────────────────────
function Timer() {
  const [subjects, setSubjects] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseStart = useRef(null);

  useEffect(() => {
    getAllSubjects().then(setSubjects);
    getTotalStudyMinutesToday(getToday()).then(m => { todayMinutes.value = m; });
    const saved = localStorage.getItem('studysync_activeTimer');
    if (saved) {
      const data = JSON.parse(saved);
      isTimerRunning.value = true;
      timerStartTime.value = data.startTime;
      timerPausedTime.value = data.pausedTime || 0;
      activeSubject.value = data.subject;
      startTimerTick();
    }
    return () => stopTimerTick();
  }, []);

  function handleStart() {
    if (!activeSubject.value) { setShowPicker(true); return; }
    isTimerRunning.value = true;
    timerStartTime.value = Date.now();
    timerPausedTime.value = 0;
    timerElapsed.value = 0;
    startTimerTick();
    localStorage.setItem('studysync_activeTimer', JSON.stringify({ startTime: timerStartTime.value, pausedTime: 0, subject: activeSubject.value }));
  }

  function handlePause() {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseStart.current;
      timerPausedTime.value += pauseDuration;
      setIsPaused(false);
      localStorage.setItem('studysync_activeTimer', JSON.stringify({ startTime: timerStartTime.value, pausedTime: timerPausedTime.value, subject: activeSubject.value }));
    } else {
      pauseStart.current = Date.now();
      setIsPaused(true);
    }
  }

  async function handleStop() {
    stopTimerTick();
    const now = Date.now();
    const duration = timerElapsed.value;
    if (duration < 60000) {
      isTimerRunning.value = false;
      timerElapsed.value = 0;
      localStorage.removeItem('studysync_activeTimer');
      return;
    }
    const session = {
      subjectId: activeSubject.value.id,
      subjectName: activeSubject.value.name,
      subjectColor: activeSubject.value.color,
      startTime: timerStartTime.value,
      endTime: now,
      duration,
      date: getToday(),
    };
    await addSession(session);
    await addToSyncQueue('study-session', session);
    todayMinutes.value = await getTotalStudyMinutesToday(getToday());
    isTimerRunning.value = false;
    timerElapsed.value = 0;
    timerStartTime.value = null;
    setIsPaused(false);
    localStorage.removeItem('studysync_activeTimer');
  }

  function handleSubjectSelect(subject) {
    activeSubject.value = subject;
    setShowPicker(false);
    if (isTimerRunning.value) {
      handleStop().then(() => { activeSubject.value = subject; handleStart(); });
    }
  }

  const display = timerDisplay.value;
  const running = isTimerRunning.value;
  const subject = activeSubject.value;

  return (
    <div class="ss-study-timer">
      {showPicker && <SubjectPicker subjects={subjects} onSelect={handleSubjectSelect} onClose={() => setShowPicker(false)} onSubjectsChange={setSubjects} />}
      <div class="ss-timer-subject" onClick={() => !running && setShowPicker(true)}>
        {subject ? (<span class="ss-subject-tag" style={{ backgroundColor: subject.color }}>{subject.name}</span>) : (<span class="ss-subject-tag ss-placeholder">Tap to select subject</span>)}
      </div>
      <div class={`ss-timer-display ${running ? 'active' : ''} ${isPaused ? 'paused' : ''}`}>
        <span class="ss-timer-hours">{display.hours}</span>
        <span class="ss-timer-sep">:</span>
        <span class="ss-timer-minutes">{display.minutes}</span>
        <span class="ss-timer-sep">:</span>
        <span class="ss-timer-seconds">{display.seconds}</span>
      </div>
      <div class="ss-timer-controls">
        {!running ? (
          <button class="ss-btn ss-btn-start" onClick={handleStart}>▶ Start Studying</button>
        ) : (
          <>
            <button class={`ss-btn ss-btn-pause ${isPaused ? 'ss-btn-resume' : ''}`} onClick={handlePause}>{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
            <button class="ss-btn ss-btn-stop" onClick={handleStop}>⏹ Stop</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── StreakBoard ───────────────────────────────────────────
function StreakInfo() {
  const [level, setLevel] = useState({ level: 1, name: 'Sprout', icon: '🌱', color: '#8BC34A' });

  useEffect(() => {
    getCurrentStreak().then(s => { currentStreak.value = s; });
    getLongestStreak().then(s => { longestStreak.value = s; });
    getTotalStudyMinutesAllTime().then(m => { setLevel(getStudyLevel(Math.round(m / 60))); });
  }, []);

  return (
    <div class="ss-streak-board">
      <div class="ss-streak-item"><span class="ss-streak-icon">🔥</span><span class="ss-streak-value">{currentStreak.value}</span><span class="ss-streak-label">Day Streak</span></div>
      <div class="ss-streak-item"><span class="ss-streak-icon">{level.icon}</span><span class="ss-streak-value" style={{ color: level.color }}>{level.name}</span><span class="ss-streak-label">Lv.{level.level}</span></div>
      <div class="ss-streak-item"><span class="ss-streak-icon">🏆</span><span class="ss-streak-value">{longestStreak.value}</span><span class="ss-streak-label">Best Streak</span></div>
    </div>
  );
}

// ── GoalProgress ─────────────────────────────────────────
function Goals() {
  const [dailyTarget, setDailyTarget] = useState(240);
  const [weeklyTarget, setWeeklyTarget] = useState(1500);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    getGoal('daily').then(g => { if (g) setDailyTarget(g.targetMinutes); });
    getGoal('weekly').then(g => { if (g) setWeeklyTarget(g.targetMinutes); });
    loadProgress();
  }, []);

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
    <div class="ss-goal-progress">
      <h3 class="ss-section-title">🎯 Goals</h3>
      <div class="ss-goal-item" onClick={() => setEditing('daily')}>
        <div class="ss-goal-header"><span class="ss-goal-label">Today</span><span class="ss-goal-value">{formatDuration(todayMinutes.value * 60000)} / {formatDuration(dailyTarget * 60000)}</span></div>
        <div class="ss-progress-bar"><div class="ss-progress-fill" style={{ width: `${dailyPct}%`, backgroundColor: dailyPct >= 100 ? '#39d353' : '#45B7D1' }} /></div>
        <span class="ss-goal-pct">{dailyPct}%</span>
      </div>
      <div class="ss-goal-item" onClick={() => setEditing('weekly')}>
        <div class="ss-goal-header"><span class="ss-goal-label">This Week</span><span class="ss-goal-value">{formatDuration(weeklyMinutes.value * 60000)} / {formatDuration(weeklyTarget * 60000)}</span></div>
        <div class="ss-progress-bar"><div class="ss-progress-fill" style={{ width: `${weeklyPct}%`, backgroundColor: weeklyPct >= 100 ? '#39d353' : '#4ECDC4' }} /></div>
        <span class="ss-goal-pct">{weeklyPct}%</span>
      </div>
      {editing && (
        <div class="ss-modal-overlay" onClick={() => setEditing(null)}>
          <div class="ss-modal" onClick={e => e.stopPropagation()}>
            <h3>Set {editing === 'daily' ? 'Daily' : 'Weekly'} Goal</h3>
            <div class="ss-goal-input-group">
              <input type="number" class="ss-input" value={Math.round((editing === 'daily' ? dailyTarget : weeklyTarget) / 60)} onInput={e => { const hrs = parseInt(e.target.value) || 0; if (editing === 'daily') setDailyTarget(hrs * 60); else setWeeklyTarget(hrs * 60); }} min="1" max="24" />
              <span>hours</span>
            </div>
            <button class="ss-btn ss-btn-primary" onClick={() => saveGoal(editing, editing === 'daily' ? dailyTarget : weeklyTarget)}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Calendar Heatmap ─────────────────────────────────────
const HEATMAP_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
function getIntensity(minutes) {
  if (!minutes || minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function Calendar() {
  const [weeks, setWeeks] = useState([]);
  useEffect(() => {
    getStudyHeatmapData(140).then(heatmap => {
      const result = [];
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 139);
      start.setDate(start.getDate() - start.getDay());
      let currentWeek = [];
      const d = new Date(start);
      while (d <= today) {
        const dateStr = d.toISOString().split('T')[0];
        currentWeek.push({ date: dateStr, minutes: heatmap[dateStr] || 0, day: d.getDay() });
        if (d.getDay() === 6) { result.push(currentWeek); currentWeek = []; }
        d.setDate(d.getDate() + 1);
      }
      if (currentWeek.length > 0) result.push(currentWeek);
      setWeeks(result);
    });
  }, []);

  return (
    <div class="ss-study-calendar">
      <h3 class="ss-section-title">📅 Study Calendar</h3>
      <div class="ss-heatmap-container">
        <div class="ss-heatmap-grid">
          {weeks.map((week, wi) => (
            <div class="ss-heatmap-week" key={wi}>
              {week.map(cell => (
                <div class="ss-heatmap-cell" style={{ backgroundColor: HEATMAP_COLORS[getIntensity(cell.minutes)] }} title={`${cell.date}: ${cell.minutes || 0} min`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div class="ss-heatmap-legend">
        <span>Less</span>
        {HEATMAP_COLORS.map(c => <div class="ss-heatmap-cell" style={{ backgroundColor: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}

// ── D-Day Counter ────────────────────────────────────────
function DDay() {
  const [ddays, setDdays] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => { getAllDdays().then(setDdays); }, []);

  async function handleAdd() {
    if (!title.trim() || !targetDate) return;
    await addDday({ title: title.trim(), targetDate });
    setDdays(await getAllDdays());
    setTitle(''); setTargetDate(''); setShowAdd(false);
  }

  async function handleDelete(id) {
    await deleteDday(id);
    setDdays(await getAllDdays());
  }

  return (
    <div class="ss-dday-counter">
      <div class="ss-section-header">
        <h3 class="ss-section-title">🎯 D-Day</h3>
        <button class="ss-btn-icon" onClick={() => setShowAdd(!showAdd)}>+</button>
      </div>
      {showAdd && (
        <div class="ss-dday-form">
          <input class="ss-input" placeholder="Exam name" value={title} onInput={e => setTitle(e.target.value)} />
          <input class="ss-input" type="date" value={targetDate} onInput={e => setTargetDate(e.target.value)} />
          <button class="ss-btn ss-btn-primary ss-btn-sm" onClick={handleAdd}>Add</button>
        </div>
      )}
      <div class="ss-dday-list">
        {ddays.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).map(d => {
          const days = daysUntil(d.targetDate);
          const isPast = days < 0;
          return (
            <div class={`ss-dday-card ${isPast ? 'past' : ''}`} key={d.id}>
              <div class="ss-dday-info"><span class="ss-dday-title">{d.title}</span><span class="ss-dday-date">{new Date(d.targetDate).toLocaleDateString()}</span></div>
              <div class="ss-dday-count"><span class={`ss-dday-number ${days <= 7 ? 'urgent' : ''}`}>{isPast ? `D+${Math.abs(days)}` : days === 0 ? 'D-Day!' : `D-${days}`}</span></div>
              <button class="ss-btn-icon ss-btn-delete" onClick={() => handleDelete(d.id)}>✕</button>
            </div>
          );
        })}
        {ddays.length === 0 && <div class="ss-empty-state">No exam dates set</div>}
      </div>
    </div>
  );
}

// ── Dashboard Export ─────────────────────────────────────
export function WidgetDashboard() {
  return (
    <div class="ss-tab-content ss-dashboard">
      <div class="ss-today-total">
        <span class="ss-today-label">Today</span>
        <span class="ss-today-value">{formatDuration(todayMinutes.value * 60000)}</span>
      </div>
      <StreakInfo />
      <Timer />
      <Goals />
      <Calendar />
      <DDay />
    </div>
  );
}
