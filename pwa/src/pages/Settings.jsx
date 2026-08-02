import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getSetting, setSetting } from '../services/db.js';

export function Settings() {
  const [workerUrl, setWorkerUrl] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSetting('workerUrl').then(v => v && setWorkerUrl(v));
    getSetting('sharedSecret').then(v => v && setSharedSecret(v));
  }, []);

  async function handleSave() {
    await setSetting('workerUrl', workerUrl);
    await setSetting('sharedSecret', sharedSecret);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div class="page settings-page">
      <header class="page-header"><h1>⚙️ Settings</h1></header>
      <div class="card">
        <h3 class="card-title">🔗 GitHub Sync</h3>
        <p class="card-desc">Connect to your Cloudflare Worker to sync study data to GitHub.</p>
        <input class="input" placeholder="Worker URL (e.g., https://studysync.workers.dev)" value={workerUrl} onInput={e => setWorkerUrl(e.target.value)} />
        <input class="input" type="password" placeholder="Shared Secret" value={sharedSecret} onInput={e => setSharedSecret(e.target.value)} />
        <button class="btn btn-primary" onClick={handleSave}>{saved ? '✓ Saved!' : 'Save'}</button>
      </div>
      <div class="card">
        <h3 class="card-title">📍 Locations</h3>
        <p class="card-desc">Set your home and college coordinates for Tasker geofencing.</p>
        <div class="location-group"><label>Home Location</label><button class="btn btn-secondary btn-sm">📍 Pin Current Location</button></div>
        <div class="location-group"><label>College Location</label><button class="btn btn-secondary btn-sm">📍 Pin Current Location</button></div>
      </div>
      <div class="card">
        <h3 class="card-title">📱 About</h3>
        <p class="card-desc">StudySync v1.0 — YPT-inspired study tracker with GitHub logging.</p>
      </div>
    </div>
  );
}
