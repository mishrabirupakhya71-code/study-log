import { h } from 'preact';
import { Router, route } from 'preact-router';
import { currentPage } from './store/state.js';
import { Dashboard } from './pages/Dashboard.jsx';
import { Homework } from './pages/Homework.jsx';
import { DailyLog } from './pages/DailyLog.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Settings } from './pages/Settings.jsx';

function handleRoute(e) {
  currentPage.value = e.url.replace('/', '') || 'dashboard';
}

function NavItem({ icon, label, path }) {
  const isActive = currentPage.value === (path.replace('/', '') || 'dashboard');
  return (
    <button class={`nav-item ${isActive ? 'active' : ''}`} onClick={() => route(path)}>
      <span class="nav-icon">{icon}</span>
      <span class="nav-label">{label}</span>
    </button>
  );
}

export function App() {
  return (
    <div class="app">
      <main class="app-content">
        <Router onChange={handleRoute}>
          <Dashboard path="/" />
          <Dashboard path="/dashboard" />
          <Homework path="/homework" />
          <DailyLog path="/log" />
          <Analytics path="/analytics" />
          <Settings path="/settings" />
        </Router>
      </main>
      <nav class="bottom-nav">
        <NavItem icon="⏱️" label="Study" path="/" />
        <NavItem icon="📚" label="Homework" path="/homework" />
        <NavItem icon="📋" label="Log" path="/log" />
        <NavItem icon="📊" label="Analytics" path="/analytics" />
        <NavItem icon="⚙️" label="Settings" path="/settings" />
      </nav>
    </div>
  );
}
