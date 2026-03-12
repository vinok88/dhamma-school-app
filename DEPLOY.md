# Deployment Guide — Dhamma School App

## Overview

The Dhamma School app is a **React Native (Expo)** mobile application targeting **iOS** and **Android**. Deployment uses **EAS Build** (Expo Application Services) for cloud builds and store distribution.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| Expo CLI | latest | Dev server |
| EAS CLI | latest | Cloud builds |
| Xcode | 15+ | iOS builds (macOS only) |
| Android Studio | latest | Android builds |
| Supabase account | — | Backend |
| Firebase project | — | Push notifications (FCM) |
| Apple Developer account | $99/year | iOS App Store |
| Google Play account | $25 one-time | Android Play Store |

---

## Step 1: Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In the SQL editor, run all migrations in order:
   ```
   supabase/migrations/001_create_schools.sql
   supabase/migrations/002_create_users.sql
   supabase/migrations/003_create_students.sql
   supabase/migrations/004_create_classes.sql
   supabase/migrations/005_create_attendance.sql
   supabase/migrations/006_create_announcements.sql
   supabase/migrations/007_create_events.sql
   supabase/migrations/008_create_messages.sql
   supabase/migrations/009_create_notifications.sql
   supabase/migrations/010_rls_policies.sql
   ```
3. In **Authentication → Providers**, enable:
   - Google (add Web Client ID + Secret from Google Cloud Console)
   - Apple (iOS only — requires Apple Developer account)
4. In **Storage**, create two buckets:
   - `student-photos` (private)
   - `profile-photos` (private)
5. Copy your **Project URL** and **anon key** — you'll need these in `.env`

---

## Step 2: Firebase Setup (Push Notifications)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app with package `org.mahamevnawa.dhamma_school`
   - Download `google-services.json` → place at project root
3. Add iOS app with bundle ID `org.mahamevnawa.dhamma-school`
   - Download `GoogleService-Info.plist` → place at project root
4. In Supabase → **Edge Functions** or backend, configure FCM server key for sending notifications

---

## Step 3: Google OAuth Setup

1. In [Google Cloud Console](https://console.cloud.google.com), create OAuth 2.0 credentials:
   - **Web client** (for Supabase backend): add to Supabase Auth settings
   - **Android client**: package name + SHA-1 fingerprint
   - **iOS client**: bundle ID → copy the iOS URL scheme (looks like `com.googleusercontent.apps.XXX`)
2. In `app.json`, replace `YOUR_IOS_CLIENT_ID` in the Google Sign-In plugin config
3. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in your `.env`

---

## Step 4: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

---

## Step 5: App Assets

Replace placeholder assets in `assets/`:
- `images/icon.png` — 1024×1024 app icon
- `images/adaptive-icon.png` — 1024×1024 Android adaptive icon foreground
- `images/splash.png` — 1284×2778 splash screen
- `images/notification-icon.png` — 96×96 monochrome notification icon

---

## Step 6: EAS Build Setup

```bash
npm install -g eas-cli
eas login
eas init   # creates EAS project, updates app.json with projectId
```

Update `app.json`:
- Replace `YOUR_EAS_PROJECT_ID` with the generated project ID

---

## Step 7: Build & Submit

### Android
```bash
# Development build (for testing on device)
eas build --profile development --platform android

# Production build (AAB for Play Store)
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android
```

### iOS
```bash
# Development build
eas build --profile development --platform ios

# Production build (IPA for App Store)
eas build --profile production --platform ios

# Submit to App Store Connect
eas submit --platform ios
```

---

## Local Development Builds

```bash
# Android (requires Android Studio + emulator or device)
npx expo run:android

# iOS (requires macOS + Xcode)
npx expo run:ios
```

---

## Pre-launch Checklist

- [ ] All migrations run on Supabase
- [ ] Supabase RLS policies verified (010_rls_policies.sql)
- [ ] Google OAuth configured in Supabase + Google Cloud Console
- [ ] Apple Sign-In configured (iOS — requires paid Apple Developer account)
- [ ] `google-services.json` and `GoogleService-Info.plist` present in project root
- [ ] `.env` populated with real values (never commit this file)
- [ ] `app.json` EAS project ID and iOS client ID filled in
- [ ] App icon and splash screen assets replaced with real designs
- [ ] Date picker library integrated (currently uses text input with TODO comment)
- [ ] Push notifications tested on physical iOS and Android devices
- [ ] Admin account created manually in Supabase (set `role=admin`, `status=active`)
- [ ] Default school record seeded (see migration 001)
- [ ] Privacy policy and terms of service URLs added to app stores
- [ ] App store screenshots prepared (6.7" iPhone, 12.9" iPad, Pixel 8)

---

## Database Seeding

After running migrations, seed the initial school record via Supabase SQL editor:

```sql
INSERT INTO schools (name, location)
VALUES ('Mahamevnawa Dhamma School', 'Melbourne, VIC, Australia');
```

Then create the first admin account by signing in via Google, then running:
```sql
UPDATE user_profiles
SET role = 'admin', status = 'active'
WHERE id = 'YOUR_USER_UUID';
```
