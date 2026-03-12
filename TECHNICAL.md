# Dhamma School App — Technical Documentation

**Version:** 1.0
**Organisation:** Mahamevnawa Buddhist Monastery, Melbourne
**Bundle ID:** `com.mahamevnawa.dhammaschool`
**Stack:** Flutter · Supabase · Firebase · Vercel

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Core Components](#4-core-components)
5. [Data Layer](#5-data-layer)
6. [State Management](#6-state-management)
7. [Navigation & Routing](#7-navigation--routing)
8. [Authentication Flow](#8-authentication-flow)
9. [Feature Modules](#9-feature-modules)
10. [Backend — Supabase](#10-backend--supabase)
11. [Push Notifications — Firebase](#11-push-notifications--firebase)
12. [Design System](#12-design-system)
13. [How to Build Android App](#13-how-to-build-android-app)
14. [How to Build iOS App](#14-how-to-build-ios-app)
15. [How to Deploy Web Portal](#15-how-to-deploy-web-portal)
16. [Environment Configuration](#16-environment-configuration)
17. [Common Issues & Solutions](#17-common-issues--solutions)

---

## 1. System Architecture

The system follows a **three-tier client-server architecture** with a shared Flutter codebase targeting all three platforms.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                                                                      │
│   ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│   │   Android App   │   │    iOS App      │   │   Web Portal     │  │
│   │  (Parents &     │   │  (Parents &     │   │  (Admin only)    │  │
│   │   Teachers)     │   │   Teachers)     │   │  Vercel hosted   │  │
│   └────────┬────────┘   └────────┬────────┘   └────────┬─────────┘  │
│            │                     │                      │            │
│            └─────────────────────┴──────────────────────┘            │
│                         Single Flutter Codebase                      │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │  HTTPS / WebSocket
┌────────────────────────────────▼─────────────────────────────────────┐
│                         BACKEND LAYER                                │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                    Supabase Platform                         │   │
│   │                                                              │   │
│   │  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │   │
│   │  │ Auth     │  │ PostgREST│  │ Realtime  │  │  Storage  │  │   │
│   │  │(OAuth2)  │  │  (REST   │  │(WebSocket)│  │ (Private  │  │   │
│   │  │          │  │   API)   │  │           │  │  Buckets) │  │   │
│   │  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  │   │
│   │       │              │              │               │         │   │
│   │  ┌────▼──────────────▼──────────────▼───────────────▼──────┐ │   │
│   │  │                  PostgreSQL Database                     │ │   │
│   │  │  schools │ user_profiles │ students │ classes            │ │   │
│   │  │  attendance_records │ announcements │ events             │ │   │
│   │  │  messages │ notifications                                │ │   │
│   │  └──────────────────────────────────────────────────────────┘ │   │
│   │                                                              │   │
│   │  ┌──────────────────────┐                                   │   │
│   │  │   Edge Functions     │  ← Deno TypeScript serverless     │   │
│   │  │  send-notification/  │    functions                      │   │
│   │  └──────────┬───────────┘                                   │   │
│   └─────────────┼────────────────────────────────────────────────┘   │
│                 │                                                     │
└─────────────────┼─────────────────────────────────────────────────────┘
                  │  FCM HTTP v1 API
┌─────────────────▼─────────────────────────────────────────────────────┐
│                    Firebase Cloud Messaging                           │
│              (Push notifications → Android & iOS devices)            │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Action | Flow |
|--------|------|
| User login | App → Supabase Auth (OAuth) → JWT → user_profiles row |
| Register student | Parent fills form → Supabase Storage (photo) → students table → teacher notified |
| Approve student | Admin taps Approve → students.status updated → parent notified via FCM |
| Mark attendance | Teacher taps Check In → attendance_records upserted → Realtime pushes to other teachers |
| Send announcement | Admin/Teacher posts → announcements INSERT → DB webhook → Edge Function → FCM multicast |
| Real-time messages | Sender INSERT → Supabase Realtime → recipient's app stream → chat bubble rendered |

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Mobile/Web UI | Flutter | 3.41.4 | Single codebase for Android, iOS, Web |
| Language | Dart | 3.11.1 | Flutter's language |
| State Management | Riverpod | 2.6.1 | Reactive state, dependency injection |
| Navigation | go_router | 13.2.5 | Declarative URL-based routing |
| Forms | reactive_forms | 17.0.1 | Form validation and control |
| Backend | Supabase | 2.12.0 | Auth, database, storage, realtime |
| Database | PostgreSQL | 15 (Supabase managed) | Relational data store |
| Push Notifications | Firebase Messaging | 15.1.0 | FCM for Android & iOS push |
| Charts | fl_chart | 0.68.0 | Attendance trend charts |
| Calendar | table_calendar | 3.2.0 | Interactive event calendar |
| Fonts | google_fonts | 6.3.3 | DM Serif Display, Work Sans |
| Image Handling | image_picker + image_cropper | 1.2.1 / 7.1.0 | Student photo upload |
| Network Images | cached_network_image | 3.4.0 | Efficient image loading & caching |
| CSV Export | csv | 6.0.0 | Attendance report downloads |
| File Sharing | share_plus | 9.0.0 | Export CSV to files/email |
| Localisation | flutter_localizations | SDK | English + Sinhala support |
| Web Hosting | Vercel | — | Flutter web build hosting |

---

## 3. Project Structure

```
dhamma_school_app/
│
├── lib/                          # All Dart source code
│   ├── main.dart                 # Production entry point
│   ├── main_demo.dart            # Demo entry point (no backend needed)
│   │
│   ├── core/                     # App-wide infrastructure
│   │   ├── constants/
│   │   │   └── app_constants.dart       # Table names, enums, config values
│   │   ├── router/
│   │   │   ├── app_router.dart          # All 24 routes + auth guards
│   │   │   └── app_router.g.dart        # Generated Riverpod provider stub
│   │   ├── theme/
│   │   │   ├── app_colors.dart          # 9 design token colors
│   │   │   ├── app_text_styles.dart     # Typography constants
│   │   │   └── app_theme.dart           # Full MaterialTheme definition
│   │   └── utils/
│   │       ├── date_utils.dart          # Age calc, date formatting, timeAgo
│   │       └── validators.dart          # Phone, email, DOB, required validators
│   │
│   ├── services/                 # External service wrappers
│   │   ├── supabase_service.dart        # Singleton: all typed Supabase queries
│   │   ├── auth_service.dart            # Google Sign-In, Apple Sign-In, signOut
│   │   ├── notification_service.dart    # FCM init, token management, local notifs
│   │   └── storage_service.dart         # Photo upload, signed URL generation
│   │
│   ├── models/                   # Pure Dart data models
│   │   ├── user_model.dart              # UserModel + UserRole + UserStatus enums
│   │   ├── student_model.dart           # StudentModel + StudentStatus enum
│   │   ├── class_model.dart             # ClassModel
│   │   ├── attendance_model.dart        # AttendanceModel + AttendanceStatus enum
│   │   ├── announcement_model.dart      # AnnouncementModel + AnnouncementType enum
│   │   ├── event_model.dart             # EventModel + EventType enum
│   │   ├── message_model.dart           # MessageModel
│   │   └── notification_model.dart      # NotificationModel
│   │
│   ├── providers/                # Riverpod state providers
│   │   ├── auth_provider.dart           # authState, userProfile, currentRole
│   │   ├── student_provider.dart        # Students by parent/class/school
│   │   ├── teacher_provider.dart        # Teachers, pending approvals
│   │   ├── class_provider.dart          # Classes list, assignment
│   │   ├── attendance_provider.dart     # Today's attendance, optimistic updates
│   │   ├── announcement_provider.dart   # School & class announcements
│   │   ├── event_provider.dart          # Events by month
│   │   └── message_provider.dart        # Conversations, threads, realtime
│   │
│   ├── features/                 # UI screens by role
│   │   ├── auth/
│   │   │   ├── login_screen.dart        # Google/Apple sign-in
│   │   │   └── role_selection_screen.dart # First-login role picker + reg form
│   │   ├── parent/
│   │   │   ├── parent_home_screen.dart  # Bottom nav shell (4 tabs)
│   │   │   ├── register_student_screen.dart  # 3-step registration form
│   │   │   ├── student_status_screen.dart    # Registration status + resubmit
│   │   │   ├── announcements_screen.dart     # Announcement feed
│   │   │   ├── calendar_screen.dart          # table_calendar + events
│   │   │   └── parent_profile_screen.dart    # Edit profile, language toggle
│   │   ├── teacher/
│   │   │   ├── teacher_home_screen.dart      # Bottom nav shell (4 tabs)
│   │   │   ├── attendance_screen.dart        # Swipe check-in/out list
│   │   │   ├── class_roster_screen.dart      # Searchable class list
│   │   │   ├── student_detail_screen.dart    # Full student profile + history
│   │   │   ├── send_announcement_screen.dart # Class announcement composer
│   │   │   └── teacher_profile_screen.dart   # Teacher profile edit
│   │   ├── admin/
│   │   │   ├── admin_dashboard_screen.dart   # KPI cards + fl_chart attendance
│   │   │   ├── pending_registrations_screen.dart # Approve/reject students & teachers
│   │   │   ├── student_management_screen.dart    # Search, filter, status change
│   │   │   ├── teacher_management_screen.dart    # Teacher list, class assignment
│   │   │   ├── class_management_screen.dart      # Class CRUD
│   │   │   ├── event_management_screen.dart      # Calendar CRUD
│   │   │   ├── reports_screen.dart               # Attendance reports + CSV export
│   │   │   └── announcement_compose_screen.dart  # School-wide announcements
│   │   └── shared/
│   │       ├── splash_screen.dart               # Animated splash + auth redirect
│   │       ├── message_thread_screen.dart       # Realtime chat UI
│   │       └── notification_centre_screen.dart  # In-app notification inbox
│   │
│   ├── widgets/                  # Reusable UI components
│   │   ├── app_bar_widget.dart          # Custom AppBar with notification bell
│   │   ├── photo_placeholder.dart       # Initials avatar + NetworkPhotoWidget
│   │   ├── status_badge.dart            # Colour-coded status pills
│   │   ├── student_card.dart            # Student list card
│   │   ├── attendance_tile.dart         # Swipeable Dismissible attendance row
│   │   ├── announcement_card.dart       # Announcement with type chip
│   │   ├── event_card.dart              # Event display card
│   │   └── loading_overlay.dart         # Full-screen loading indicator
│   │
│   └── demo/                     # Demo mode (no backend)
│       └── mock_data.dart               # Static mock users, students, events
│
├── supabase/
│   ├── migrations/               # PostgreSQL DDL (run in order)
│   │   ├── 001_create_schools.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_students.sql
│   │   ├── 004_create_classes.sql
│   │   ├── 005_create_attendance.sql
│   │   ├── 006_create_announcements.sql
│   │   ├── 007_create_events.sql
│   │   ├── 008_create_messages.sql
│   │   ├── 009_create_notifications.sql
│   │   └── 010_rls_policies.sql
│   └── functions/
│       └── send-notification/
│           └── index.ts                 # Deno Edge Function: FCM dispatch
│
├── assets/
│   ├── images/                   # App images (add lotus SVG here)
│   └── l10n/
│       ├── app_en.arb            # English strings
│       └── app_si.arb            # Sinhala strings
│
├── android/                      # Android platform project
├── ios/                          # iOS platform project
├── web/                          # Web platform entry point
│   └── index.html                # PWA meta tags, loading screen
│
├── pubspec.yaml                  # Package dependencies
├── vercel.json                   # Vercel web deployment config
├── Makefile                      # Build automation targets
├── .env.example                  # Environment variable template
├── SRS.md                        # Software Requirements Specification
├── DEPLOY.md                     # Deployment guide
└── TECHNICAL.md                  # This document
```

---

## 4. Core Components

### 4.1 `AppConstants` — `lib/core/constants/app_constants.dart`

Central configuration class. All table names, bucket names, status strings, and timing constants are defined here. Never hardcode table names in queries — always use `AppConstants.tableXxx`.

```dart
AppConstants.tableStudents          // → 'students'
AppConstants.bucketStudentPhotos    // → 'student-photos'
AppConstants.statusCheckedIn        // → 'checked_in'
AppConstants.sessionDayOfWeek       // → DateTime.sunday (7)
```

### 4.2 `AppTheme` — `lib/core/theme/app_theme.dart`

Single source of truth for all Material 3 theming. Applied once in `main.dart` via `theme: AppTheme.light()`. Overrides:

- `AppBarTheme` → dark navy background, white DM Serif Display title
- `FilledButtonTheme` → primary red, 8px radius, Work Sans 600
- `CardTheme` → white, 12px radius, 2pt elevation, cream border
- `BottomNavigationBarTheme` → white bg, primary red selected icon
- `InputDecorationTheme` → filled white, rounded corners

### 4.3 `AppRouter` — `lib/core/router/app_router.dart`

Built with `go_router`. Provides 24 named routes with a global redirect guard:

```
Redirect logic:
  not authenticated  → /login
  authenticated + no profile → /role-select
  authenticated + profile → (no redirect, user accesses requested route)
```

Route naming convention: `AppRoutes.parentHome`, `AppRoutes.teacherAttendance`, etc.

### 4.4 `AppDateUtils` — `lib/core/utils/date_utils.dart`

| Method | Description |
|--------|-------------|
| `calculateAge(dob)` | Returns integer age from date of birth |
| `formatDate(dt)` | `"Sun, 12 Mar 2026"` |
| `formatTime(dt)` | `"09:05 AM"` |
| `timeAgo(dt)` | `"2h ago"`, `"3d ago"` |
| `lastNSundays(n)` | Returns list of last N Sunday dates for reports |
| `toDateString(dt)` | `"2026-03-12"` (Supabase date format) |

### 4.5 `AppValidators` — `lib/core/utils/validators.dart`

Validator functions compatible with `reactive_forms`. Used in all registration forms:

```dart
AppValidators.required
AppValidators.phone       // Australian + Sri Lankan formats
AppValidators.email
AppValidators.dob         // Must be > 0 and < 25 years old
AppValidators.minLength(n)
AppValidators.maxLength(n)
```

---

## 5. Data Layer

### 5.1 Models

All models are pure Dart — no Flutter dependencies. Each implements:

- `factory fromJson(Map<String, dynamic>)` — deserialise from Supabase response
- `toJson()` — serialise for Supabase insert/update
- `copyWith(...)` — immutable updates

**Key computed properties:**

```dart
// StudentModel
int get age        // Calculated from dob at runtime
String get fullName        // '$firstName $lastName'
String get displayName     // preferredName ?? firstName

// AttendanceModel
bool get isPresent         // true if checkedIn OR checkedOut

// StudentStatus enum
String get displayLabel    // Human-readable: 'Under Review', 'Dropped', etc.
bool get isEditable        // Only pending/rejected can be resubmitted

// AnnouncementType enum
bool get isEmergency       // true if == emergency
```

### 5.2 Enums

| Enum | Values |
|------|--------|
| `UserRole` | `parent`, `teacher`, `admin` |
| `UserStatus` | `active`, `inactive`, `pending` |
| `StudentStatus` | `pending`, `underReview`, `approved`, `rejected`, `active`, `inactive`, `dropped` |
| `AttendanceStatus` | `present`, `checkedIn`, `checkedOut`, `absent` |
| `AnnouncementType` | `school`, `clazz`, `emergency`, `eventReminder` |
| `EventType` | `poya`, `sermon`, `exam`, `holiday`, `special` |

> Note: `AnnouncementType.clazz` uses `clazz` (not `class`) to avoid Dart keyword conflict.

### 5.3 `SupabaseService` — `lib/services/supabase_service.dart`

Singleton class. All database interaction goes through here — screens and providers never call `Supabase.instance.client` directly.

**Key query groups:**

| Group | Methods |
|-------|---------|
| User Profiles | `getUserProfile`, `upsertUserProfile`, `updateFcmToken` |
| Students | `getStudentsByParent`, `getStudentsByClass`, `getPendingStudents`, `getAllStudents`, `updateStudentStatus` |
| Attendance | `getTodayAttendance`, `getAttendanceHistory`, `upsertAttendance` |
| Announcements | `getAnnouncements`, `getClassAnnouncements` |
| Events | `getEvents`, `getUpcomingEvents` |
| Messages | `getConversations`, `getMessageThread`, `sendMessage`, `markMessageRead` |
| Notifications | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` |
| Classes | `getClasses`, `getTeacherClass` |
| Realtime | `subscribeToMessages`, `subscribeToAttendance` |

**Realtime subscriptions** use Supabase's Postgres Changes API over WebSocket. Subscriptions are established in providers and cancelled on dispose.

### 5.4 `StorageService` — `lib/services/storage_service.dart`

Handles all file operations with Supabase Storage:

```
Student photos  → bucket: 'student-photos'  → path: '{userId}/{studentId}.jpg'
Profile photos  → bucket: 'profile-photos'  → path: '{userId}/profile.jpg'
Signed URLs     → expire after 3600 seconds (1 hour)
```

Images are always stored in **private buckets** and accessed via time-limited signed URLs — never exposed directly.

---

## 6. State Management

The app uses **Riverpod 2.x** throughout. There are no `setState()` calls outside of demo mode.

### Provider Types Used

| Provider Type | Used For |
|--------------|---------|
| `StreamProvider` | Auth state (live Supabase auth events) |
| `FutureProvider` | User profile, one-time async data fetches |
| `Provider` (derived) | `currentRole`, `currentSchoolId` (derived from profile) |
| `AsyncNotifierProvider` | Auth actions (signOut, updateProfile) |
| `AsyncNotifierProvider.family` | Attendance per class, messages per thread |
| `StateNotifierProvider` | — (replaced by AsyncNotifier) |

### Key Providers

```dart
// Auth
authStateProvider          → StreamProvider<AuthState>
userProfileProvider        → FutureProvider<UserModel?>
currentRoleProvider        → Provider<UserRole?>    (derived)
currentSchoolIdProvider    → Provider<String?>      (derived)

// Data
studentsProvider(schoolId)          → FutureProvider<List<StudentModel>>
myStudentsProvider(parentId)        → FutureProvider<List<StudentModel>>
classStudentsProvider(classId)      → FutureProvider<List<StudentModel>>
pendingStudentsProvider(schoolId)   → FutureProvider<List<StudentModel>>
todayAttendanceProvider(classId)    → AsyncNotifier with optimistic updates
announcementsProvider(schoolId)     → FutureProvider<List<AnnouncementModel>>
eventsProvider(schoolId)            → FutureProvider<List<EventModel>>
threadProvider(userId, recipId)     → realtime stream via Supabase Realtime
```

### Optimistic Updates (Attendance)

`AttendanceNotifier` implements optimistic UI for check-in/out:

1. Update local state immediately → UI reflects change instantly
2. Persist to Supabase in background
3. On error → revert local state → show SnackBar error

---

## 7. Navigation & Routing

All navigation uses `go_router` with type-safe route constants in `AppRoutes`.

```dart
// Navigate (replaces current)
context.go(AppRoutes.parentHome);

// Push (adds to stack)
context.push(AppRoutes.registerStudent);

// Push with path param
context.push('/parent/student/$studentId/status');

// Push with query param
context.push('/messages/$recipientId?name=Ruwan+Bandara');
```

### Route Map

```
/splash                          → SplashScreen (auto-redirects)
/login                           → LoginScreen
/role-select                     → RoleSelectionScreen

/parent/home                     → ParentHomeScreen (bottom nav shell)
/parent/register-student         → RegisterStudentScreen
/parent/student/:id/status       → StudentStatusScreen
/parent/calendar                 → CalendarScreen
/parent/announcements            → AnnouncementsScreen
/parent/profile                  → ParentProfileScreen

/teacher/home                    → TeacherHomeScreen (bottom nav shell)
/teacher/attendance              → AttendanceScreen
/teacher/class                   → ClassRosterScreen
/teacher/student/:id             → StudentDetailScreen
/teacher/announce                → SendAnnouncementScreen
/teacher/profile                 → TeacherProfileScreen

/admin/dashboard                 → AdminDashboardScreen (nav rail)
/admin/registrations             → PendingRegistrationsScreen
/admin/students                  → StudentManagementScreen
/admin/teachers                  → TeacherManagementScreen
/admin/classes                   → ClassManagementScreen
/admin/events                    → EventManagementScreen
/admin/reports                   → ReportsScreen
/admin/announce                  → AnnouncementComposeScreen

/notifications                   → NotificationCentreScreen
/messages/:recipientId           → MessageThreadScreen
```

---

## 8. Authentication Flow

```
App Launch
    │
    ▼
SplashScreen (2s delay)
    │
    ├─ No session ──────────────────→ LoginScreen
    │                                      │
    │                               Google / Apple OAuth
    │                                      │
    │                               Supabase Auth callback
    │                                      │
    │                               Check user_profiles table
    │                                      │
    │                    ┌──────────────────┴──────────────────┐
    │                    │                                     │
    │               No profile row                     Profile exists
    │                    │                                     │
    │               RoleSelectionScreen            Route to role home
    │               (Parent or Teacher)
    │               Fill reg form → upsert profile
    │                    │
    │               teacher → status=pending (awaits admin)
    │               parent  → status=active (immediate access)
    │
    └─ Valid session ───────────────→ Route to role home
                                      based on user_profiles.role
```

**Admin accounts** are created manually via Supabase SQL — they do not go through the social login registration flow.

---

## 9. Feature Modules

### 9.1 Parent Module

**`register_student_screen.dart`** — 3-step `PageView` form:
- Step 1: Child personal details (name, DOB, gender)
- Step 2: Medical & consent (allergy toggle + notes, photo publish consent checkbox)
- Step 3: Photo upload via `image_picker` + 1:1 crop via `image_cropper`, upload to Supabase Storage

Each step validates before advancing. On submit: photo uploaded first → URL stored → student record inserted with `status = 'pending'`.

**`calendar_screen.dart`** — Uses `table_calendar` package. Event markers rendered as coloured dots below dates. Tapping a date shows events for that day in a scrollable list below the calendar. Parents cannot tap to create events.

### 9.2 Teacher Module

**`attendance_screen.dart`** — The core teacher workflow:
- Loads today's `attendance_records` for the teacher's class
- If no records exist yet, creates `absent` records for all class students
- Each row is a `Dismissible` widget: swipe right = Check In, swipe left = Absent
- Explicit buttons also available for accessibility
- Optimistic updates via `AttendanceNotifier` — UI responds instantly

**`student_detail_screen.dart`** — Shows:
- Student photo (signed URL or initials placeholder)
- Personal info, DOB, age, gender
- Allergy alert banner if `hasAllergies = true`
- Parent contact with phone dial button
- Last 8 sessions attendance chips (green/red/grey)
- "Message Parent" CTA → `MessageThreadScreen`

### 9.3 Admin Module

**`admin_dashboard_screen.dart`** — Responsive layout:
- `width >= 800px` → persistent `NavigationRail` (left sidebar)
- `width < 800px` → hamburger `Drawer`
- KPI summary cards: total students, teachers, pending approvals, today's attendance %
- `fl_chart` LineChart: attendance trend over last 8 Sunday sessions
- Classes overview list with student counts

**`reports_screen.dart`** — Attendance reporting:
- `SegmentedButton` to switch Daily / Weekly / Monthly
- `DateRangePicker` for custom date selection
- `DataTable` with colour-coded attendance % (green ≥80%, amber ≥60%, red <60%)
- CSV export via `csv` package + `share_plus` to download or email

### 9.4 Shared Features

**`message_thread_screen.dart`** — Real-time chat:
- On mount: fetches message history from Supabase
- Establishes `RealtimeChannel` subscription on `messages` table
- New inserts appear instantly via stream without polling
- Sender messages: right-aligned, primary red bubbles
- Recipient messages: left-aligned, cream yellow bubbles
- Subscription cancelled on `dispose()`

**`notification_centre_screen.dart`** — In-app inbox:
- Unread notifications have cream yellow background
- Mark individual or all as read
- Tap navigates to relevant screen (announcement detail, event, student status)

---

## 10. Backend — Supabase

### 10.1 Database Schema

```sql
-- Multi-tenant anchor
schools (id, name, location, created_at)

-- Extends Supabase auth.users
user_profiles (
  id UUID FK→auth.users,   school_id FK→schools,
  full_name, preferred_name, phone, address,
  role user_role,           status user_status,
  profile_photo_url,        fcm_token,
  created_at, updated_at
)

-- Student records
students (
  id, school_id, first_name, last_name, preferred_name,
  dob DATE, gender, has_allergies BOOL, allergy_notes,
  photo_url, photo_publish_consent BOOL,
  parent_id FK→user_profiles,  class_id FK→classes,
  status student_status,        status_note,
  created_at, updated_at
)

-- Class groups
classes (
  id, school_id, name, grade_level,
  teacher_id FK→user_profiles,  created_at
)

-- Weekly session attendance
attendance_records (
  id, school_id,
  student_id FK→students,   teacher_id FK→user_profiles,
  class_id FK→classes,       session_date DATE,
  checkin_time TIMESTAMPTZ,  checkout_time TIMESTAMPTZ,
  status attendance_status,  created_at,
  UNIQUE(student_id, session_date)
)

-- Announcements feed
announcements (
  id, school_id, author_id FK→user_profiles,
  title, body, type announcement_type,
  target_class_id FK→classes (nullable),
  published_at, created_at
)

-- Event calendar
events (
  id, school_id, title, description,
  event_type event_type, start_datetime, end_datetime,
  location, created_by FK→user_profiles, created_at
)

-- Direct messages
messages (
  id, school_id,
  sender_id FK→user_profiles,    recipient_id FK→user_profiles,
  body, read_at, created_at
)

-- In-app notification inbox
notifications (
  id, user_id FK→user_profiles,
  title, body, type, reference_id UUID,
  is_read BOOL, created_at
)
```

### 10.2 Row-Level Security (RLS)

Every table has RLS enabled. Key policies:

| Table | Policy |
|-------|--------|
| `user_profiles` | Users read/update own row; admin reads all |
| `students` | Parent sees own children; teacher sees assigned class; admin sees all |
| `attendance_records` | Teacher insert/update own class; parent reads own child's records |
| `announcements` | All authenticated read; teacher insert class-level; admin insert all |
| `events` | All authenticated read; only admin insert/update/delete |
| `messages` | Sender and recipient read; only sender can insert |
| `notifications` | Users read own only |

A helper SQL function `get_my_role()` (SECURITY DEFINER) is used within RLS policies to avoid recursive calls to `user_profiles`.

### 10.3 Edge Function — `send-notification`

Located at `supabase/functions/send-notification/index.ts`.

**Trigger:** Database webhook on `announcements` INSERT
**Runtime:** Deno TypeScript

```
Webhook fires
    │
    ▼
Receive announcement record
    │
    ▼
Query user_profiles for target FCM tokens
  (all school users for 'school' type,
   class students' parents for 'class' type)
    │
    ▼
Insert notification rows into notifications table
    │
    ▼
Send FCM multicast via Firebase HTTP v1 API
    │
    ▼
Log results
```

**Required Supabase secret:**
```bash
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{ ... }'
```

---

## 11. Push Notifications — Firebase

### Flow

```
Announcement published (DB INSERT)
    │
    ▼
Database webhook → Edge Function
    │
    ▼
FCM HTTP v1 API multicast → Firebase
    │
    ├─ App foregrounded  → flutter_local_notifications shows heads-up banner
    │
    ├─ App backgrounded  → OS shows system notification
    │
    └─ App terminated    → OS shows system notification
                              │
                        User taps notification
                              │
                        App launches → go_router navigates
                        to relevant screen based on payload
```

### FCM Token Lifecycle

1. On login: `NotificationService.initialize()` called
2. FCM token fetched from Firebase
3. Token saved to `user_profiles.fcm_token`
4. On token refresh: `FirebaseMessaging.instance.onTokenRefresh` updates the saved token
5. On logout: token cleared from profile

### Platform-Specific Setup

**Android:** FCM works out of the box with `google-services.json`

**iOS:** Requires APNs (Apple Push Notification service):
- APNs Authentication Key (`.p8` file) uploaded to Firebase Console
- `Push Notifications` capability enabled in Xcode
- Background Modes → Remote notifications enabled in Xcode

---

## 12. Design System

### Color Palette

```dart
// lib/core/theme/app_colors.dart

AppColors.primaryRed    = Color(0xFFF34E3A)  // Primary CTA, active states
AppColors.darkBrown     = Color(0xFF614141)  // Headings, body text
AppColors.creamYellow   = Color(0xFFFBF4C2)  // Page backgrounds, card fills
AppColors.white         = Color(0xFFFFFFFF)  // Surface, cards
AppColors.darkNavy      = Color(0xFF052254)  // AppBar, header overlays, buttons
AppColors.goldAmber     = Color(0xFFF7B656)  // Accents, event markers, links
AppColors.successGreen  = Color(0xFF4CAF87)  // Approved, present, active
AppColors.errorRed      = Color(0xFFC0392B)  // Rejected, absent, errors
AppColors.pendingAmber  = Color(0xFFF39C12)  // Pending, under review, warnings
```

Colors sourced from `mahamevnawa.org.au` brand palette.

### Typography

| Style | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `displayLarge` | DM Serif Display | 28sp | 400 | Page titles |
| `headlineMedium` | DM Serif Display | 22sp | 400 | Section headings |
| `headlineSmall` | DM Serif Display | 18sp | 400 | Card headings |
| `bodyLarge` | Work Sans | 16sp | 400 | Primary body text |
| `bodyMedium` | Work Sans | 14sp | 400 | Secondary text |
| `labelLarge` | Work Sans | 14sp | 600 | Buttons, labels |

Sinhala content uses `UN Malithi` / `UN Isiwara` (served via `google_fonts`).

### Component Anatomy

**Status Badge**
```
┌─────────────────┐
│  ●  Approved    │  ← successGreen bg + text, 20px radius
└─────────────────┘
  Pending → pendingAmber
  Rejected → errorRed
  Under Review → darkNavy
```

**Photo Placeholder**
```
Initials avatar with deterministic color from name[0].codeUnit:
A-E → darkNavy   F-J → primaryRed   K-O → green
P-T → purple     U-Z → teal
```

---

## 13. How to Build Android App

### Prerequisites

- Flutter 3.22+ installed
- Android Studio with Android SDK 34+
- Java JDK 17+
- A Google Play Console account (for distribution)

### Step 1 — Set Up Android Project

Verify the bundle ID in `android/app/build.gradle`:
```gradle
android {
    namespace "com.mahamevnawa.dhammaschool"
    ...
    defaultConfig {
        applicationId "com.mahamevnawa.dhammaschool"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

Add Firebase to the Android project:
```bash
# Place google-services.json at android/app/google-services.json
# This file comes from Firebase Console → Project Settings → Android app
```

### Step 2 — Create a Signing Keystore

You only do this **once**. Store the keystore file and passwords securely.

```bash
keytool -genkey -v \
  -keystore android/app/dhamma-school-release.jks \
  -alias dhamma-school \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You will be prompted for:
- Keystore password (use a strong password, save it)
- Key password (can be same as keystore password)
- Organisation details (name, org unit, city, state, country)

### Step 3 — Configure Signing

Create `android/key.properties` (add to `.gitignore` — never commit this):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=dhamma-school
storeFile=dhamma-school-release.jks
```

Edit `android/app/build.gradle` to wire up signing:

```gradle
// Add before the android {} block:
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ?
                file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### Step 4 — Configure Google Sign-In for Android

Get the SHA-1 fingerprint of your release keystore:
```bash
cd android
./gradlew signingReport
# Look for the SHA1 under the 'release' variant
```

In **Google Cloud Console → APIs & Services → Credentials**:
1. Find the Android OAuth credential
2. Add the SHA-1 fingerprint
3. Save

Add to `android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">Dhamma School</string>
    <string name="default_web_client_id">YOUR_GOOGLE_WEB_CLIENT_ID</string>
</resources>
```

### Step 5 — Build the Release App

**Option A — APK** (for direct install / testing):
```bash
export PATH="$PATH:$HOME/development/flutter/bin"

flutter build apk --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Output: build/app/outputs/flutter-apk/app-release.apk
```

**Option B — App Bundle** (required for Google Play Store):
```bash
flutter build appbundle --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Output: build/app/outputs/bundle/release/app-release.aab
```

Or use the Makefile:
```bash
make build-android \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Step 6 — Test on a Device

```bash
# List connected devices
flutter devices

# Run directly on connected Android device
flutter run --release -d YOUR_DEVICE_ID \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=...
```

### Step 7 — Submit to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. **Create app** → fill in app name, select language, app/game, free/paid
3. Complete **Store listing**:
   - Short description (80 chars): *"Manage Dhamma School students, attendance and events"*
   - Full description (4000 chars): describe features
   - Screenshots: at least 2 screenshots for each form factor (phone, tablet)
   - Hi-res icon: 512×512 PNG
   - Feature graphic: 1024×500 PNG
4. Complete **Content rating** questionnaire
5. Complete **App pricing & distribution** (select Australia)
6. Navigate to **Release → Production → Create new release**
7. Upload `app-release.aab`
8. Write release notes
9. **Save → Review release → Start rollout to Production**

> First review typically takes **3–7 business days**. Use **Internal Testing** track first for immediate team testing.

### Android — Common Issues

| Issue | Solution |
|-------|----------|
| `Gradle build failed` | Run `flutter clean && flutter pub get` then retry |
| `SHA-1 mismatch for Google Sign-In` | Add the correct SHA-1 to Google Cloud Console |
| `minSdkVersion` conflict | Ensure `minSdk 21` in `build.gradle` |
| `Package name already taken` | Bundle ID must be globally unique on Play Store |

---

## 14. How to Build iOS App

### Prerequisites

- macOS computer (required — iOS builds cannot be done on Windows/Linux)
- Xcode 15 or later (from Mac App Store)
- Apple Developer Account ($99/year at [developer.apple.com](https://developer.apple.com))
- Flutter installed and iOS toolchain verified: `flutter doctor`

### Step 1 — Configure Xcode Project

Open the iOS project in Xcode:
```bash
open ios/Runner.xcworkspace
# Important: open .xcworkspace not .xcodeproj
```

In Xcode:
1. Select **Runner** in the Project Navigator (left panel)
2. Select the **Runner target** (not the project)
3. Go to **Signing & Capabilities** tab
4. Set **Bundle Identifier**: `com.mahamevnawa.dhammaschool`
5. Set **Team**: select your Apple Developer team
6. Enable **Automatically manage signing** (Xcode handles provisioning profiles)

### Step 2 — Add Firebase

Place `GoogleService-Info.plist` in the Xcode project:
```bash
# This file comes from Firebase Console → Project Settings → iOS app
# Copy to: ios/Runner/GoogleService-Info.plist
```

In Xcode: right-click `Runner` folder → **Add Files to "Runner"** → select `GoogleService-Info.plist` → ensure **Copy items if needed** is checked.

### Step 3 — Configure Apple Sign-In

**In Apple Developer Portal:**

1. Go to [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles
2. **Identifiers** → find your App ID (`com.mahamevnawa.dhammaschool`)
3. Click Edit → enable **Sign In with Apple** → Save

**In Xcode:**

1. Runner target → **Signing & Capabilities**
2. Click **+ Capability**
3. Add **Sign In with Apple**
4. Add **Push Notifications**
5. Add **Background Modes** → check **Remote notifications**

### Step 4 — Configure Google Sign-In for iOS

In `ios/Runner/Info.plist`, add the reversed client ID (found in `GoogleService-Info.plist` under `REVERSED_CLIENT_ID`):

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Paste REVERSED_CLIENT_ID value from GoogleService-Info.plist -->
            <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

Also add the Supabase callback URL scheme:
```xml
<array>
    ...
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.mahamevnawa.dhammaschool</string>
        </array>
    </dict>
</array>
```

### Step 5 — Configure APNs for Push Notifications

**In Apple Developer Portal:**

1. **Keys** → **Create a Key**
2. Name: `Dhamma School APNs Key`
3. Enable **Apple Push Notifications service (APNs)**
4. Download the `.p8` file (you can only download once — store safely)
5. Note the **Key ID** shown on the page
6. Note your **Team ID** (shown in Membership section)

**In Firebase Console:**

1. Project Settings → Cloud Messaging → iOS app configuration
2. Upload the `.p8` file
3. Enter the Key ID and Team ID
4. Save

### Step 6 — Build the Release App

**Build from command line:**
```bash
export PATH="$PATH:$HOME/development/flutter/bin"

flutter build ios --release \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Or use the Makefile:
```bash
make build-ios \
  SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**Archive and Upload in Xcode:**

1. In Xcode menu: **Product → Archive**
2. Xcode Organizer opens automatically when archiving is complete
3. Select the archive → **Distribute App**
4. Choose **App Store Connect** → **Upload**
5. Leave all defaults checked → **Upload**

### Step 7 — Test with TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** tab
3. The uploaded build appears (processing takes ~10 minutes)
4. Add internal testers (up to 100 Apple IDs from your team)
5. Or add external testers for beta (requires Apple review, takes ~1 day)

### Step 8 — Submit to App Store

In App Store Connect → **App Store** tab:

1. **Version Information:**
   - What's New: describe features in each supported language
   - Screenshots: required for 6.5" iPhone (iPhone 15 Pro Max) and 5.5" iPhone
   - App Preview video: optional but recommended

2. **App Information:**
   - Primary language: English (Australia)
   - Category: Education
   - Content rights: confirm you own rights to all content
   - Age rating: complete the questionnaire (likely 4+)

3. **Pricing:** Free

4. **Privacy Policy:** Required — must be publicly accessible URL
   - Minimum policy must mention: what data is collected, how it's used, student data protection

5. Click **Submit for Review**
   - First submission typically takes **1–3 business days**

### iOS — Common Issues

| Issue | Solution |
|-------|----------|
| `Signing certificate not found` | In Xcode, Preferences → Accounts → Download Manual Profiles |
| `Provisioning profile doesn't include capability` | In Apple Developer Portal, refresh the profile after adding capabilities |
| `Push notifications not received on device` | Verify APNs key is uploaded to Firebase; test on physical device (not Simulator) |
| `Sign In with Apple missing` | Ensure capability added in Xcode AND enabled in Apple Developer Portal App ID |
| `'flutter build ios' fails with no Xcode scheme` | Run `open ios/Runner.xcworkspace` and ensure scheme is set to `Runner` |
| `CocoaPods errors` | Run `cd ios && pod install --repo-update` |
| `App rejected: missing privacy policy` | Add a publicly hosted privacy policy URL before resubmitting |

---

## 15. How to Deploy Web Portal

The web portal is a Flutter Web build served via Vercel. It is intended for admin/principal use on desktop browsers.

### Step 1 — Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Step 2 — Link to Vercel Project

```bash
cd /path/to/dhamma_school_app
vercel link
# Follow prompts to create a new project or link to existing
```

### Step 3 — Set Environment Variables

In **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | All |
| `SUPABASE_ANON_KEY` | `eyJ...` | All |
| `GOOGLE_WEB_CLIENT_ID` | `xxx.apps.googleusercontent.com` | All |

### Step 4 — Deploy

```bash
# Deploy to production
vercel --prod

# Or use the Makefile:
make build-web \
  SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_ANON_KEY=eyJ... \
  GOOGLE_WEB_CLIENT_ID=xxx
vercel --prod --prebuilt
```

The `vercel.json` in the project root handles:
- Build command: `flutter build web --release`
- Output directory: `build/web`
- SPA routing: all paths rewrite to `index.html`
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`
- Long cache for static assets (`flutter.js`, JS bundles)

### Step 5 — Custom Domain (Optional)

In **Vercel Dashboard → Domains**:
1. Add `admin.mahamevnawa.org.au`
2. Follow DNS instructions (add CNAME record pointing to `cname.vercel-dns.com`)
3. Vercel auto-provisions SSL

---

## 16. Environment Configuration

The app receives all sensitive configuration via Dart compile-time environment variables (never stored in code):

```bash
# How values are passed at build time:
flutter run \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGc... \
  --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
```

```dart
// How they are read in code (main.dart):
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL',
    defaultValue: 'https://your-project.supabase.co');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key');
```

### CI/CD Environment Variables

When building in GitHub Actions, Bitrise, or Codemagic, set these as pipeline secrets:

```yaml
# GitHub Actions example
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  GOOGLE_WEB_CLIENT_ID: ${{ secrets.GOOGLE_WEB_CLIENT_ID }}

steps:
  - run: |
      flutter build appbundle --release \
        --dart-define=SUPABASE_URL=$SUPABASE_URL \
        --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

### Variable Reference

| Variable | Where to Get | Used In |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API | All platforms |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API | All platforms |
| `GOOGLE_WEB_CLIENT_ID` | Google Cloud Console → Credentials | Web + Android |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase → Project Settings → Service Accounts | Supabase Edge Function secret only |

---

## 17. Common Issues & Solutions

### Flutter / Build

| Issue | Solution |
|-------|----------|
| `flutter: command not found` | Add to PATH: `export PATH="$PATH:$HOME/development/flutter/bin"` |
| `pub get` fails with version conflict | Run `flutter pub upgrade --major-versions` carefully; check changelog |
| `build_runner` conflicts | `flutter pub run build_runner build --delete-conflicting-outputs` |
| `firebase_options.dart` not found | Run `flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID` |
| `ArImaMadurai font` error | Font is served via `google_fonts` package — remove asset registration from `pubspec.yaml` |

### Supabase

| Issue | Solution |
|-------|----------|
| `RLS policy violation` | User is accessing data outside permitted scope — check `010_rls_policies.sql` is applied |
| `invalid JWT` | Anon key expired or wrong — verify key in Supabase Dashboard → API |
| `realtime not working` | Enable Replication for `messages` and `attendance_records` tables in Supabase Dashboard |
| `storage: permission denied` | Bucket RLS policies missing — add INSERT/SELECT policies in Storage → Policies |
| `webhook not firing` | Check webhook configuration in Database → Webhooks; verify service_role key in header |

### Authentication

| Issue | Solution |
|-------|----------|
| Google Sign-In fails on web | Verify redirect URI `https://YOUR_PROJECT.supabase.co/auth/v1/callback` in Google Console |
| Apple Sign-In not showing | Must be on physical iOS device; Simulator does not support Sign In with Apple |
| User stuck on `role-select` | Check `user_profiles` table — ensure row is created after registration |
| Admin cannot log in | Admin accounts are created manually via SQL — verify the row exists with `role = 'admin'` |

### Push Notifications

| Issue | Solution |
|-------|----------|
| Notifications not received on iOS | Verify APNs `.p8` key in Firebase; check Push Notifications capability in Xcode |
| Notifications not received on Android | Verify `google-services.json` is correct file; check FCM token saved in `user_profiles` |
| Edge Function not triggering | Check database webhook in Supabase → webhooks; verify announcements INSERT fires correctly |
| FCM quota exceeded | Firebase free tier allows 1M messages/month — more than sufficient for this use case |

---

*For requirements context refer to `SRS.md`. For deployment steps refer to `DEPLOY.md`.*
