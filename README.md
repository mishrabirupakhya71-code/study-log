# 🎓 StudySync — Your Study Life, Logged Automatically

A **YPT-inspired** (Yeolpumta) study environment that runs across your **laptop + Android phone**, keeps a **permanent, private log on GitHub**, tracks **homework with due dates**, auto-logs your **commute** (home ↔ college), and puts your phone into **lockdown** during study hours so you can't doom-scroll the night away.

Everything you log — study sessions, assignments, commute events, photo notes — is stored as **GitHub Issues** in your own private repository. Lose your phone? Your data is safe on GitHub forever.

---

## ✨ Features

| Category | What it does |
|----------|-------------|
| ⏱️ **Study Timer** | Continuous YPT-style stopwatch with per-subject tracking |
| 📊 **Analytics** | GitHub-style heatmap calendar, per-subject pie/bars, streaks, levels & badges |
| 📚 **Homework** | Assignments with due dates, priorities, completion tracking + **Google Classroom import** |
| 🚶 **Auto Commute Log** | GPS geofences auto-log *Departed Home / Arrived College / Departed College / Arrived Home* |
|  **Photo Notes** | Attach camera/gallery photos to your notes & assignments |
| 📋 **Daily Log** | One auto-built issue per day on GitHub combining everything |
| 📱 **Cross-Device** | Same PWA works on laptop browser + phone, installable to home screen |

---

## 🏗️ Architecture

```
┌────────────────────── ANDROID PHONE ──────────────────────┐
│  PWA (installable)                                         │
│  • Study timer / subjects                                  │
│  • Homework tracker                                        │
│  • Photo notes                                             │
└───────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────────┐
   │   Cloudflare Worker (free relay)        │
   │   • Receives PWA events                 │
   │   • Keeps your GitHub token SECURE here │
   │   • Builds issue markdown + photos      │
   └──────────────────┬──────────────────────┘
                      ▼
   ┌─────────────────────────────────────────┐
   │   Your PRIVATE GitHub repo "study-log"  │
   │   • daily-log issues (one per day)      │
   │   • assignment issues (with due dates)  │
   │   • study-session issues                │
   │   • weekly summary (GitHub Actions)     │
   └─────────────────────────────────────────┘
                      ▲
   ┌──────────────────┴──────────────────────┐
   │   LAPTOP — same PWA, big dashboard      │
   └─────────────────────────────────────────┘
```

**Why a Cloudflare Worker?** Your GitHub token never touches your phone. The phone sends events with a shared secret; the Worker authenticates, then talks to GitHub. Safe even if you lose your phone.

---

## 📁 Project Layout

```
study-sync/
├── pwa/                  # The app (Preact + Vite PWA)
│   ├── src/
│   │   ├── components/   # Timer, calendar, streak board, planner...
│   │   ├── pages/        # Dashboard, Homework, DailyLog, Analytics, Settings
│   │   ├── services/     # IndexedDB, GitHub sync, photo upload, Classroom
│   │   └── utils/        # time, badges, markdown templates
│   └── public/sw.js      # Service worker (offline + background sync)
├── worker/               # Cloudflare Worker (the GitHub relay)
│   └── src/              # index.js, github.js, templates.js, auth.js
├── .github/workflows/    # weekly-summary.yml (auto weekly digest)
└── README.md
```

---

## 🚀 Quick Start (for a new user)

> ⏱️ **Total setup: ~30–45 minutes**, done once.

### 0. Prerequisites
- A **GitHub account**
- A **Cloudflare account** (free)
- A **Vercel account** (free) — or any static host

---

### 1️⃣ Create your GitHub repo (5 min)

1. Go to **https://github.com/new**
2. Repository name: `study-log`
3. **Private** ✅
4. Create repository

### 2️⃣ Deploy the Cloudflare Worker (10 min)

```bash
cd worker
npm install
npx wrangler login                 # register a workers.dev subdomain if asked
cp wrangler.example.toml wrangler.toml
```

