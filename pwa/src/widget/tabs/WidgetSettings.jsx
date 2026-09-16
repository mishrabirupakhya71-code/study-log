/**
 * Widget Settings Tab
 * Adapted from pages/Settings.jsx — uses widget-db
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getSetting, setSetting } from '../widget-db.js';
import { currentUser } from '../auth-bridge.js';

export function WidgetSettings() {
  const [syncUrl, setSyncUrl] = useState('');
  const [syncSecret, setSyncSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    getSetting('workerUrl').then(v => { if (v) setSyncUrl(v); });
    getSetting('workerSecret').then(v => { if (v) setSyncSecret(v); });
    getSetting('theme').then(v => { if (v) setTheme(v); });
  }, []);

  async function handleSave() {
    await Promise.all([
      setSetting('workerUrl', syncUrl),
      setSetting('workerSecret', syncSecret),
      setSetting('theme', theme),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const user = currentUser.value;

  return (
    <div class="ss-tab-content ss-settings">
      <div class="ss-settings-section">
        <h3 class="ss-section-title">👤 Account</h3>
        <div class="ss-user-info-card">
          {user?.avatar && <img class="ss-user-avatar-lg" src={user.avatar} alt="" />}
          <div>
            <span class="ss-user-name-lg">{user?.name || 'Student'}</span>
            <span class="ss-user-email">{user?.email || ''}</span>
            <span class="ss-user-id">ID: {user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div class="ss-settings-section">
        <h3 class="ss-section-title">🔄 GitHub Sync</h3>
        <label class="ss-label">Worker URL</label>
        <input class="ss-input" type="url" placeholder="https://your-worker.workers.dev" value={syncUrl} onInput={e => setSyncUrl(e.target.value)} />
        <label class="ss-label">Sync Secret</label>
        <input class="ss-input" type="password" placeholder="Shared secret" value={syncSecret} onInput={e => setSyncSecret(e.target.value)} />
      </div>

      <div class="ss-settings-section">
        <h3 class="ss-section-title">🎨 Theme</h3>
        <div class="ss-theme-picker">
          <button class={`ss-theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>🌙 Dark</button>
          <button class={`ss-theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>☀️ Light</button>
        </div>
      </div>

      <button class="ss-btn ss-btn-primary ss-btn-block" onClick={handleSave}>{saved ? '✓ Saved!' : 'Save Settings'}</button>

      <div class="ss-settings-footer">
        <span class="ss-version">StudySync Widget v1.0.0</span>
      </div>
    </div>
  );
}
