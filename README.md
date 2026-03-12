# Dhamma School — Student Management App

Mobile app for **Mahamevnawa Dhamma School – Melbourne**. Built with **React Native (Expo)** for iOS and Android, backed by **Supabase**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile (iOS & Android) | React Native via Expo SDK 53 |
| Navigation | Expo Router v4 (file-based) |
| State / Data fetching | TanStack Query v5 |
| Forms & Validation | React Hook Form + Zod |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Backend / Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase OAuth — Google (+ Apple on iOS) |
| Push Notifications | Expo Notifications + Firebase FCM |
| Image Storage | Supabase Storage |

---

## User Roles

| Role | Description |
|------|-------------|
| **Parent** | Register children, track status, view calendar, read announcements, message teachers |
| **Teacher** | Take attendance (check-in / check-out), manage class roster, send announcements |
| **Admin** | Full CRUD for students, teachers, classes, events; approve registrations; attendance reports |

---

## Project Structure

```
dhamma_school_app/
├── app/                         # Expo Router screens
│   ├── _layout.tsx              # Root layout + auth guard
│   ├── (auth)/                  # Login, role selection
│   ├── (parent)/                # Parent tab navigator + screens
│   ├── (teacher)/               # Teacher tab navigator + screens
│   ├── (admin)/                 # Admin tab navigator + screens
│   ├── notifications.tsx        # Shared notification centre
│   └── messages/[recipientId].tsx  # Message thread
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Button, Card, Badge, Avatar, Input, etc.
│   │   ├── StudentCard.tsx
│   │   ├── AnnouncementCard.tsx
│   │   └── EventCard.tsx
│   ├── hooks/                   # TanStack Query hooks
│   │   ├── useAuth.ts
│   │   ├── useStudents.ts
│   │   ├── useAttendance.ts
│   │   ├── useClasses.ts
│   │   ├── useTeachers.ts
│   │   ├── useAnnouncements.ts
│   │   ├── useEvents.ts
│   │   ├── useMessages.ts
│   │   ├── useNotifications.ts
│   │   └── useProfile.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (SecureStore session)
│   │   └── query-client.ts      # TanStack Query client config
│   ├── types/index.ts           # TypeScript interfaces & enums
│   ├── constants/index.ts       # Table names, colours, config
│   ├── utils/
│   │   ├── date.ts              # Date formatting helpers
│   │   └── schemas.ts           # Zod validation schemas
│   └── styles/globals.css       # NativeWind / Tailwind entry
├── supabase/migrations/         # SQL schema migrations (Postgres)
├── assets/                      # App icons, splash, images
├── app.json                     # Expo config
├── package.json
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- Expo CLI: `npm install -g expo`
- [Supabase account](https://supabase.com)
- Android Studio (for Android) or Xcode 15+ (for iOS)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase URL and anon key from the Supabase dashboard.

### 3. Run database migrations
In the Supabase SQL editor, run each file in `supabase/migrations/` in order (001 → 010).

### 4. Start the app
```bash
npx expo start          # Expo dev server (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID |

---

## Building for Production

### Using EAS Build (recommended)
```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK / AAB for Play Store
eas build --platform ios       # IPA for App Store
```

See [DEPLOY.md](./DEPLOY.md) for full deployment and store submission instructions.
