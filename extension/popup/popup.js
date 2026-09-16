/**
 * StudySync Extension — Popup Script
 * Shows quick stats and opens the widget on the active tab.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load user info
  chrome.storage.local.get(['user'], (data) => {
    if (data.user) {
      const section = document.getElementById('userSection');
      section.style.display = 'flex';
      document.getElementById('userName').textContent = data.user.name || data.user.id;
      document.getElementById('userEmail').textContent = data.user.email || '';
      if (data.user.avatar) {
        document.getElementById('userAvatar').src = data.user.avatar;
      }
    }
  });

  // Load timer state
  chrome.storage.local.get(['isTimerRunning'], (data) => {
    document.getElementById('timerStatus').textContent =
      data.isTimerRunning ? '▶ Running' : 'Idle';
    if (data.isTimerRunning) {
      document.getElementById('timerStatus').style.color = '#39d353';
    }
  });

  // Open widget on current tab
  document.getElementById('openWidget').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Toggle the widget panel
          const fab = document.getElementById('studysync-fab');
          if (fab) fab.click();
        },
      });
      window.close();
    }
  });

  // Settings link
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage?.() || chrome.tabs.create({ url: 'options/options.html' });
  });
});
