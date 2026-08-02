import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { currentStreak, longestStreak } from '../store/state.js';
import { getCurrentStreak, getLongestStreak, getTotalStudyMinutesAllTime } from '../services/db.js';
import { getStudyLevel } from '../utils/badges.js';

export function StreakBoard() {
  const [level, setLevel] = useState({ level: 1, name: 'Sprout', icon: '🌱', color: '#8BC34A' });

  useEffect(() => {
    getCurrentStreak().then(s => { currentStreak.value = s; });
    getLongestStreak().then(s => { longestStreak.value = s; });
    getTotalStudyMinutesAllTime().then(m => { setLevel(getStudyLevel(Math.round(m / 60))); });
  }, []);

  return (
    <div class="streak-board">
      <div class="streak-item">
        <span class="streak-icon">🔥</span>
        <span class="streak-value">{currentStreak.value}</span>
        <span class="streak-label">Day Streak</span>
      </div>
      <div class="streak-item">
        <span class="streak-icon">{level.icon}</span>
        <span class="streak-value" style={{color: level.color}}>{level.name}</span>
        <span class="streak-label">Lv.{level.level}</span>
      </div>
      <div class="streak-item">
        <span class="streak-icon">🏆</span>
        <span class="streak-value">{longestStreak.value}</span>
        <span class="streak-label">Best Streak</span>
      </div>
    </div>
  );
}
