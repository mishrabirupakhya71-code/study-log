/**
 * StudySync Extension — Content Script
 * Injects the floating StudySync widget button into web pages.
 * When clicked, opens the widget in an iframe from the extension.
 */

(function() {
  // Prevent double injection
  if (document.getElementById('studysync-ext-root')) return;

  // Create container
  const root = document.createElement('div');
  root.id = 'studysync-ext-root';
  document.body.appendChild(root);

  // Create FAB button
  const fab = document.createElement('button');
  fab.id = 'studysync-fab';
  fab.innerHTML = '📖';
  fab.title = 'StudySync';
  root.appendChild(fab);

  // Create widget panel (iframe)
  const panel = document.createElement('div');
  panel.id = 'studysync-panel';
  panel.style.display = 'none';

  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('widget/widget.html');
  iframe.id = 'studysync-iframe';
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  panel.appendChild(iframe);
  root.appendChild(panel);

  // Toggle panel
  let isOpen = false;
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'block' : 'none';
    fab.classList.toggle('active', isOpen);
    fab.innerHTML = isOpen ? '✕' : '📖';
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      panel.style.display = 'none';
      fab.classList.remove('active');
      fab.innerHTML = '📖';
    }
  });

  // Listen for messages from the widget iframe
  window.addEventListener('message', (e) => {
    if (e.data?.source !== 'studysync-widget') return;

    if (e.data.type === 'TIMER_STATE') {
      chrome.runtime.sendMessage({ type: 'TIMER_STATE', isRunning: e.data.isRunning });
      // Update FAB badge
      fab.classList.toggle('timer-active', e.data.isRunning);
    }
  });
})();
