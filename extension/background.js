/**
 * StudySync Extension — Background Service Worker
 * Handles alarms for study reminders and syncs.
 */

// Set up periodic alarm for study reminders
chrome.runtime.onInstalled.addListener(() => {
  console.log('[StudySync] Extension installed');

  // Create alarm for hourly study reminders (if enabled)
  chrome.alarms.create('studyReminder', { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'studyReminder') {
    chrome.storage.local.get(['reminderEnabled', 'isTimerRunning'], (data) => {
      if (data.reminderEnabled && !data.isTimerRunning) {
        chrome.notifications.create('studyReminder', {
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: 'StudySync Reminder',
          message: "Time to study! Open StudySync to start tracking.",
          priority: 1,
        });
      }
    });
  }
});

// Listen for messages from content script / popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TIMER_STATE') {
    // Broadcast timer state to other contexts
    chrome.storage.local.set({ isTimerRunning: message.isRunning });
  }

  if (message.type === 'GET_USER') {
    // Return stored user info
    chrome.storage.local.get(['user'], (data) => {
      sendResponse({ user: data.user || null });
    });
    return true; // async sendResponse
  }

  if (message.type === 'SET_USER') {
    chrome.storage.local.set({ user: message.user });
    sendResponse({ ok: true });
  }
});
