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

### 1.1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **"New project"**
3. Fill in:
   - **Name**: `dhamma-school`
   - **Database password**: generate a strong one and save it somewhere safe
   - **Region**: choose **Southeast Asia (Singapore)** or **Australia (Sydney)** for best latency
4. Click **"Create new project"** and wait ~2 minutes for it to provision

### 1.2 — Run the database migrations

Once your project is ready:

1. In the left sidebar, click **"SQL Editor"**
2. Open each migration file from your repo locally, paste its contents into the SQL editor, then click **"Run"** — in this exact order:
   - `supabase/migrations/001_create_schools.sql`
   - `supabase/migrations/002_create_users.sql`
   - `supabase/migrations/003_create_students.sql`
   - `supabase/migrations/004_create_classes.sql`
   - `supabase/migrations/005_create_attendance.sql`
   - `supabase/migrations/006_create_announcements.sql`
   - `supabase/migrations/007_create_events.sql`
   - `supabase/migrations/008_create_messages.sql`
   - `supabase/migrations/009_create_notifications.sql`
   - `supabase/migrations/010_rls_policies.sql` ← **run this last**

> ⚠️ Order matters — each migration may depend on the previous one.

### 1.3 — Enable Auth providers

1. Go to **Authentication → Providers** in the left sidebar
2. Enable **Google** — you will fill in the Client ID & Secret in Step 3
3. Enable **Apple** — requires your Apple Developer account (can be done later)

### 1.4 — Create Storage buckets

1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**, name it `student-photos`, set it to **Private**
3. Repeat and create `profile-photos`, also set to **Private**

### 1.5 — Copy your credentials

1. Go to **Project Settings → API** (gear icon at the bottom of the sidebar)
2. Copy and save these two values — you'll need them in Step 4:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (the long `eyJhbGc...` string)

> The `service_role` key is also on this page. Keep it safe — it bypasses all Row Level Security and should never be committed or exposed publicly.

### 1.6 — Seed the initial school record

In the **SQL Editor**, run:

```sql
INSERT INTO schools (name, location)
VALUES ('Mahamevnawa Dhamma School', 'Melbourne, VIC, Australia');
```

---

## Step 2: Firebase Setup (Push Notifications)

Push notifications use the **FCM HTTP v1 API** with OAuth2 service account authentication.

### 2.1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it `dhamma-school`
4. Disable Google Analytics if not needed
5. Click **"Create project"**

### 2.2 — Add the Android app

1. On the project home screen, click the **Android icon** (🤖)
2. Fill in:
   - **Android package name**: `org.mahamevnawa.dhamma_school` ← must be exact
   - App nickname: `Dhamma School` (optional)
   - SHA-1: add your signing key fingerprint (required for Google Sign-In). Run `eas credentials --platform android` to get it, or see Step 3.3 for other methods
3. Click **"Register app"**
4. Click **"Download google-services.json"**
5. Place that file in **two locations** in your project:
   ```
   dhamma_school_app/
   ├── google-services.json       ✅ project root
   ├── app/google-services.json   ✅ app directory
   └── ...
   ```
6. Click through the remaining steps ("Next", "Next", "Continue to console") — no need to follow the SDK setup steps as Expo handles that

### 2.3 — Add the iOS app (requires Apple Developer account)

1. On the project home screen, click the **iOS icon** (🍎)
2. Fill in:
   - **iOS bundle ID**: `org.mahamevnawa.dhamma-school` ← must be exact
   - App nickname: `Dhamma School iOS` (optional)
3. Click **"Register app"**
4. Click **"Download GoogleService-Info.plist"**
5. Place that file at the **root of your project** (replacing the placeholder)
6. Click through the remaining steps

### 2.4 — Generate the FCM service account key

1. In Firebase Console, click the **gear icon ⚙️ → "Project Settings"**
2. Click the **"Service accounts"** tab
3. Click **"Generate new private key"** → confirm → a JSON file downloads
4. **Do not rename or commit this file** — keep it somewhere safe temporarily
5. Open the file in a text editor, select **all the contents** and copy it

### 2.5 — Store the key as a Supabase secret

First, log in and link your project if you haven't already:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

> Your project ref is the part of your Supabase URL between `https://` and `.supabase.co`

Then set the secret:

```bash
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='<paste the entire JSON contents here>'
```

> ⚠️ Use single quotes around the JSON — it contains double quotes internally

### 2.6 — Deploy the Edge Function

```bash
supabase functions deploy send-notification
```

### 2.7 — Create the database webhook

