# StudySync — Widget Integration Guide

> For website developers embedding StudySync into an existing web application.

---

## Quick Start

### 1. Add the script & stylesheet

Copy the built files from `pwa/dist-widget/` to your static assets, then include them:

```html
<link rel="stylesheet" href="/assets/studysync-widget.css" />
<script src="/assets/studysync-widget.js"></script>
```

### 2. Configure authentication

Provide the current student's info **before** initializing the widget. Pick **one** approach:

#### Option A — Global config object (recommended)

```html
<script>
  window.StudySyncConfig = {
    user: {
      id: 'student-42',        // unique student ID (required)
      name: 'Jane Doe',        // display name
      email: 'jane@school.edu',
      avatar: '/avatars/jane.jpg'
    },
    // Optional: function that returns user or a Promise<user>
    // getUser: () => fetch('/api/me').then(r => r.json())
  };
</script>
```

#### Option B — DOM data attributes

Place these on your mount container or any ancestor:

```html
<div id="studysync-mount"
     data-user-id="student-42"
     data-user-name="Jane Doe"
     data-user-email="jane@school.edu"
     data-user-avatar="/avatars/jane.jpg">
</div>
```

#### Option C — Auth API endpoint

```html
<script>
  window.StudySyncConfig = {
    authApiUrl: '/api/current-user'  // must return JSON: { id, name, email, avatar }
  };
</script>
```

#### Option D — Dynamic user change event

Dispatch whenever the logged-in user changes (e.g. on login/logout):

```js
window.dispatchEvent(new CustomEvent('studysync:userchange', {
  detail: { id: 'student-42', name: 'Jane Doe' }
}));
```

---

### 3. Initialize the widget

```html
<script>
  // === Floating Action Button mode (bottom-right bubble) ===
  window.StudySync.init({
    mode: 'fab',
    apiUrl: 'https://your-cloudflare-worker.workers.dev'
  });

  // === Inline mode (renders inside a container element) ===
  window.StudySync.init({
    container: '#studysync-mount',
    mode: 'inline',
    apiUrl: 'https://your-cloudflare-worker.workers.dev'
  });
</script>
```

---

## API Reference

### `window.StudySync.init(config)`

| Parameter   | Type     | Default   | Description                                   |
|-------------|----------|-----------|-----------------------------------------------|
| `container` | `string` | `'body'`  | CSS selector for the mount point               |
| `mode`      | `string` | `'fab'`   | `'fab'` (floating button) or `'inline'`        |
| `apiUrl`    | `string` | `''`      | Cloudflare Worker URL for GitHub sync           |

### `window.StudySync.destroy()`

Unmounts the widget and removes all DOM elements.

### `window.StudySync.toggle()`

Toggle the widget panel open/closed (FAB mode only).

### `window.StudySync.isOpen`

`true` if the widget panel is currently visible (FAB mode).

---

## Auth Priority

When multiple auth sources are present, the widget reads them in this order:

1. `window.StudySyncConfig.user` (highest priority)
2. `window.StudySyncConfig.getUser()` callback
3. DOM `data-user-*` attributes on the container element
4. `window.StudySyncConfig.authApiUrl` fetch
5. `studysync:userchange` custom event (can override at any time)

---

## Data Storage

- **All data is stored in the browser** via IndexedDB (database name = `studysync_{userId}`)
- Each student gets their own isolated database — no data leaks between students
- Optional GitHub sync exports daily logs to a private GitHub repo via the Cloudflare Worker

---

## CSS Isolation

All widget CSS classes are prefixed with `ss-` to avoid conflicts with your site's styles. The widget also uses CSS custom properties scoped under its root element:

```
--ss-bg, --ss-surface, --ss-accent, --ss-text, --ss-muted, --ss-border
```

You can override these to match your site's theme:

```css
.ss-widget {
  --ss-accent: #3B82F6;     /* your brand blue   */
  --ss-bg: #ffffff;          /* light background  */
  --ss-surface: #f3f4f6;    /* card background   */
  --ss-text: #1f2937;        /* dark text         */
}
```

---

## Theming

The widget defaults to **dark mode**. Users can toggle dark/light mode in the Settings tab. The theme is persisted per user in IndexedDB.

To force a theme:

```js
window.StudySyncConfig = {
  user: { id: 'student-42', name: 'Jane' },
  theme: 'light'   // 'dark' | 'light'
};
```

---

## Complete Integration Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Learning Platform</title>
  <link rel="stylesheet" href="/assets/studysync-widget.css">
</head>
<body>
  <!-- Your site content here -->
  <main>
    <h1>Welcome, <%= student.name %></h1>
    <!-- ... -->
  </main>

  <!-- StudySync Widget -->
  <script>
    window.StudySyncConfig = {
      user: {
        id: '<%= student.id %>',
        name: '<%= student.name %>',
        email: '<%= student.email %>',
        avatar: '<%= student.avatarUrl %>'
      }
    };
  </script>
  <script src="/assets/studysync-widget.js"></script>
  <script>
    window.StudySync.init({
      mode: 'fab',
      apiUrl: 'https://studysync-api.your-domain.workers.dev'
    });
  </script>
</body>
</html>
```

---

## Cloudflare Worker Setup

The backend worker handles GitHub sync and optional photo uploads. See `worker/` for the source.

### Deploy

```bash
cd worker
cp wrangler.example.toml wrangler.toml
# Edit wrangler.toml with your Cloudflare account details
npx wrangler deploy
```

### Environment Variables (Secrets)

Set via `npx wrangler secret put <NAME>`:

| Secret            | Description                           |
|-------------------|---------------------------------------|
| `GITHUB_TOKEN`    | GitHub PAT with `repo` scope           |
| `GITHUB_REPO`     | `owner/repo` for data storage          |
| `AUTH_SECRET`      | Shared secret for API auth             |

---

## File List

After building, you'll deliver these files to the website developer:

```
dist-widget/
  studysync-widget.js      ← main widget bundle (IIFE)
  studysync-widget.css     ← widget styles
  
docs/
  INTEGRATION.md           ← this file
```

---

## Browser Support

- Chrome 90+
- Edge 90+
- Firefox 90+
- Safari 15+

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Widget doesn't appear | Check that both JS and CSS are loaded; check console for errors |
| "Not authenticated" message | Ensure `window.StudySyncConfig.user` is set before calling `init()` |
| Data not syncing | Verify `apiUrl` and that the Cloudflare Worker is deployed with correct secrets |
| CSS conflicts | All widget classes use `ss-` prefix; check for `!important` overrides in your site CSS |
| Multiple students on one browser | Each user gets their own IndexedDB — no conflicts |
