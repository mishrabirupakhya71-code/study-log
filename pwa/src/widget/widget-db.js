/**
 * StudySync Widget DB
 * -------------------
 * User-scoped IndexedDB wrapper.
 * Each student gets their own database so data never leaks between accounts.
 */

import { openDB } from 'idb';
import { currentUser } from './auth-bridge.js';

function getDBName() {
  const userId = currentUser.value?.id || 'anonymous';
  return `studysync_${userId}`;
}

const DB_VERSION = 1;

export async function getDB() {
  return openDB(getDBName(), DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
        store.createIndex('by-subject', 'subjectId');
      }
      if (!db.objectStoreNames.contains('homework')) {
        const store = db.createObjectStore('homework', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-due', 'dueDate');
        store.createIndex('by-status', 'status');
      }
      if (!db.objectStoreNames.contains('daily_logs')) {
        db.createObjectStore('daily_logs', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('streaks')) {
        db.createObjectStore('streaks', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('ddays')) {
        db.createObjectStore('ddays', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-status', 'status');
      }
    },
  });
}

// ── Subject helpers ──────────────────────────────────────
export async function getAllSubjects() {
  const db = await getDB();
  return db.getAll('subjects');
}

export async function addSubject(subject) {
  const db = await getDB();
  return db.add('subjects', subject);
}

export async function updateSubject(subject) {
  const db = await getDB();
  return db.put('subjects', subject);
}

export async function deleteSubject(id) {
  const db = await getDB();
  return db.delete('subjects', id);
}

// ── Session helpers ──────────────────────────────────────
export async function addSession(session) {
  const db = await getDB();
  const subject = await db.get('subjects', session.subjectId);
  if (subject) {
    subject.totalMinutes = (subject.totalMinutes || 0) + Math.round(session.duration / 60000);
    await db.put('subjects', subject);
  }
  await updateStreak(session.date, session.duration);
  return db.add('sessions', session);
}

export async function getSessionsByDate(date) {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-date', date);
}

export async function getSessionsInRange(startDate, endDate) {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.filter(s => s.date >= startDate && s.date <= endDate);
}

export async function getTotalStudyMinutesToday(date) {
  const sessions = await getSessionsByDate(date);
  return sessions.reduce((sum, s) => sum + Math.round(s.duration / 60000), 0);
}

export async function getTotalStudyMinutesAllTime() {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.reduce((sum, s) => sum + Math.round(s.duration / 60000), 0);
}

// ── Streak helpers ───────────────────────────────────────
async function updateStreak(date, durationMs) {
  const db = await getDB();
  const existing = await db.get('streaks', date);
  if (existing) {
    existing.totalMinutes += Math.round(durationMs / 60000);
    existing.studied = true;
    await db.put('streaks', existing);
  } else {
    await db.add('streaks', { date, studied: true, totalMinutes: Math.round(durationMs / 60000) });
  }
}

export async function getCurrentStreak() {
  const db = await getDB();
  const all = await db.getAll('streaks');
  if (all.length === 0) return 0;
  const dates = all.filter(s => s.studied).map(s => s.date).sort().reverse();
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i + 1]);
    if (Math.round((curr - prev) / 86400000) === 1) {
      streak++;
    } else break;
  }
  return streak;
}

export async function getLongestStreak() {
  const db = await getDB();
  const all = await db.getAll('streaks');
  if (all.length === 0) return 0;
  const dates = all.filter(s => s.studied).map(s => s.date).sort();
  if (dates.length === 0) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < dates.length; i++) {
    if (Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ── Goals ────────────────────────────────────────────────
export async function getGoal(type) {
  const db = await getDB();
  return db.get('goals', type);
}

export async function setGoal(type, targetMinutes) {
  const db = await getDB();
  return db.put('goals', { id: type, type, targetMinutes });
}

// ── D-Days ───────────────────────────────────────────────
export async function getAllDdays() {
  const db = await getDB();
  return db.getAll('ddays');
}

export async function addDday(dday) {
  const db = await getDB();
  return db.add('ddays', { ...dday, createdAt: new Date().toISOString() });
}

export async function deleteDday(id) {
  const db = await getDB();
  return db.delete('ddays', id);
}

// ── Homework ─────────────────────────────────────────────
export async function getAllHomework() {
  const db = await getDB();
  return db.getAll('homework');
}

export async function addHomework(hw) {
  const db = await getDB();
  return db.add('homework', hw);
}

export async function updateHomework(hw) {
  const db = await getDB();
  return db.put('homework', hw);
}

export async function deleteHomework(id) {
  const db = await getDB();
  return db.delete('homework', id);
}

// ── Settings ─────────────────────────────────────────────
export async function getSetting(key) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row?.value;
}

export async function setSetting(key, value) {
  const db = await getDB();
  return db.put('settings', { key, value });
}

// ── Badges ───────────────────────────────────────────────
export async function getAllBadges() {
  const db = await getDB();
  return db.getAll('badges');
}

export async function addBadge(badge) {
  const db = await getDB();
  return db.put('badges', { ...badge, unlockedAt: new Date().toISOString() });
}

// ── Sync Queue ───────────────────────────────────────────
export async function addToSyncQueue(type, data) {
  const db = await getDB();
  return db.add('sync_queue', { type, data, status: 'pending', createdAt: new Date().toISOString() });
}

export async function getPendingSyncItems() {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-status', 'pending');
}

export async function markSynced(id) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    item.status = 'synced';
    await db.put('sync_queue', item);
  }
}

// ── Daily Logs ───────────────────────────────────────────
export async function getDailyLog(date) {
  const db = await getDB();
  return db.get('daily_logs', date);
}

export async function saveDailyLog(log) {
  const db = await getDB();
  return db.put('daily_logs', log);
}

export { saveDailyLog as updateDailyLog };

// ── Heatmap data ─────────────────────────────────────────
export async function getStudyHeatmapData(days = 365) {
  const db = await getDB();
  const all = await db.getAll('sessions');
  const map = {};
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];
  all.filter(s => s.date >= startStr).forEach(s => {
    map[s.date] = (map[s.date] || 0) + Math.round(s.duration / 60000);
  });
  return map;
}

// ── Subject Stats ────────────────────────────────────────
export async function getSubjectStats(startDate, endDate) {
  const sessions = await getSessionsInRange(startDate, endDate);
  const stats = {};
  sessions.forEach(s => {
    if (!stats[s.subjectId]) {
      stats[s.subjectId] = { name: s.subjectName, color: s.subjectColor, totalMinutes: 0, sessionCount: 0 };
    }
    stats[s.subjectId].totalMinutes += Math.round(s.duration / 60000);
    stats[s.subjectId].sessionCount++;
  });
  return stats;
}
