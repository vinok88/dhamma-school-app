# Technical Reference — Dhamma School App

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Native (Expo)            │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Parent  │  │ Teacher  │  │  Admin   │  │
│  │  Screens │  │  Screens │  │  Screens │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼─────┐ │
│  │         TanStack Query (hooks)          │ │
│  └─────────────────────┬───────────────────┘ │
│                        │                     │
│  ┌─────────────────────▼───────────────────┐ │
│  │         Supabase JS Client              │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │           Supabase          │
         │  ┌────────┐  ┌───────────┐  │
         │  │ Postgres│  │  Storage  │  │
         │  │  (RLS)  │  │  Buckets  │  │
         │  └────────┘  └───────────┘  │
         │  ┌────────┐  ┌───────────┐  │
         │  │  Auth  │  │ Realtime  │  │
         │  └────────┘  └───────────┘  │
         └─────────────────────────────┘
```

---

## Navigation Structure (Expo Router)

```
app/
├── _layout.tsx           ← Root: auth guard, font loading, QueryClient
├── (auth)/
│   ├── login.tsx         ← Google / Apple OAuth
│   └── role-select.tsx   ← Profile creation + role selection
├── (parent)/             ← Tab navigator (5 tabs)
│   ├── index.tsx         ← Home: children list
│   ├── register-student.tsx ← 3-step wizard
│   ├── student/[id].tsx  ← Student status
│   ├── calendar.tsx      ← Events calendar
│   ├── announcements.tsx ← Filtered announcements
│   ├── messages.tsx      ← Conversation list
│   └── profile.tsx       ← Edit profile
├── (teacher)/            ← Tab navigator (5 tabs)
│   ├── index.tsx         ← Home: class card + stats
│   ├── attendance.tsx    ← Check-in / check-out
│   ├── class.tsx         ← Class roster
│   ├── student/[id].tsx  ← Student detail
│   ├── announce.tsx      ← Send announcement
│   └── profile.tsx       ← Edit profile
├── (admin)/              ← Tab navigator (5 tabs + hidden screens)
│   ├── index.tsx         ← Dashboard: stats + charts
│   ├── registrations.tsx ← Approve/reject students & teachers
│   ├── students.tsx      ← All students list
│   ├── classes.tsx       ← Class management CRUD
│   ├── more.tsx          ← Teachers, Events, Reports, Announce
│   ├── teachers.tsx      ← Teacher management
│   ├── events.tsx        ← Event management
│   ├── reports.tsx       ← Attendance reports + CSV export
│   └── announce.tsx      ← Compose announcement
├── notifications.tsx     ← Shared notification centre
└── messages/[recipientId].tsx ← Message thread
```

---

## State Management

**TanStack Query** handles all server state:
- Queries auto-invalidate after mutations
- 5-minute stale time, 10-minute gc time
- Optimistic updates on attendance (check-in/out)
- 5-second polling on message threads

All hooks in `src/hooks/`:

| Hook file | Key exports |
|-----------|------------|
| `useAuth.ts` | `useAuth()` — session, profile, signOut, signInWithGoogle |
| `useStudents.ts` | useMyStudents, useClassStudents, useAllStudents, useCreateStudent, useApproveStudent, useRejectStudent |
| `useAttendance.ts` | useTodayAttendance, useStudentAttendanceHistory, useCheckIn, useCheckOut, useMarkAbsent, useAttendanceReport |
| `useClasses.ts` | useClasses, useMyClass, useCreateClass, useUpdateClass, useDeleteClass |
| `useTeachers.ts` | useTeachers, usePendingTeachers, useApproveTeacher, useRejectTeacher |
| `useAnnouncements.ts` | useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement |
| `useEvents.ts` | useEvents, useUpcomingEvents, useCreateEvent, useUpdateEvent, useDeleteEvent |
| `useMessages.ts` | useConversations, useMessageThread, useSendMessage |
| `useNotifications.ts` | useNotifications, useMarkAllNotificationsRead |
| `useProfile.ts` | useUpdateProfile, useUploadProfilePhoto, useUploadStudentPhoto |

---

## Supabase Schema Summary

| Table | Key columns |
|-------|------------|
| `schools` | id, name, location |
| `user_profiles` | id (→ auth.users), school_id, full_name, role, status, fcm_token |
| `students` | id, school_id, parent_id, class_id, first_name, last_name, dob, status |
| `classes` | id, school_id, teacher_id, name, grade_level |
| `attendance_records` | id, student_id, class_id, session_date, status, checkin_time, checkout_time |
| `announcements` | id, school_id, author_id, title, body, type, target_class_id |
| `events` | id, school_id, title, event_type, start_datetime, location |
| `messages` | id, sender_id, recipient_id, body, read_at |
| `notifications` | id, user_id, title, body, type, is_read |

**Unique constraint:** `attendance_records(student_id, session_date)` — one record per student per session day. Upserted on check-in / absent marking.

---

## Authentication Flow

```
App launch
    │
    ▼
supabase.auth.getSession()
    │
    ├─ No session ──────────────────► (auth)/login
    │
    └─ Session exists
           │
           ▼
    Fetch user_profiles by id
           │
           ├─ No profile ──────────► (auth)/role-select
           │                         (creates profile, waits for approval)
           │
           └─ Profile exists
                  │
                  ├─ role=parent ──► (parent)
                  ├─ role=teacher ─► (teacher)
                  └─ role=admin ───► (admin)
```

**Teacher accounts** start with `status=pending`. Admins approve via the Registrations screen before teachers can access the teacher portal.

---

## Styling

Uses **NativeWind v4** (Tailwind CSS for React Native):
- `className` props on React Native components
- Custom colours defined in `tailwind.config.js` match the brand palette
- Global CSS entry: `src/styles/globals.css`

Brand colours:

| Name | Hex |
|------|-----|
| `primary` | `#F34E3A` |
| `navy` | `#052254` |
| `gold` | `#F7B656` |
| `cream` | `#FBF4C2` |
| `brown` | `#614141` |
| `success` | `#4CAF87` |
| `error` | `#C0392B` |

---

## Push Notifications

- **expo-notifications** handles device token registration and local notifications
- FCM token is stored in `user_profiles.fcm_token` on login
- Supabase Edge Functions (or a backend service) send push notifications when:
  - A new announcement is published
  - A message is received
  - A registration status changes

// TODO: Implement Supabase Edge Function for FCM dispatch

---

## Security

- **Row Level Security (RLS)** enforced at the database level — see `supabase/migrations/010_rls_policies.sql`
- Session tokens stored in **Expo SecureStore** (encrypted on-device)
- No sensitive data in `.env` committed to version control
- Image access via **signed URLs** (1-hour expiry) from Supabase Storage
- Parent-to-parent messaging blocked via RLS policy