1. Go to Supabase Dashboard → **Database → Webhooks**
2. Click **"Create a new hook"**
3. Fill in:
   - **Name**: `on_announcement_insert`
   - **Table**: `announcements`
   - **Events**: tick `INSERT` only
   - **Type**: HTTP Request
   - **URL**: `https://<your-project-ref>.supabase.co/functions/v1/send-notification`
   - **Method**: `POST`
   - **Headers**: add one header:
     - Key: `Authorization`
     - Value: `Bearer <your-service-role-key>`
4. Click **"Create webhook"**

> Your **service-role key** is in Supabase → Project Settings → API → `service_role` key (not the anon key)

---

## Step 3: Google OAuth Setup

> **Important:** Do NOT create a separate Google Cloud project. Firebase automatically creates a Google Cloud project when you set up your Firebase project in Step 2. All OAuth credentials must live in this same Firebase-created project to avoid `DEVELOPER_ERROR` at sign-in.

### 3.1 — Open the Firebase-created Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top and select the project that Firebase created (it will match your Firebase project name, e.g. `dhamma-school-app`)
3. Verify the project number matches the `project_number` in your `google-services.json`

### 3.2 — Enable the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → click **"Create"**
3. Fill in:
   - **App name**: `Dhamma School`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **"Save and Continue"** through the remaining screens (no need to add scopes or test users)

### 3.3 — Create OAuth credentials

Go to **APIs & Services → Credentials** → click **"+ Create Credentials" → "OAuth client ID"**

You need to create the following clients. Firebase may have already auto-created the Android client when you added the SHA-1 fingerprint — check the existing credentials list first.

**Client 1 — Web client** (for Supabase and `webClientId` in the app):
- Application type: **Web application**
- Name: `Dhamma School Web`
- Under **Authorised redirect URIs**, add:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Click **"Create"**
- Copy the **Client ID** and **Client Secret**

**Client 2 — Android client** (may already exist):
- Check if Firebase auto-created one when you added the SHA-1 fingerprint in Step 2.2
- If not, click **"+ Create Credentials" → "OAuth client ID"**
- Application type: **Android**
- Name: `Dhamma School Android`
- Package name: `org.mahamevnawa.dhamma_school`
- SHA-1 fingerprint: there is no `android/` folder in an Expo managed project, so `./gradlew signingReport` won't work. Instead, use one of these methods:

  **Option A** — From EAS (recommended):
  ```bash
  eas credentials --platform android
  ```
  This shows the SHA-1 from your EAS-managed keystore.

  **Option B** — From an existing APK:
  ```bash
  ~/Library/Android/sdk/build-tools/36.0.0/apksigner verify --print-certs build.apk
  ```
  Look for the `SHA-1 digest` line in the output.

**Client 3 — iOS client** (requires Apple Developer account):
- Click **"+ Create Credentials" → "OAuth client ID"** again
- Application type: **iOS**
- Name: `Dhamma School iOS`
- Bundle ID: `org.mahamevnawa.dhamma-school`
- Click **"Create"**
- Copy the **iOS Client ID** — it looks like `com.googleusercontent.apps.XXX`

### 3.4 — Add SHA-1 fingerprint to Firebase and re-download google-services.json

1. Go to Firebase Console → **Project Settings → General** → scroll to Android app
2. Click **"Add fingerprint"** and add your SHA-1 from Step 3.3
3. Click **"Download google-services.json"**
4. Place the file in **two locations** in your project:
   ```
   dhamma_school_app/
   ├── google-services.json       ✅ project root
   ├── app/google-services.json   ✅ app directory
   └── ...
   ```
5. Verify the downloaded file has a non-empty `oauth_client` array — this confirms the SHA-1 was registered correctly

### 3.5 — Add Web client credentials to Supabase

1. Go to Supabase Dashboard → **Authentication → Providers → Google**
2. Toggle it **enabled**
3. Paste in:
   - **Client ID**: the Web client ID from Step 3.3
   - **Client Secret**: the Web client secret from Step 3.3
4. Click **"Save"**

### 3.6 — Update app.json

1. Open `app.json` in your project
2. Find `YOUR_IOS_CLIENT_ID` in the Google Sign-In plugin config and replace it with your iOS client ID
3. The iOS URL scheme (in the `googleServicesFile` plugin section) should match the reversed iOS client ID, e.g. `com.googleusercontent.apps.XXX`

### 3.7 — Add to your .env file

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

> Use the **Web client ID** from Step 3.3 — not the Android or iOS one. The client ID must start with the same project number as in your `google-services.json`.

---

## Step 4: Environment Configuration

### 4.1 — Create your .env file

```bash
cp .env.example .env
```

### 4.2 — Edit the .env file

Open `.env` and fill in all three values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Where to find each value:
- **SUPABASE_URL** → Supabase Dashboard → Project Settings → API → "Project URL"
- **SUPABASE_ANON_KEY** → Supabase Dashboard → Project Settings → API → `anon public` key
- **GOOGLE_WEB_CLIENT_ID** → Google Cloud Console → APIs & Services → Credentials → Web client ID

