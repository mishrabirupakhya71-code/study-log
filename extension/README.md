# StudySync — Chrome/Edge Extension

> Manifest V3 browser extension that injects the StudySync study tracker into any webpage.

---

## Features

- 📖 **Floating widget** — Appears as a bottom-right FAB on every page
- ⏱ **Study timer** — Start/stop/pause a Pomodoro-style timer
- 📝 **Homework tracker** — Manage assignments with due dates
- 📊 **Analytics** — Weekly/monthly study stats with subject breakdown
- 🔥 **Streaks** — Track daily study habits
- 🔔 **Reminders** — Hourly nudges if you haven't studied

---

## Building

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
# 1. Install PWA dependencies
cd pwa
npm install

# 2. Build the widget + copy into extension
cd ..
node scripts/build-extension.js

# 3. Add your icon files
#    Place icon-16.png, icon-32.png, icon-48.png, icon-128.png
#    into extension/icons/
```

### Loading in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

### Loading in Edge

1. Go to `edge://extensions`
2. Enable **Developer mode** (bottom left)
3. Click **Load unpacked**
4. Select the `extension/` folder

---

## Architecture

```
extension/
├── manifest.json           ← Manifest V3 config
├── background.js           ← Service worker (alarms, storage, messaging)
├── content/
│   ├── content.js          ← Injected into pages, creates FAB + iframe
│   └── content.css         ← FAB & panel styling
├── popup/
│   ├── popup.html          ← Extension popup (quick stats)
│   └── popup.js            ← Popup logic
├── widget/
│   ├── widget.html         ← Iframe page that loads the widget bundle
│   ├── studysync-widget.js ← Built widget (copied from pwa/dist-widget)
│   └── studysync-widget.css
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

---

## Setting Up User Authentication

The extension stores user info in `chrome.storage.local`. You can set it via:

1. The Settings tab inside the widget
2. Programmatically from the popup or background script:

```js
chrome.storage.local.set({
  user: { id: 'student-42', name: 'Jane Doe', email: 'jane@school.edu' }
});
```

---

## Publishing to Chrome Web Store

1. Add production icon PNGs (`icons/icon-*.png`)
2. Run `node scripts/build-extension.js`
3. Zip the `extension/` folder
4. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Fill in listing details, screenshots, privacy policy
6. Submit for review

---

## Permissions

| Permission      | Reason                                    |
|-----------------|------------------------------------------|
| `storage`       | Save user preferences and timer state     |
| `alarms`        | Schedule study reminder notifications     |
| `notifications` | Show hourly study reminders               |
