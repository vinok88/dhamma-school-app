# Dhamma School App — Deployment & Configuration Guide

This guide walks you through setting up, configuring, and deploying the Dhamma School Student
Management System from scratch to production: Android app, iOS app, and Web admin portal.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup (Backend + Database)](#2-supabase-setup-backend--database)
3. [Firebase Setup (Push Notifications)](#3-firebase-setup-push-notifications)
4. [Google Sign-In Configuration](#4-google-sign-in-configuration)
5. [Apple Sign-In Configuration](#5-apple-sign-in-configuration)
6. [Flutter Local Development](#6-flutter-local-development)
7. [First-Time App Configuration](#7-first-time-app-configuration)
8. [Deploy Web Portal (Vercel)](#8-deploy-web-portal-vercel)
9. [Build & Release Android App](#9-build--release-android-app)
10. [Build & Release iOS App](#10-build--release-ios-app)
11. [Ongoing Operations](#11-ongoing-operations)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Install these tools before starting:

| Tool | Version | Install |
|------|---------|---------|
| Flutter SDK | 3.22+ | https://docs.flutter.dev/get-started/install |
| Dart SDK | Bundled with Flutter | — |
| Xcode | 15+ (macOS only) | Mac App Store |
| Android Studio | Latest | https://developer.android.com/studio |
| Supabase CLI | Latest | `brew install supabase/tap/supabase` |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| FlutterFire CLI | Latest | `dart pub global activate flutterfire_cli` |
| Node.js | 18+ | https://nodejs.org |
| Vercel CLI | Latest | `npm install -g vercel` |

**Verify Flutter is installed correctly:**
```bash
flutter doctor
# All items should show a green tick ✓
```

---

## 2. Supabase Setup (Backend + Database)

Supabase provides the database, authentication, file storage, real-time subscriptions, and API.

### 2.1 Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Choose your organisation → name it `dhamma-school` → set a strong database password → select region **Sydney (ap-southeast-2)** for Australian data residency
4. Wait ~2 minutes for the project to initialise

### 2.2 Get Your Credentials

In your Supabase dashboard → **Project Settings → API**:

| Key | Where it goes |
|-----|--------------|
| Project URL | `SUPABASE_URL` in your `.env` and CI |
| `anon` public key | `SUPABASE_ANON_KEY` in your `.env` and CI |
| `service_role` secret key | Used ONLY server-side (Edge Functions, webhooks) — never in the app |

### 2.3 Run Database Migrations

Link your local project to the remote Supabase project:

```bash
cd /path/to/dhamma_school_app

# Login to Supabase CLI
supabase login

# Link to your remote project (get project-ref from the dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Push all 10 migrations to production
supabase db push
```

This creates all tables: `schools`, `user_profiles`, `students`, `classes`, `attendance_records`, `announcements`, `events`, `messages`, `notifications` — with all enums, foreign keys, and RLS policies.

**Verify in the Supabase dashboard → Table Editor** that all 9 tables appear.

### 2.4 Seed the Initial School Record

In **Supabase Dashboard → SQL Editor**, run:

```sql
INSERT INTO schools (id, name, location)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Mahamevnawa Dhamma School – Southbank',
  'Melbourne, VIC, Australia'
);
```

Copy the UUID you used — you will need it in Step 7.

### 2.5 Configure Storage Buckets

In **Supabase Dashboard → Storage**:

1. Click **New Bucket** → Name: `student-photos` → **Private** (toggle off public) → Save
2. Click **New Bucket** → Name: `profile-photos` → **Private** → Save

Then add RLS policies for each bucket in **Storage → Policies**:

**student-photos bucket — INSERT policy:**
```sql
-- Allow authenticated users to upload to their own folder
(auth.uid()::text = (storage.foldername(name))[1])
```

**student-photos bucket — SELECT policy:**
```sql
-- Allow parents to read their own students' photos, teachers their class, admin all
(auth.role() = 'authenticated')
```

**profile-photos bucket — INSERT + SELECT policy:**
```sql
(auth.role() = 'authenticated')
```

### 2.6 Enable Realtime

In **Supabase Dashboard → Database → Replication**:
- Enable replication for the `messages` table
- Enable replication for the `notifications` table

### 2.7 Deploy the Edge Function

```bash
# Set the Firebase service account secret (get this in Step 3.4)
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='PASTE_JSON_HERE'

# Deploy the notification function
supabase functions deploy send-notification
```

Then configure the database webhook:
1. Go to **Supabase Dashboard → Database → Webhooks**
2. Click **Create a new hook**
3. Settings:
   - Name: `on_announcement_published`
   - Table: `announcements`
   - Events: `INSERT`
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification`
   - HTTP Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
4. Save

---

## 3. Firebase Setup (Push Notifications)

Firebase Cloud Messaging (FCM) delivers push notifications to Android and iOS devices.

### 3.1 Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `dhamma-school`
3. Disable Google Analytics (not needed) → Create project

### 3.2 Add Android App to Firebase

1. In Firebase Console → Project Overview → **Add app** → Android
2. Android package name: `com.mahamevnawa.dhamma_school` (must match `android/app/build.gradle`)
3. Download `google-services.json`
4. Place it at `android/app/google-services.json`

### 3.3 Add iOS App to Firebase

1. In Firebase Console → **Add app** → iOS
2. iOS bundle ID: `com.mahamevnawa.dhammaSchool` (must match Xcode project)
3. Download `GoogleService-Info.plist`
4. In Xcode, drag it into `Runner/` (make sure **Copy items if needed** is checked)

### 3.4 Generate Service Account Key (for Edge Function)

1. Firebase Console → **Project Settings → Service Accounts**
2. Click **Generate new private key** → Download the JSON file
3. Open the file, copy the entire JSON content
4. Paste it as the `FIREBASE_SERVICE_ACCOUNT_JSON` Supabase secret (from Step 2.7)

### 3.5 Run FlutterFire Configuration

```bash
cd /path/to/dhamma_school_app

# Login to Firebase
firebase login

# Configure — select your dhamma-school project
flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID

# This generates lib/firebase_options.dart
# Commit this file to your repo
```

Then uncomment in `lib/main.dart`:
```dart
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### 3.6 Enable APNs for iOS Push (iOS only)

1. In your **Apple Developer account** → Certificates, Identifiers & Profiles → Keys
2. Create a new key → enable **Apple Push Notifications service (APNs)**
3. Download the `.p8` key file
4. In Firebase Console → Project Settings → Cloud Messaging → **iOS app configuration**
5. Upload the `.p8` file, enter your Key ID and Team ID

---

## 4. Google Sign-In Configuration

### 4.1 Create OAuth Credentials in Google Cloud

1. Go to https://console.cloud.google.com → select the project Firebase created
2. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**

Create **three** OAuth Client IDs:

**Web application (for Supabase + web app):**
- Authorised redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Also add: `http://localhost:54321/auth/v1/callback` (for local dev)
- Copy the **Client ID** → this is your `GOOGLE_WEB_CLIENT_ID`

**Android:**
- Package name: `com.mahamevnawa.dhamma_school`
- SHA-1 fingerprint: run `cd android && ./gradlew signingReport` → copy the SHA-1

**iOS:**
- Bundle ID: `com.mahamevnawa.dhammaSchool`

### 4.2 Configure in Supabase

In **Supabase Dashboard → Authentication → Providers → Google**:
- Enable Google provider
- Paste the **Web Client ID** and **Web Client Secret**
- Save

### 4.3 Configure in Android

In `android/app/src/main/res/values/strings.xml` (create if it doesn't exist):
```xml
<resources>
  <string name="default_web_client_id">YOUR_GOOGLE_WEB_CLIENT_ID</string>
</resources>
```

### 4.4 Configure in iOS

In `ios/Runner/Info.plist`, add the reversed client ID from `GoogleService-Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

---

## 5. Apple Sign-In Configuration

Apple Sign-In is **required** by App Store policy when offering any third-party OAuth on iOS.

### 5.1 Enable in Apple Developer Account

1. Go to https://developer.apple.com → **Certificates, Identifiers & Profiles**
2. Select your App ID (`com.mahamevnawa.dhammaSchool`) → Edit
3. Enable **Sign In with Apple** → Save

### 5.2 Create a Service ID (for Web/Supabase)

1. **Identifiers → +** → Select **Services IDs**
2. Description: `Dhamma School Web` → Identifier: `com.mahamevnawa.dhammaSchool.web`
3. Enable **Sign In with Apple** → Configure
4. Primary App ID: select your app
5. Domains: `YOUR_PROJECT_REF.supabase.co`
6. Return URLs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 5.3 Create a Key

1. **Keys → +** → Name: `Dhamma School Sign In Key`
2. Enable **Sign In with Apple** → Configure → select your Primary App ID
3. Download the `.p8` key file → note the **Key ID**

### 5.4 Configure in Supabase

In **Supabase Dashboard → Authentication → Providers → Apple**:
- Enable Apple provider
- Service ID: `com.mahamevnawa.dhammaSchool.web`
- Team ID: your Apple Developer Team ID (found in Membership section)
- Key ID: from Step 5.3
- Private Key: contents of the `.p8` file
- Save

### 5.5 Enable Capability in Xcode

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select **Runner** target → **Signing & Capabilities**
3. Click **+ Capability** → add **Sign in with Apple**

---

## 6. Flutter Local Development

### 6.1 Install Dependencies

```bash
cd /path/to/dhamma_school_app
flutter pub get
```

### 6.2 Copy and Fill Environment File

```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
GOOGLE_WEB_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
```

### 6.3 Run on Web

```bash
make run-web SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... GOOGLE_WEB_CLIENT_ID=xxx
# or manually:
flutter run -d chrome \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=GOOGLE_WEB_CLIENT_ID=xxx
```

### 6.4 Run on Android

```bash
# Start an emulator or connect a device
flutter devices

make run-android SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ...
```

### 6.5 Run on iOS

```bash
# Open Simulator or connect an iPhone
open -a Simulator

make run-ios SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ...
```

### 6.6 Run Code Generation (after model changes)

```bash
make codegen
# or: flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 7. First-Time App Configuration

Before testing end-to-end, you need to seed the system with initial data.

### 7.1 Create the First Admin Account

**Step 1 — Create auth user in Supabase:**
In **Supabase Dashboard → Authentication → Users → Add user**:
- Email: `admin@dhamma-school.org.au`
- Password: set a strong password
- Copy the generated UUID

**Step 2 — Create profile row:**
In **Supabase → SQL Editor**:
```sql
INSERT INTO user_profiles (id, school_id, full_name, phone, role, status)
VALUES (
  'PASTE_AUTH_USER_UUID_HERE',
  'aaaaaaaa-0000-0000-0000-000000000001',  -- school ID from Step 2.4
  'School Administrator',
  '+61 000 000 000',
  'admin',
  'active'
);
```

The admin can now log in at the web portal using email/password (you will need to add email/password login support alongside the social login, or have the admin use the Supabase magic link from the dashboard for initial access).

### 7.2 Create Initial Classes

In **Supabase → SQL Editor**:
```sql
INSERT INTO classes (school_id, name, grade_level)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Little Buds', 'Ages 4–6'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Seedlings', 'Ages 7–9'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Blossoms', 'Ages 10–12'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Juniors', 'Ages 13–15'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Seniors', 'Ages 16+');
```

### 7.3 Update School ID in App Constants

In `lib/core/constants/app_constants.dart`, set the school ID:
```dart
static const String defaultSchoolId = 'aaaaaaaa-0000-0000-0000-000000000001';
```

---

## 8. Deploy Web Portal (Vercel)

The web admin portal is built with Flutter Web and hosted on Vercel.

### 8.1 Connect to Vercel

```bash
cd /path/to/dhamma_school_app

# Login
vercel login

# Link project (follow the prompts)
vercel link
```

### 8.2 Set Environment Variables in Vercel

In **Vercel Dashboard → Your Project → Settings → Environment Variables**, add:

| Variable | Value | Environments |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `GOOGLE_WEB_CLIENT_ID` | `123.apps.googleusercontent.com` | Production, Preview, Development |

### 8.3 Deploy

```bash
# Deploy to production
vercel --prod

# Or use the Makefile
make build-web SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... GOOGLE_WEB_CLIENT_ID=xxx
vercel --prod --prebuilt
```

### 8.4 Configure Custom Domain (optional)

In **Vercel Dashboard → Your Project → Settings → Domains**:
- Add `admin.mahamevnawa.org.au` (or similar)
- Follow Vercel's DNS setup instructions for your domain provider

---

## 9. Build & Release Android App

### 9.1 Create a Signing Keystore

```bash
keytool -genkey -v \
  -keystore android/app/dhamma-school-release.keystore \
  -alias dhamma-school \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Save the keystore password and alias password securely (e.g., in a password manager).

### 9.2 Configure Signing in Gradle

Create `android/key.properties` (add this file to `.gitignore`):
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=dhamma-school
storeFile=dhamma-school-release.keystore
```

In `android/app/build.gradle`, add before `android {}`:
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
  keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

And in the `buildTypes` block:
```groovy
release {
  signingConfig signingConfigs.release
  minifyEnabled true
  shrinkResources true
}
```

### 9.3 Build the APK / AAB

```bash
# Build release APK
make build-android SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ...

# Or build Android App Bundle (required for Play Store)
flutter build appbundle --release \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ...

# Output: build/app/outputs/bundle/release/app-release.aab
```

### 9.4 Submit to Google Play Store

1. Create a Google Play Console account at https://play.google.com/console
2. **Create app** → app name: "Dhamma School" → select language and app type
3. Complete the store listing (description, screenshots, icons)
4. Under **Release → Production → Create new release**
5. Upload the `.aab` file
6. Submit for review (Google typically reviews within 3–7 days for new apps)

---

## 10. Build & Release iOS App

### 10.1 Configure Bundle ID and Signing in Xcode

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select **Runner** target → **Signing & Capabilities**
3. Set Bundle Identifier: `com.mahamevnawa.dhammaSchool`
4. Team: select your Apple Developer team
5. Enable **Automatically manage signing** (or set up manual provisioning profiles)

### 10.2 Build the IPA

```bash
make build-ios SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ...

# Or directly:
flutter build ios --release \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ...

# Then archive in Xcode:
# Product → Archive → Distribute App → App Store Connect → Upload
```

### 10.3 Submit to Apple App Store

1. In **App Store Connect** (https://appstoreconnect.apple.com) → **My Apps → +**
2. Create new app → Bundle ID: `com.mahamevnawa.dhammaSchool`
3. Complete app metadata (name, description, keywords, screenshots)
4. Upload the build via Xcode Organizer (Product → Archive → Distribute)
5. Submit for review (Apple typically takes 1–3 days)

**Required for App Store submission:**
- Privacy Policy URL (required — host a simple privacy policy page)
- At least one screenshot per device size (6.5", 5.5", iPad)
- App icon: 1024×1024 PNG (no alpha channel)

---

## 11. Ongoing Operations

### 11.1 Adding a New Teacher

1. Teacher downloads the app and signs in with Google or Apple
2. Teacher selects "I am a Teacher" and completes the registration form
3. Admin logs into the web portal → **Pending Registrations → Teachers tab**
4. Admin clicks **Approve**
5. Admin goes to **Class Management** → selects a class → assigns the teacher

### 11.2 Adding a New Student

1. Parent downloads the app and signs in
2. Parent taps **Register Child** → completes the 3-step form
3. The assigned class teacher receives a notification → reviews the submission
4. Admin receives a notification → gives final approval
5. Admin assigns the student to a class (prompted during approval)

### 11.3 Running a Session (Weekly Attendance)

1. Teacher opens the app on the day of the Dhamma School session
2. Taps **Attendance** → selects today's session
3. As students arrive, taps their name or swipes right → **Check In**
4. At the end, swipes left on remaining unchecked students → **Absent** (or marks individually)
5. As students depart, taps each student → **Check Out**

### 11.4 Sending an Announcement

**Teacher (class-level):**
App → Announce tab → compose title and body → Send

**Principal (school-wide):**
Web portal → Compose Announcement → select scope (Entire School / Class / Emergency) → Publish & Notify

All parents receive a push notification immediately.

### 11.5 Managing the Event Calendar

Web portal → **Event Management** → click **+ Add Event**:
- Title, description, event type (Poya / Sermon / Exam / Holiday / Special)
- Start and end date/time
- Optional location

Parents see the event immediately in their Calendar tab.

### 11.6 Adding a Second Dhamma School (Multi-tenant)

1. In **Supabase → SQL Editor**, insert a new school:
   ```sql
   INSERT INTO schools (name, location)
   VALUES ('Mahamevnawa Dhamma School – Mount Evelyn', 'Mount Evelyn, VIC');
   ```
2. Note the new school's UUID
3. Create an admin user for that school (Step 7.1) with the new `school_id`
4. All data for that school will be fully isolated via RLS policies

### 11.7 Exporting Attendance Reports

Web portal → **Reports** → select Daily / Weekly / Monthly → set date range → click **Export CSV**

The CSV will download with columns: Student Name, Class, Sessions Attended, Total Sessions, Attendance %.

### 11.8 Database Backups

Supabase automatically backs up your database daily on the Pro plan. To download a manual backup:

```bash
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## 12. Troubleshooting

### "Sign in with Google" fails on web

- Check that `GOOGLE_WEB_CLIENT_ID` is set correctly via `--dart-define`
- Verify the redirect URI `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` is added in Google Cloud Console

### Push notifications not arriving on iOS

- Confirm APNs `.p8` key is uploaded in Firebase Console → Project Settings → Cloud Messaging
- Confirm **Sign in with Apple** and **Push Notifications** capabilities are enabled in Xcode
- On a physical device (Simulator does not support push notifications)

### Students not appearing in teacher's class

- The student must have status `approved` (not just `pending`)
- The student must be assigned to the teacher's class by the admin
- Check `students.class_id` is set and matches `classes.id` for the teacher's class

### "RLS policy violation" errors

- This means a user is trying to access data outside their permitted scope
- Check `010_rls_policies.sql` is fully applied: `supabase db push`
- In Supabase Dashboard → SQL Editor, test: `SELECT * FROM user_profiles LIMIT 1;` as that user

### Attendance records not syncing

- Confirm Realtime is enabled for `attendance_records` in Supabase Dashboard → Database → Replication
- Check device has internet connectivity
- Offline records sync automatically when connectivity returns

### Flutter build fails: "firebase_options.dart not found"

```bash
flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID
```
Then commit the generated `lib/firebase_options.dart`.

### `build_runner` conflicts

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## Environment Variables Quick Reference

| Variable | Used In | Where to Get |
|----------|---------|-------------|
| `SUPABASE_URL` | App, Vercel | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | App, Vercel | Supabase Dashboard → Project Settings → API |
| `GOOGLE_WEB_CLIENT_ID` | App (web + Android) | Google Cloud Console → Credentials |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Supabase Edge Function secret | Firebase Console → Project Settings → Service Accounts |
| Supabase `service_role` key | Webhook Authorization header only | Supabase Dashboard → Project Settings → API |

---

*For questions or issues, refer to `SRS.md` for full requirements context or open an issue in the project repository.*