Edit `wrangler.toml` → replace `<YOUR_GITHUB_USERNAME>` and `<PICK_A_STRONG_SHARED_SECRET>`. Keep `TIMEZONE` as your local zone.

Then store the two secrets (never commit them):

```bash
npx wrangler secret put GITHUB_PAT
# paste a fine-grained PAT with Issues:Read&Write + Contents:Read&Write on study-log

npx wrangler secret put SHARED_SECRET
# must equal the value you put in wrangler.toml

npx wrangler deploy
```

🎉 You now have a URL like `https://studysync-worker.youraccount.workers.dev`.

### 3️⃣ Deploy the PWA (5 min)

**Option A — Vercel:**
```bash
cd pwa
npm install
npm run build
npx vercel --prod
```

**Option B — GitHub Pages / Netlify / any static host:**
Build with `npm run build`, then serve the `dist/` folder.

### 4️⃣ Connect the app to your Worker (2 min)

Open the deployed PWA on your phone → **Settings** tab:
- **Worker URL**: `https://studysync-worker.youraccount.workers.dev`
- **Shared Secret**: the one you chose
- Tap **Save**

### 5️⃣ (Optional) Google Classroom import

See `pwa/src/services/classroom.js` — add your Google **Web Client ID** and a button in the Homework page will import your assignments automatically.

---

## 📝 How to use it day-to-day

- **Start studying** → open PWA → pick a subject → hit ▶. When you stop, the session is logged to GitHub automatically.
- **Commute** → just walk/drive. Geofences handle the logging — nothing to tap.
- **Homework** → Homework tab → + Add → title, subject, due date, priority. Or import from Classroom.
- **Photo note** → while writing a note/assignment, tap 📷 / 🖼️ to attach a photo.

---

## 🔧 Configuration reference

### Cloudflare Worker vars (`wrangler.toml`)
| Var | Purpose |
|-----|---------|
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | The repo holding your logs (e.g. `study-log`) |
| `SHARED_SECRET` | Password the app uses to authenticate |
| `TIMEZONE` | IANA zone, e.g. `Asia/Kolkata`, for correct logged times |

### Worker secrets (set via `wrangler secret put`)
| Secret | Purpose |
|--------|---------|
| `GITHUB_PAT` | Fine-grained PAT: **Issues** R/W + **Contents** R/W on your repo |
| `SHARED_SECRET` | *(optional — if set, overrides the var)* |

### GitHub labels used
Auto-created on first sync: `daily-log`, `study-session`, `assignment`, `weekly-summary`, plus a `subject:<name>` per subject.

---

## 📊 Weekly summary (GitHub Actions)

The repo includes `.github/workflows/weekly-summary.yml`. It runs every Sunday and opens a `weekly-summary` issue aggregating your week: total hours, per-subject breakdown, session count, streak. It's in the **same repo** as your code, so it just works.

---

## 🔒 Security notes

- Your **GitHub token lives only in Cloudflare** — never on your phone or in this repo.
- The phone authenticates with a **shared secret**, not the GitHub token.
- The repo is **private** — your study data isn't public.
- `.gitignore` excludes `wrangler.toml` (your real config) — only the `wrangler.example.toml` template is committed.

---

## ❓ Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` | Shared secret mismatch — check the secret in Settings matches the worker secret |
| `Invalid Date` in GitHub comments | Ensure timestamps are sent as numbers, not strings |
| Times wrong in comments | Set `TIMEZONE` in `wrangler.toml` and redeploy |
| PWA not syncing | Check Settings → Worker URL + Shared Secret are saved; ensure the app is online |

---

## 🛠️ Tech stack

- **PWA**: Preact + Vite + Preact Signals + IndexedDB (idb)
- **Relay**: Cloudflare Worker (ES modules)
- **Data store**: GitHub Issues + Release Assets (photos)
- **CI digest**: GitHub Actions (weekly summary)

---

Made with ❤️ for students who'd rather *study* than scroll. Good luck! 🚀
