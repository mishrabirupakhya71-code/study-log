export const BADGE_DEFINITIONS = [
  // Study hours milestones
  { id: 'hours-10', name: 'Getting Started', description: '10 hours studied', icon: '🌱', check: (stats) => stats.totalHours >= 10 },
  { id: 'hours-50', name: 'Dedicated', description: '50 hours studied', icon: '📖', check: (stats) => stats.totalHours >= 50 },
  { id: 'hours-100', name: 'Centurion', description: '100 hours studied', icon: '💯', check: (stats) => stats.totalHours >= 100 },
  { id: 'hours-500', name: 'Scholar', description: '500 hours studied', icon: '🎓', check: (stats) => stats.totalHours >= 500 },
  { id: 'hours-1000', name: 'Master', description: '1000 hours studied', icon: '🏆', check: (stats) => stats.totalHours >= 1000 },

  // Streak milestones
  { id: 'streak-3', name: 'Three-peat', description: '3-day streak', icon: '🔥', check: (stats) => stats.currentStreak >= 3 },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day streak', icon: '⚡', check: (stats) => stats.currentStreak >= 7 },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day streak', icon: '🌟', check: (stats) => stats.currentStreak >= 30 },
  { id: 'streak-100', name: 'Unstoppable', description: '100-day streak', icon: '💎', check: (stats) => stats.currentStreak >= 100 },
  { id: 'streak-365', name: 'Legendary', description: '365-day streak', icon: '👑', check: (stats) => stats.currentStreak >= 365 },

  // Session milestones
  { id: 'sessions-10', name: 'Warming Up', description: '10 study sessions', icon: '📝', check: (stats) => stats.totalSessions >= 10 },
  { id: 'sessions-50', name: 'Regular', description: '50 study sessions', icon: '📚', check: (stats) => stats.totalSessions >= 50 },
  { id: 'sessions-200', name: 'Committed', description: '200 study sessions', icon: '🎯', check: (stats) => stats.totalSessions >= 200 },

  // Subject variety
  { id: 'subjects-3', name: 'Well-Rounded', description: 'Study 3 different subjects', icon: '🎨', check: (stats) => stats.subjectCount >= 3 },
  { id: 'subjects-5', name: 'Renaissance', description: 'Study 5 different subjects', icon: '🌈', check: (stats) => stats.subjectCount >= 5 },

  // Single session duration
  { id: 'long-session-2h', name: 'Deep Focus', description: '2+ hour study session', icon: '🧘', check: (stats) => stats.longestSession >= 120 },
  { id: 'long-session-4h', name: 'Marathon', description: '4+ hour study session', icon: '🏃', check: (stats) => stats.longestSession >= 240 },
];

export function checkBadges(stats) {
  return BADGE_DEFINITIONS.filter(badge => badge.check(stats));
}

export function getNewBadges(stats, existingBadgeIds) {
  const earned = checkBadges(stats);
  return earned.filter(b => !existingBadgeIds.includes(b.id));
}

// Study level based on total hours (YPT-inspired tier system)
export function getStudyLevel(totalHours) {
  if (totalHours >= 1000) return { level: 6, name: 'Master', icon: '👑', color: '#FFD700' };
  if (totalHours >= 500) return { level: 5, name: 'Expert', icon: '💎', color: '#E040FB' };
  if (totalHours >= 200) return { level: 4, name: 'Advanced', icon: '⚡', color: '#00BCD4' };
  if (totalHours >= 100) return { level: 3, name: 'Intermediate', icon: '🌟', color: '#4CAF50' };
  if (totalHours >= 30) return { level: 2, name: 'Beginner', icon: '📖', color: '#2196F3' };
  return { level: 1, name: 'Sprout', icon: '🌱', color: '#8BC34A' };
}
