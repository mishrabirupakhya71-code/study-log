/**
 * StudySync Widget Entry Point
 * ============================
 * Exposes window.StudySync = { init(), destroy(), toggle() }
 * The host website includes the built JS/CSS, then calls:
 *
 *   StudySync.init({
 *     container: '#studysync-container',   // CSS selector or DOM element
 *     apiUrl: 'https://your-worker.dev',   // optional
 *   });
 *
 * Auth comes from window.StudySyncConfig.user or other auth-bridge sources.
 */

import { h, render } from 'preact';
import { WidgetApp } from './WidgetApp.jsx';
import { initAuthBridge } from './auth-bridge.js';
import './widget-styles.css';

let widgetRoot = null;
let widgetContainer = null;
let isOpen = false;

function resolveContainer(target) {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector(target);
  return target;
}

const StudySync = {
  /**
   * Initialize the widget.
   * @param {Object} config
   * @param {string|HTMLElement} config.container — where to render (required for inline mode)
   * @param {string} config.apiUrl — Cloudflare Worker URL
   * @param {'inline'|'fab'} config.mode — 'inline' renders directly; 'fab' shows floating button (default: fab)
   */
  init(config = {}) {
    const mode = config.mode || 'fab';

    // Store apiUrl globally for widget-db sync functions
    if (config.apiUrl) {
      window.__studysync_apiUrl = config.apiUrl;
    }

    if (mode === 'inline') {
      widgetContainer = resolveContainer(config.container);
      if (!widgetContainer) {
        console.error('[StudySync] Container not found:', config.container);
        return;
      }
      widgetContainer.classList.add('ss-widget-root', 'ss-inline');
      render(h(WidgetApp, null), widgetContainer);
    } else {
      // FAB mode — create floating panel
      widgetContainer = document.createElement('div');
      widgetContainer.className = 'ss-widget-root ss-fab-mode';
      widgetContainer.innerHTML = '';
      document.body.appendChild(widgetContainer);

      // Create FAB button
      const fab = document.createElement('button');
      fab.className = 'ss-fab-button';
      fab.innerHTML = '📖';
      fab.title = 'StudySync';
      fab.onclick = () => StudySync.toggle();
      document.body.appendChild(fab);
      widgetRoot = fab;

      // Render widget panel (initially hidden)
      widgetContainer.style.display = 'none';
      render(h(WidgetApp, null), widgetContainer);
    }

    console.log('[StudySync] Widget initialized in', mode, 'mode');
  },

  /** Toggle widget visibility (FAB mode only) */
  toggle() {
    if (!widgetContainer) return;
    isOpen = !isOpen;
    widgetContainer.style.display = isOpen ? 'flex' : 'none';
    if (widgetRoot) widgetRoot.classList.toggle('active', isOpen);
  },

  /** Destroy and clean up the widget */
  destroy() {
    if (widgetContainer) {
      render(null, widgetContainer);
      if (widgetContainer.parentNode && widgetContainer.classList.contains('ss-fab-mode')) {
        widgetContainer.parentNode.removeChild(widgetContainer);
      }
    }
    if (widgetRoot) {
      widgetRoot.parentNode?.removeChild(widgetRoot);
    }
    widgetRoot = null;
    widgetContainer = null;
    isOpen = false;
    console.log('[StudySync] Widget destroyed');
  },

  /** Check if the widget is currently open */
  get isOpen() { return isOpen; },
};

// Expose globally
window.StudySync = StudySync;

export default StudySync;
