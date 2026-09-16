/**
 * StudySync Embeddable Widget
 * ===========================
 * Self-contained Preact app that renders inside any website.
 * Uses internal tab navigation (no router), user-scoped IndexedDB,
 * and receives auth from the host website.
 */

import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { currentTab, todayMinutes, isTimerRunning } from './widget-state.js';
import { currentUser, isAuthenticated, authError, initAuthBridge, onUserChange } from './auth-bridge.js';
import { formatDuration } from '../utils/time.js';

// Widget tab components (self-contained, using widget-db)
import { WidgetDashboard } from './tabs/WidgetDashboard.jsx';
import { WidgetHomework } from './tabs/WidgetHomework.jsx';
import { WidgetAnalytics } from './tabs/WidgetAnalytics.jsx';
import { WidgetSettings } from './tabs/WidgetSettings.jsx';

const TABS = [
  { id: 'dashboard', label: '🏠', title: 'Dashboard' },
  { id: 'homework', label: '📚', title: 'Homework' },
  { id: 'analytics', label: '📊', title: 'Analytics' },
  { id: 'settings', label: '⚙️', title: 'Settings' },
];

export function WidgetApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuthBridge().then(() => setReady(true));
    onUserChange(() => { /* re-render on user change */ });
  }, []);

  if (!ready) {
    return (
      <div class="ss-widget-loading">
        <div class="ss-spinner" />
        <span>Loading StudySync…</span>
      </div>
    );
  }

  if (!isAuthenticated.value) {
    return (
      <div class="ss-widget-auth-error">
        <span class="ss-icon">🔒</span>
        <p>{authError.value || 'Please log in to the website to use StudySync.'}</p>
      </div>
    );
  }

  const tab = currentTab.value;

  return (
    <div class="ss-widget-app">
      <div class="ss-widget-header">
        <div class="ss-header-left">
          <span class="ss-logo">📖 StudySync</span>
          {isTimerRunning.value && <span class="ss-timer-badge">⏱ Active</span>}
        </div>
        <div class="ss-header-right">
          {currentUser.value?.avatar && (
            <img class="ss-user-avatar" src={currentUser.value.avatar} alt="" />
          )}
          <span class="ss-user-name">{currentUser.value?.name}</span>
        </div>
      </div>

      <div class="ss-widget-content">
        {tab === 'dashboard' && <WidgetDashboard />}
        {tab === 'homework' && <WidgetHomework />}
        {tab === 'analytics' && <WidgetAnalytics />}
        {tab === 'settings' && <WidgetSettings />}
      </div>

      <nav class="ss-widget-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            class={`ss-nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => { currentTab.value = t.id; }}
            title={t.title}
          >
            <span class="ss-nav-icon">{t.label}</span>
            <span class="ss-nav-label">{t.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
