import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { isTimerRunning, timerStartTime, timerElapsed, timerPausedTime, activeSubject, timerDisplay, startTimerTick, stopTimerTick, todayMinutes } from '../store/state.js';
import { getAllSubjects, addSession, getTotalStudyMinutesToday, addToSyncQueue } from '../services/db.js';
import { getToday } from '../utils/time.js';
import { SubjectPicker } from './SubjectPicker.jsx';

export function StudyTimer() {
  const [subjects, setSubjects] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseStart = useRef(null);

  useEffect(() => {
    getAllSubjects().then(setSubjects);
    getTotalStudyMinutesToday(getToday()).then(m => { todayMinutes.value = m; });
    const saved = localStorage.getItem('activeTimer');
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
    localStorage.setItem('activeTimer', JSON.stringify({ startTime: timerStartTime.value, pausedTime: 0, subject: activeSubject.value }));
  }

  function handlePause() {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseStart.current;
      timerPausedTime.value += pauseDuration;
      setIsPaused(false);
      localStorage.setItem('activeTimer', JSON.stringify({ startTime: timerStartTime.value, pausedTime: timerPausedTime.value, subject: activeSubject.value }));
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
      localStorage.removeItem('activeTimer');
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
    localStorage.removeItem('activeTimer');
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
    <div class="study-timer">
      {showPicker && <SubjectPicker subjects={subjects} onSelect={handleSubjectSelect} onClose={() => setShowPicker(false)} onSubjectsChange={setSubjects} />}
      <div class="timer-subject" onClick={() => !running && setShowPicker(true)}>
        {subject ? (<span class="subject-tag" style={{backgroundColor: subject.color}}>{subject.name}</span>) : (<span class="subject-tag placeholder">Tap to select subject</span>)}
      </div>
      <div class={`timer-display ${running ? 'active' : ''} ${isPaused ? 'paused' : ''}`}>
        <span class="timer-hours">{display.hours}</span>
        <span class="timer-sep">:</span>
        <span class="timer-minutes">{display.minutes}</span>
        <span class="timer-sep">:</span>
        <span class="timer-seconds">{display.seconds}</span>
      </div>
      <div class="timer-controls">
        {!running ? (
          <button class="btn btn-start" onClick={handleStart}>▶ Start Studying</button>
        ) : (
          <>
            <button class={`btn btn-pause ${isPaused ? 'btn-resume' : ''}`} onClick={handlePause}>{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
            <button class="btn btn-stop" onClick={handleStop}>⏹ Stop</button>
          </>
        )}
      </div>
    </div>
  );
}