### 4.3 — Push secrets to EAS

EAS cloud builds need access to your environment variables. Push them as secrets:

```bash
eas env:push --env-file .env --force
```

> Run this again whenever you update a value in `.env` (e.g. after changing the Google Web Client ID).

### 4.4 — Make sure .env is gitignored

```bash
cat .gitignore | grep .env
```

You should see `.env` in the output. If not, add it:

```bash
echo ".env" >> .gitignore
```

---

## Step 5: App Assets

Replace placeholder images in `assets/images/` with your real designs.

### 5.1 — Required files

| File | Size | Purpose |
|------|------|---------|
| `assets/images/icon.png` | 1024×1024 | App icon (iOS & Android) |
| `assets/images/adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `assets/images/splash.png` | 1284×2778 | Splash screen |
| `assets/images/notification-icon.png` | 96×96 | Android notification icon |

### 5.2 — Design notes

- **icon.png** — use a solid background colour, no transparency
- **adaptive-icon.png** — Android crops this into different shapes per device; keep the main graphic centred with padding around the edges
- **splash.png** — keep it simple; a centred logo on a solid background works well
- **notification-icon.png** — must be **monochrome white on a transparent background**; Android ignores colour in notification icons

### 5.3 — Replace the files

```bash
cp /path/to/your/icon.png assets/images/icon.png
cp /path/to/your/adaptive-icon.png assets/images/adaptive-icon.png
cp /path/to/your/splash.png assets/images/splash.png
cp /path/to/your/notification-icon.png assets/images/notification-icon.png
```

> 💡 Free tools: [appicon.co](https://appicon.co), [Canva](https://canva.com). You can proceed with placeholders for now and swap them before your final production build.

### 5.4 — Verify app.json references

Confirm these paths exist in `app.json`:

```json
"icon": "./assets/images/icon.png",
"splash": {
  "image": "./assets/images/splash.png"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png"
  }
}
```

---

## Step 6: EAS Build Setup

### 6.1 — Install EAS CLI

```bash
npm install -g eas-cli
eas --version
```

### 6.2 — Log in to Expo

```bash
eas login
```

> Create a free account at [expo.dev](https://expo.dev) if you don't have one yet.

### 6.3 — Initialise EAS in your project

```bash
eas init
```

This links your local project to EAS and automatically adds a `projectId` to `app.json`.

### 6.4 — Confirm app.json was updated

Open `app.json` and confirm the project ID was added:

```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Replace any remaining `YOUR_EAS_PROJECT_ID` placeholder with the generated ID.

### 6.5 — Confirm eas.json exists

Your project root should have an `eas.json` with build profiles for `development`, `preview`, and `production`. If it doesn't exist, create it:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## Step 7: Build & Submit — Android

### 7.1 — Development build (test on device first)

```bash
eas build --profile development --platform android
```

This builds a debug APK (~5–10 mins). When done, scan the QR code or download the APK and install it on your Android device.

> First time running this, EAS may ask:
> - **Generate a new Android keystore?** → Yes (let EAS manage it)
> - **Set up Push Notifications?** → Yes

### 7.2 — Test thoroughly before production

Once the dev build is installed, verify:

- [ ] Google Sign-In works
- [ ] Data loads from Supabase correctly
- [ ] Push notifications arrive when an announcement is posted
- [ ] All screens navigate correctly

### 7.3 — Production build

```bash
eas build --profile production --platform android
```

This produces an **AAB file** (Android App Bundle) required by Google Play Store.

### 7.4 — Set up Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console) and pay the **$25 one-time fee** if not done
2. Click **"Create app"** and fill in app name, language, type, and pricing
3. Complete the **store listing** (description, screenshots, icon)
4. Complete the **content rating** questionnaire
5. Set up **target audience**
6. Start with an **Internal Testing** track before going to production

### 7.5 — Create a Google Play service account (for EAS submit)

1. In Google Play Console → **Setup → API access**
2. Link to a Google Cloud project
3. Click **"Create new service account"** → follow the steps → download the JSON key
4. Save it as `google-play-service-account.json` in your project root
5. Add it to `.gitignore` immediately:
   ```bash
   echo "google-play-service-account.json" >> .gitignore
   ```

### 7.6 — Submit to Play Store

**Via EAS (automated):**
```bash
eas submit --platform android
```

**Manually (simpler for first time):**
1. Download the `.aab` file from EAS dashboard after the production build
2. In Google Play Console → your app → **Internal Testing → Create new release**
3. Upload the `.aab` file → add release notes → **Save and review → Start rollout**

> 💡 Recommended release path: Internal Testing → Closed Testing → Open Testing → Production. Don't go straight to Production — Google may reject the app without a prior review track.

