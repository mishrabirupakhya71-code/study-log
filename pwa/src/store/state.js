import { signal, computed } from '@preact/signals';

// Timer state
export const isTimerRunning = signal(false);
export const timerStartTime = signal(null);    // Date.now() when started
export const timerElapsed = signal(0);          // ms elapsed (updated by requestAnimationFrame)
export const timerPausedTime = signal(0);       // accumulated pause time
export const activeSubject = signal(null);      // { id, name, color }

// UI state
export const currentPage = signal('dashboard');
export const subjects = signal([]);
export const todayMinutes = signal(0);
export const currentStreak = signal(0);
export const longestStreak = signal(0);
export const weeklyMinutes = signal(0);

// Lockdown
export const isLockdownActive = signal(false);

// Formatted timer display
export const timerDisplay = computed(() => {
  const ms = timerElapsed.value;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
});

// Timer tick using requestAnimationFrame (called from StudyTimer component)
let rafId = null;

export function startTimerTick() {
  function tick() {
    if (isTimerRunning.value && timerStartTime.value) {
      timerElapsed.value = Date.now() - timerStartTime.value - timerPausedTime.value;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

export function stopTimerTick() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}
