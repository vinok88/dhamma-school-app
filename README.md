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

## Testing

The project uses **Jest** with the `jest-expo` preset and **@testing-library/react-native** for component/screen tests.

### Commands

```bash
npm test              # run the full suite once
npm run test:watch    # watch mode (re-runs on file changes)
npm run test:ci       # CI-friendly: silent + coverage
npm run typecheck     # strict TypeScript type checking
```

CI runs `typecheck`, `lint`, and `test:ci` on every push / PR to `main`
(see [.github/workflows/ci.yml](./.github/workflows/ci.yml)).

### Test layout

Tests sit in `__tests__/` folders next to the source they cover:

```
app/(admin)/__tests__/        # admin screen smoke tests
app/(auth)/__tests__/         # login / role selection
app/(parent)/__tests__/       # parent-facing screens
app/(teacher)/__tests__/      # teacher-facing screens
app/__tests__/                # top-level screens (notifications)
app/messages/__tests__/       # message thread
src/hooks/__tests__/          # hook unit tests
src/test-utils/               # shared helpers (render, fixtures)
```

Global mocks for Expo native modules, NativeWind, Reanimated, Supabase,
`expo-router`, charting, and calendar libraries live in
[jest.setup.ts](./jest.setup.ts). Individual tests only need to mock the
**domain hooks** the screen consumes.

### Writing a new screen test

Use the shared helpers:

```tsx
import { renderScreen } from '@/test-utils/render';
import { queryOk, parentProfile } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useMyStudents: jest.fn(),
}));

import MyScreen from '../my-screen';
import { useMyStudents } from '@/hooks/useStudents';

it('renders student list', () => {
  (useMyStudents as jest.Mock).mockReturnValue(queryOk([/* ... */]));
  renderScreen(<MyScreen />);
  // ... assertions
});
```

Conventions:

- **`renderScreen()`** wraps the tree in a fresh `QueryClientProvider`
  with retries disabled — use it instead of RNTL's bare `render`.
- **Fixture builders** (`adminProfile`, `parentProfile`, `teacherProfile`,
  `makeStudent`, `queryOk`, `queryLoading`, `mutationStub`) live in
  [src/test-utils/fixtures.ts](./src/test-utils/fixtures.ts).
- Mock variables referenced inside `jest.mock()` factories **must start
  with `mock`** (e.g. `mockPush`, `mockMutate`) — Jest hoists the factory
  and only allows this prefix through.
- Inside a `jest.mock()` factory, reference fixtures with an inline
  `require('@/test-utils/fixtures')` — they can't be imported at the top
  of the file because the factory is hoisted above imports.

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