---

## Step 8: Build & Submit — iOS

> ⚠️ Requires a paid **Apple Developer account** ($99/year) and **macOS with Xcode 15+**.

### 8.1 — Complete the skipped steps

Before building for iOS, make sure these are done:

- Apple Sign-In enabled in **Supabase → Authentication → Providers**
- `GoogleService-Info.plist` downloaded from Firebase and placed in project root
- iOS OAuth client ID added to `app.json` (replacing `YOUR_IOS_CLIENT_ID`)

### 8.2 — Register your app in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **"My Apps" → "+" → "New App"**
3. Fill in:
   - **Platform**: iOS
   - **Name**: `Dhamma School`
   - **Primary language**: English (Australia)
   - **Bundle ID**: `org.mahamevnawa.dhamma-school`
   - **SKU**: any unique string, e.g. `dhamma-school-001`
4. Click **"Create"**

### 8.3 — Configure Apple Sign-In in Supabase

1. In [developer.apple.com](https://developer.apple.com), go to **Certificates, IDs & Profiles → Keys**
2. Create a new key, enable **Sign In with Apple**, and download it
3. In Supabase → **Authentication → Providers → Apple**, fill in:
   - **Services ID**: your Apple Services ID
   - **Team ID**: found in top-right of your Apple Developer account
   - **Key ID** and **Private Key**: from the key you just created
4. Click **"Save"**

### 8.4 — Update eas.json for iOS

Add iOS configuration to your build profiles in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 8.5 — Development build for iOS

```bash
eas build --profile development --platform ios
```

> EAS will ask about provisioning profiles and certificates — let it manage them automatically (recommended).

Install the resulting `.ipa` on a registered test device via the EAS dashboard link.

### 8.6 — Test thoroughly on a physical iOS device

- [ ] Apple Sign-In works
- [ ] Google Sign-In works on iOS
- [ ] Push notifications arrive (must test on physical device — not simulator)
- [ ] All screens navigate correctly

### 8.7 — Production build

```bash
eas build --profile production --platform ios
```

### 8.8 — Submit to App Store

**Via EAS (automated):**
```bash
eas submit --platform ios
```

**Manually:**
1. Download the `.ipa` from EAS dashboard
2. Open **Xcode → Window → Organizer** or use **Transporter app** to upload the `.ipa` to App Store Connect
3. In App Store Connect → your app → **TestFlight** — wait for processing (~10–30 mins)
4. Test via TestFlight on physical devices before submitting for review
5. When ready: App Store Connect → your app → **App Store → Submit for Review**

> 💡 Apple review typically takes 1–3 business days. Make sure your **privacy policy URL** and **support URL** are filled in before submitting, or the review will be rejected.

---

## Pre-launch Checklist

- [ ] All migrations run on Supabase
- [ ] Supabase RLS policies verified (`010_rls_policies.sql`)
- [ ] Google OAuth configured in Supabase + Google Cloud Console
- [ ] Apple Sign-In configured (iOS — requires paid Apple Developer account)
- [ ] `google-services.json` (Android) present in project root
- [ ] `GoogleService-Info.plist` (iOS) present in project root
- [ ] `.env` populated with real values (never commit this file)
- [ ] `app.json` EAS project ID and iOS client ID filled in
- [ ] App icon and splash screen assets replaced (placeholders are in `assets/images/`)
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` secret set in Supabase
- [ ] `send-notification` Edge Function deployed
- [ ] Supabase webhook configured to trigger Edge Function on `announcements` INSERT
- [ ] Push notifications tested on physical iOS and Android devices
- [ ] First admin account seeded via SQL (see Database Seeding section)
- [ ] Default school record seeded (see migration 001)
- [ ] Privacy policy and terms of service URLs added to app stores
- [ ] App store screenshots prepared (6.7" iPhone, 12.9" iPad, Pixel 8)

---

## Database Seeding

After running migrations, seed the initial school record via Supabase SQL editor:

```sql
INSERT INTO schools (name, location)
VALUES ('Jethavanaya Dhamma School', 'Melbourne, VIC, Australia');
```

### Seed the first admin account

Admin accounts cannot be self-created from the app. The first admin must be seeded via SQL:

1. Sign in to the app via Google using the account that should be the first admin
2. Complete the profile creation (as parent or teacher — the role will be overridden)
3. Find your user ID in Supabase → Table Editor → `user_profiles`
4. Run this in the SQL Editor:

```sql
UPDATE user_profiles
SET role = 'admin', status = 'active'
WHERE id = 'YOUR_USER_UUID';
```

Once the first admin is set up, they can promote other users to admin from the app:
**More → Manage Admins → search for a user → Promote**

> This is the only time you need to touch the database directly for admin setup.