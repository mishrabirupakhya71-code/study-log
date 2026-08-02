# StudySync — Tasker Automation Setup

To make StudySync seamless, we use Tasker on your Android phone to handle location tracking (geofences) and app blocking (lockdown mode) without draining battery.

## Prerequisites
1. Install **Tasker** from the Google Play Store
2. Install the **AutoLocation** plugin (by joaoapps) from the Play Store
3. Install **AutoInput** (optional, recommended for better app blocking)
4. Grant Tasker all necessary permissions:
   - **Location**: Allow all the time (for geofencing)
   - **Usage Access**: (Settings > Apps > Special App Access > Usage Access) - required for app blocking
   - **Draw over other apps**: For blocking overlays

## Step 1: Configure AutoLocation Geofences
Instead of Tasker's built-in location which drains battery, we use AutoLocation.
1. Open AutoLocation > Manage Geofences
2. Tap `+` and create a geofence named `Home`
3. Tap `+` again and create a geofence named `College`

## Step 2: Import Profiles
You can import the provided XML files by long-pressing the "Profiles" or "Tasks" tab in Tasker and selecting "Import":

1. **tasks/send-location-event.xml** — The HTTP POST action that sends data to your Cloudflare Worker.
2. **profiles/geofence-home.xml** — Triggers when entering/exiting the Home geofence.
3. **profiles/geofence-college.xml** — Triggers when entering/exiting College.
4. **profiles/app-blocker.xml** — The lockdown enforcer that blocks social apps when `%STUDY_MODE = 1`.

## Step 3: Set Global Variables
In Tasker, go to the **VARS** tab and create:
- `%WORKER_URL` = your Cloudflare Worker URL (e.g. `https://studysync-worker.username.workers.dev`)
- `%SHARED_SECRET` = the secret you set in your Cloudflare Worker environment

## How the Lockdown Works
- When you start a timer in the PWA, it fires an intent URL (`intent://studysync...`) which Tasker catches to set `%STUDY_MODE = 1`.
- If you open a blacklisted app (Instagram, TikTok, etc.) while `%STUDY_MODE = 1`, Tasker immediately forces you back to the Home Screen and shows a notification.
