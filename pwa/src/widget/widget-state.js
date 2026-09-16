/**
 * StudySync Widget State
 * ----------------------
 * Standalone version of store/state.js for the widget.
 * Uses Preact signals — the same reactive system as the PWA.
 */

import { signal, computed } from '@preact/signals';

// Timer state
export const isTimerRunning = signal(false);
export const timerStartTime = signal(null);
export const timerElapsed = signal(0);
export const timerPausedTime = signal(0);
export const activeSubject = signal(null);

// UI state
export const currentTab = signal('dashboard');
export const subjects = signal([]);
export const todayMinutes = signal(0);
export const currentStreak = signal(0);
export const longestStreak = signal(0);
export const weeklyMinutes = signal(0);

// Timer display
export const timerDisplay = computed(() => {
  const ms = timerElapsed.value;
  const totalSec = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return { hours, minutes, seconds };
});

// Timer tick
let rafId = null;

export function startTimerTick() {
  function tick() {
    if (isTimerRunning.value) {
      timerElapsed.value = Date.now() - timerStartTime.value - timerPausedTime.value;
      rafId = requestAnimationFrame(tick);
    }
  }
  rafId = requestAnimationFrame(tick);
}

export function stopTimerTick() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}
