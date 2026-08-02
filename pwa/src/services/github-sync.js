import { getPendingSyncItems, markSynced, getSetting } from './db.js';
import { studySessionMarkdown, dailyLogMarkdown, assignmentMarkdown } from '../utils/markdown.js';

export async function syncToGitHub() {
  const workerUrl = await getSetting('workerUrl');
  const secret = await getSetting('sharedSecret');
  if (!workerUrl || !secret) return;

  const pending = await getPendingSyncItems();
  for (const item of pending) {
    try {
      let endpoint, body;
      if (item.type === 'study-session') {
        endpoint = '/api/sync/session';
        body = { ...item.data, markdown: studySessionMarkdown(item.data) };
      } else if (item.type === 'daily-log') {
        endpoint = '/api/sync/daily-log';
        body = item.data;
      } else if (item.type === 'assignment') {
        endpoint = '/api/sync/assignment';
        body = { ...item.data, markdown: assignmentMarkdown(item.data) };
      } else continue;

      const res = await fetch(workerUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
        body: JSON.stringify(body),
      });
      if (res.ok) await markSynced(item.id);
    } catch (e) {
      console.warn('Sync failed for item', item.id, e);
    }
  }
}

// Register for background sync if supported
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      return reg.sync.register('sync-github-data');
    }).catch(e => console.warn('Background sync registration failed', e));
  }
}
