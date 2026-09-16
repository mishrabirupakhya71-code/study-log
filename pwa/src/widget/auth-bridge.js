/**
 * StudySync Auth Bridge
 * ---------------------
 * Connects the embedded widget to the host website's user authentication.
 * The host website provides user info via:
 *   1. window.StudySyncConfig object (set before loading the widget)
 *   2. A callback function that resolves the current user
 *   3. DOM data-attributes on the widget container
 *
 * The bridge normalizes all sources into a standard user object:
 *   { id, name, email, avatar, role }
 */

import { signal, computed } from '@preact/signals';

// Current authenticated user from the host website
export const currentUser = signal(null);
export const isAuthenticated = computed(() => currentUser.value !== null);
export const authError = signal(null);

/**
 * Initialize auth bridge — reads user info from the host website.
 * Call this once when the widget mounts.
 */
export async function initAuthBridge() {
  try {
    // Priority 1: window.StudySyncConfig.user (synchronous)
    if (window.StudySyncConfig?.user) {
      const u = window.StudySyncConfig.user;
      currentUser.value = normalizeUser(u);
      return currentUser.value;
    }

    // Priority 2: window.StudySyncConfig.getUser() (async callback)
    if (typeof window.StudySyncConfig?.getUser === 'function') {
      const u = await window.StudySyncConfig.getUser();
      if (u) {
        currentUser.value = normalizeUser(u);
        return currentUser.value;
      }
    }

    // Priority 3: Read from DOM container data-attributes
    const container = document.getElementById('studysync-widget') ||
                      document.querySelector('[data-studysync]');
    if (container) {
      const userId = container.dataset.userId;
      const userName = container.dataset.userName;
      const userEmail = container.dataset.userEmail;
      const userAvatar = container.dataset.userAvatar;
      if (userId) {
        currentUser.value = normalizeUser({
          id: userId,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
        });
        return currentUser.value;
      }
    }

    // Priority 4: Check for auth cookie/token → call host API
    if (window.StudySyncConfig?.authApiUrl) {
      const res = await fetch(window.StudySyncConfig.authApiUrl, {
        credentials: 'include', // Send cookies from host domain
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const u = await res.json();
        currentUser.value = normalizeUser(u);
        return currentUser.value;
      }
    }

    // No auth source found
    authError.value = 'No user session detected. Please log in to the website first.';
    return null;

  } catch (err) {
    console.error('[StudySync] Auth bridge error:', err);
    authError.value = err.message;
    return null;
  }
}

/**
 * Listen for user changes from the host website (e.g., login/logout).
 */
export function onUserChange(callback) {
  // Host website can dispatch a custom event to update user
  window.addEventListener('studysync:userchange', (e) => {
    if (e.detail) {
      currentUser.value = normalizeUser(e.detail);
    } else {
      currentUser.value = null;
    }
    callback?.(currentUser.value);
  });
}

/**
 * Get a unique storage key scoped to the current user,
 * so multiple students on the same browser don't clash.
 */
export function getUserStorageKey(base) {
  const userId = currentUser.value?.id || 'anonymous';
  return `studysync_${userId}_${base}`;
}

/**
 * Normalize different user object shapes into our standard format.
 */
function normalizeUser(raw) {
  return {
    id: raw.id || raw.userId || raw.uid || raw._id || String(Date.now()),
    name: raw.name || raw.displayName || raw.username || raw.fullName || 'Student',
    email: raw.email || raw.emailAddress || '',
    avatar: raw.avatar || raw.avatarUrl || raw.photoURL || raw.profilePic || '',
    role: raw.role || raw.userRole || 'student',
  };
}
