# Dhamma School Student Management System — Build Prompt

## Mandatory Build Behaviour (Read First, Apply Always)

- **No questions during the build** — make decisions, leave `// TODO:` comments, keep going
- **No pre-build summaries** — start building immediately, do not outline and wait for approval
- **No file-creation confirmations** — create all files without asking permission
- **Follow the build sequence** — work through Section 13 in strict order, completing each step before moving to the next
- **Placeholder images** — use styled dark `Container` widgets with an icon overlay; never ask for real photos
- **Placeholder prices / external IDs** — use `''` or `0` values; leave a `// TODO:` with what is needed
- **Only speak when done** — the final report must include: files created, all TODOs, preview/run instructions, and the pre-launch checklist
- **Commit style** — after each numbered build step is fully complete, note it in your final report; do not commit mid-step

---

## Project Overview

**App:** Dhamma School Student Management System
**Organisation:** Mahamevnawa Buddhist Monastery, Melbourne (Southbank)
**Platforms:** Android App + iOS App + Web Admin Portal (single Flutter codebase)
**Full requirements:** See `SRS.md` in this repo

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (all platforms) | Flutter 3.x (Dart) |
| State Management | Riverpod 2.x |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Push Notifications | Firebase Cloud Messaging (FCM) via `firebase_messaging` |
| File Storage | Supabase Storage (private buckets, signed URLs) |
| Web Hosting | Vercel (Flutter Web build output) |
| Navigation | `go_router` |
| Forms | `reactive_forms` |
| Image Picking | `image_picker` + `image_cropper` |
| Calendar UI | `table_calendar` |
| Charts (Admin) | `fl_chart` |
| Localisation | `flutter_localizations` + ARB files (English + Sinhala) |

---

## Design System

Apply these tokens globally via `ThemeData` and a `AppTheme` class.

### Colors

```dart
// lib/core/theme/app_colors.dart
static const primaryRed     = Color(0xFFF34E3A);   // Primary accent
static const darkBrown      = Color(0xFF614141);   // Headings, body text
static const creamYellow    = Color(0xFFFBF4C2);   // Background, card fill
static const white          = Color(0xFFFFFFFF);   // Surface
static const darkNavy       = Color(0xFF052254);   // App bar, overlays
static const goldAmber      = Color(0xFFF7B656);   // Footer, links, highlights
static const successGreen   = Color(0xFF4CAF87);   // Approved status
static const errorRed       = Color(0xFFC0392B);   // Rejected / error
static const pendingAmber   = Color(0xFFF39C12);   // Pending status
```

### Typography

```dart
// Google Fonts: DM Serif Display (headings), Work Sans (body), Arima Madurai (nav/labels)
// Sinhala: load UN Malithi from assets/fonts/
displayLarge  → DM Serif Display, 28sp
headlineMedium→ DM Serif Display, 22sp
bodyLarge     → Work Sans, 16sp, weight 400
bodyMedium    → Work Sans, 14sp, weight 400
labelLarge    → Arima Madurai, 14sp, weight 500  // nav labels, buttons
```

### Component Rules

- **Primary Button:** `FilledButton`, background `primaryRed`, white text, radius 8
- **Secondary Button:** `OutlinedButton`, border `darkBrown`, transparent fill
- **Cards:** white background, border `creamYellow` 1px, radius 12, elevation 2
- **AppBar:** `darkNavy` background, white title text, DM Serif Display
- **BottomNavBar (mobile):** white background, selected icon `primaryRed`
- **Status Badge:** `Container` with rounded corners — Pending amber, Approved green, Rejected red, white text
- **Splash screen:** monastery lotus SVG centred on `darkNavy` background

---

## Repository Structure

```
dhamma_school_app/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_colors.dart
│   │   │   ├── app_text_styles.dart
│   │   │   └── app_theme.dart
│   │   ├── router/
│   │   │   └── app_router.dart
│   │   ├── constants/
│   │   │   └── app_constants.dart
│   │   └── utils/
│   │       ├── date_utils.dart
│   │       └── validators.dart
│   ├── services/
│   │   ├── supabase_service.dart
│   │   ├── auth_service.dart
│   │   ├── notification_service.dart
│   │   └── storage_service.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── student_model.dart
│   │   ├── teacher_model.dart
│   │   ├── class_model.dart
│   │   ├── attendance_model.dart
│   │   ├── announcement_model.dart
│   │   ├── event_model.dart
│   │   └── message_model.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── student_provider.dart
│   │   ├── teacher_provider.dart
│   │   ├── class_provider.dart
│   │   ├── attendance_provider.dart
│   │   ├── announcement_provider.dart
│   │   ├── event_provider.dart
│   │   └── message_provider.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── role_selection_screen.dart
│   │   ├── parent/
│   │   │   ├── parent_home_screen.dart
│   │   │   ├── register_student_screen.dart
│   │   │   ├── student_status_screen.dart
│   │   │   ├── calendar_screen.dart
│   │   │   ├── announcements_screen.dart
│   │   │   └── parent_profile_screen.dart
│   │   ├── teacher/
│   │   │   ├── teacher_home_screen.dart
│   │   │   ├── attendance_screen.dart
│   │   │   ├── class_roster_screen.dart
│   │   │   ├── student_detail_screen.dart
│   │   │   ├── send_announcement_screen.dart
│   │   │   └── teacher_profile_screen.dart
│   │   ├── admin/
│   │   │   ├── admin_dashboard_screen.dart
│   │   │   ├── pending_registrations_screen.dart
│   │   │   ├── student_management_screen.dart
│   │   │   ├── teacher_management_screen.dart
│   │   │   ├── class_management_screen.dart
│   │   │   ├── event_management_screen.dart
│   │   │   ├── reports_screen.dart
│   │   │   └── announcement_compose_screen.dart
│   │   └── shared/
│   │       ├── splash_screen.dart
│   │       ├── notification_centre_screen.dart
│   │       └── message_thread_screen.dart
│   └── widgets/
│       ├── app_bar_widget.dart
│       ├── status_badge.dart
│       ├── student_card.dart
│       ├── attendance_tile.dart
│       ├── event_card.dart
│       ├── announcement_card.dart
│       ├── photo_placeholder.dart
│       └── loading_overlay.dart
├── supabase/
│   └── migrations/
│       ├── 001_create_schools.sql
│       ├── 002_create_users.sql
│       ├── 003_create_students.sql
│       ├── 004_create_classes.sql
│       ├── 005_create_attendance.sql
│       ├── 006_create_announcements.dart
│       ├── 007_create_events.sql
│       ├── 008_create_messages.sql
│       ├── 009_create_notifications.sql
│       └── 010_rls_policies.sql
├── assets/
│   ├── fonts/
│   ├── images/
│   │   └── lotus_splash.svg
│   └── l10n/
│       ├── app_en.arb
│       └── app_si.arb
├── web/
│   └── index.html
├── android/
├── ios/
├── pubspec.yaml
├── .env.example
└── README.md
```

---

## Section 13 — Build Sequence

Work through each step completely before starting the next. All files go in the structure above.

---

### Step 1 — Project Scaffolding & Dependencies

1. Create the Flutter project targeting Android, iOS, and Web:
   ```
   flutter create --platforms android,ios,web dhamma_school_app
   ```
2. Replace `pubspec.yaml` with full dependencies:
   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     flutter_localizations:
       sdk: flutter

     # Backend
     supabase_flutter: ^2.5.0

     # Auth
     google_sign_in: ^6.2.1
     sign_in_with_apple: ^6.1.0

     # State
     flutter_riverpod: ^2.5.1
     riverpod_annotation: ^2.3.5

     # Navigation
     go_router: ^13.2.0

     # Forms
     reactive_forms: ^17.0.1

     # Firebase
     firebase_core: ^3.3.0
     firebase_messaging: ^15.1.0

     # UI
     google_fonts: ^6.2.1
     table_calendar: ^3.1.2
     fl_chart: ^0.68.0
     cached_network_image: ^3.3.1
     image_picker: ^1.1.2
     image_cropper: ^7.1.0
     intl: ^0.19.0
     shimmer: ^3.0.0
     badges: ^3.1.2

     # Utils
     uuid: ^4.4.0
     path: ^1.9.0
     share_plus: ^9.0.0

   dev_dependencies:
     build_runner: ^2.4.11
     riverpod_generator: ^2.4.3
     flutter_lints: ^4.0.0
   ```
3. Create `.env.example`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
   ```
4. Create `assets/` directory structure and register fonts + assets in `pubspec.yaml`

---

### Step 2 — Supabase Database Migrations

Create all SQL files in `supabase/migrations/`. Each file must be idempotent (`CREATE TABLE IF NOT EXISTS`).

**001_create_schools.sql**
```sql
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schools (name, location)
VALUES ('Mahamevnawa Dhamma School – Southbank', 'Melbourne, VIC')
ON CONFLICT DO NOTHING;
```

**002_create_users.sql**
```sql
CREATE TYPE user_role AS ENUM ('parent', 'teacher', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  full_name TEXT,
  preferred_name TEXT,
  phone TEXT,
  address TEXT,
  role user_role NOT NULL DEFAULT 'parent',
  status user_status NOT NULL DEFAULT 'pending',
  profile_photo_url TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**003_create_students.sql**
```sql
CREATE TYPE student_status AS ENUM ('pending','under_review','approved','rejected','active','inactive','dropped');

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  dob DATE NOT NULL,
  gender TEXT,
  has_allergies BOOLEAN NOT NULL DEFAULT FALSE,
  allergy_notes TEXT,
  photo_url TEXT,
  photo_publish_consent BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID REFERENCES classes(id),
  status student_status NOT NULL DEFAULT 'pending',
  status_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- age is computed in application layer from dob
```

**004_create_classes.sql**
```sql
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  grade_level TEXT,
  teacher_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**005_create_attendance.sql**
```sql
CREATE TYPE attendance_status AS ENUM ('present','checked_in','checked_out','absent');

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  student_id UUID NOT NULL REFERENCES students(id),
  teacher_id UUID NOT NULL REFERENCES user_profiles(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  session_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  status attendance_status NOT NULL DEFAULT 'absent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session_date)
);
```

**006_create_announcements.sql**
```sql
CREATE TYPE announcement_type AS ENUM ('school','class','emergency','event_reminder');

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  author_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'school',
  target_class_id UUID REFERENCES classes(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**007_create_events.sql**
```sql
CREATE TYPE event_type AS ENUM ('poya','sermon','exam','holiday','special');

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL DEFAULT 'special',
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  location TEXT,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**008_create_messages.sql**
```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  recipient_id UUID NOT NULL REFERENCES user_profiles(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**009_create_notifications.sql**
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**010_rls_policies.sql**

Apply Supabase Row-Level Security to every table:
- `user_profiles`: users can read/update their own row; admin can read all
- `students`: parent sees own children; teacher sees students in their class; admin sees all
- `classes`: teacher sees their own class; admin sees all
- `attendance_records`: teacher can insert/update for their class; admin can update all; parent can read their child's records
- `announcements`: all authenticated users can read; only teacher (own class) and admin can insert
- `events`: all authenticated users can read; only admin can insert/update/delete
- `messages`: sender and recipient can read; only sender can insert; parent cannot send to other parents (enforce via trigger or check constraint on role)
- `notifications`: users can only read their own

---

### Step 3 — Core Infrastructure

**3.1 `lib/main.dart`**
- Initialise Supabase with env-loaded URL and anon key
- Initialise Firebase
- Wrap app in `ProviderScope`
- Set `MaterialApp.router` with `AppRouter`
- Apply `AppTheme.light()` globally

**3.2 `lib/core/theme/app_colors.dart`**
Define all color constants from the Design System section above.

**3.3 `lib/core/theme/app_text_styles.dart`**
Define `TextStyle` constants using Google Fonts package (DM Serif Display, Work Sans, Arima Madurai).

**3.4 `lib/core/theme/app_theme.dart`**
Build `ThemeData` using the colors and text styles. Override `AppBarTheme`, `ElevatedButtonTheme`, `OutlinedButtonTheme`, `CardTheme`, `BottomNavigationBarTheme`, `InputDecorationTheme`.

**3.5 `lib/core/router/app_router.dart`**
Define all routes using `go_router` with redirect guards:
```
/splash
/login
/role-select
/parent/home
/parent/register-student
/parent/student/:id/status
/parent/calendar
/parent/announcements
/parent/messages
/parent/profile
/teacher/home
/teacher/attendance
/teacher/class
/teacher/student/:id
/teacher/announce
/teacher/profile
/admin/dashboard
/admin/registrations
/admin/students
/admin/teachers
/admin/classes
/admin/events
/admin/reports
/admin/announce
/notifications
```
Guard: unauthenticated users redirect to `/login`; authenticated users redirect to their role home.

**3.6 `lib/services/supabase_service.dart`**
Singleton wrapper around `Supabase.instance.client`. Expose typed query helpers.

**3.7 `lib/services/auth_service.dart`**
- `signInWithGoogle()` — uses `google_sign_in` package + Supabase OAuth
- `signInWithApple()` — uses `sign_in_with_apple` package + Supabase OAuth
- `signOut()`
- `currentUser` getter
- `getUserProfile()` — fetches `user_profiles` row for current user
- `upsertUserProfile(...)` — creates/updates profile row

**3.8 `lib/services/notification_service.dart`**
- Initialise FCM, request permission
- Save FCM token to `user_profiles.fcm_token` on login
- `onMessageReceived` stream
- `sendLocalNotification(title, body)` for foreground messages

**3.9 `lib/services/storage_service.dart`**
- `uploadStudentPhoto(file)` → uploads to `student-photos` private bucket, returns signed URL
- `uploadProfilePhoto(file)` → uploads to `profile-photos` bucket
- `getSignedUrl(path)` → returns 1-hour signed URL

---

### Step 4 — Data Models

Create a Dart model class for each entity. Each model must have:
- `fromJson(Map<String, dynamic>)` factory
- `toJson()` method
- `copyWith(...)` method

Models: `UserModel`, `StudentModel`, `TeacherModel`, `ClassModel`, `AttendanceModel`, `AnnouncementModel`, `EventModel`, `MessageModel`, `NotificationModel`

Key computed field — add to `StudentModel`:
```dart
int get age {
  final today = DateTime.now();
  int age = today.year - dob.year;
  if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) age--;
  return age;
}
```

---

### Step 5 — Riverpod Providers

Create async notifier providers for each domain:

**`auth_provider.dart`**
- `authStateProvider` — streams `Supabase.auth.onAuthStateChange`
- `userProfileProvider` — fetches current user's profile
- `currentRoleProvider` — derived from `userProfileProvider`

**`student_provider.dart`**
- `studentsProvider(schoolId)` — all students (admin)
- `myStudentsProvider(parentId)` — parent's own children
- `classStudentsProvider(classId)` — teacher's class students
- `pendingStudentsProvider(schoolId)` — for admin approval queue
- `studentNotifier` — handles create, update, approve, reject

**`attendance_provider.dart`**
- `todayAttendanceProvider(classId)` — current session records
- `attendanceNotifier` — handles check-in, check-out, mark absent
- Supports optimistic updates for snappy UX

**`announcement_provider.dart`**
- `announcementsProvider(schoolId)` — all announcements
- `classAnnouncementsProvider(classId)`
- `announcementNotifier` — create, delete

**`event_provider.dart`**
- `eventsProvider(schoolId)` — all events ordered by start_datetime
- `upcomingEventsProvider(schoolId)` — events from today onwards
- `eventNotifier` — CRUD (admin only)

**`message_provider.dart`**
- `conversationsProvider(userId)` — grouped message threads
- `threadProvider(userId, recipientId)` — messages in a thread
- `messageNotifier` — send message, mark read

---

### Step 6 — Authentication Screens

**`splash_screen.dart`**
- `darkNavy` full-screen background
- Centred lotus SVG (use a `Container` with icon if SVG not ready: `// TODO: replace with lotus_splash.svg`)
- After 2 seconds, route based on auth state: authenticated → role home; unauthenticated → `/login`

**`login_screen.dart`**
- `darkNavy` top half with monastery name in `DM Serif Display`, white
- Cream bottom sheet with:
  - "Sign in with Google" button (Google branding colours)
  - "Sign in with Apple" button (black, white text)
  - `// TODO: Add Facebook login button when FB app credentials are available`
  - Small Sinhala subtitle below the title

**`role_selection_screen.dart`**
- Shown only on first login (no profile row exists yet)
- Two large tappable cards: "I am a Parent" / "I am a Teacher"
- On selection, create `user_profiles` row with chosen role and status `pending`
- Teachers → show registration form capturing: name, DOB, address, phone, optional children's details
- Parents → show registration form capturing: name, phone, address
- Submit → navigate to role home with a "pending approval" banner for teachers

---

### Step 7 — Parent Features

**`parent_home_screen.dart`**
- Bottom nav: Home, Calendar, Announcements, Messages, Profile
- Home tab: greeting card, list of registered children with status badges, quick "Register Child" FAB
- If no children registered: empty state with illustration and "Register your child" CTA button

**`register_student_screen.dart`**
- Multi-step form (3 steps with a progress indicator):
  - **Step 1 – Child Details:** First Name, Last Name, Preferred Name, DOB (date picker), Gender (dropdown, optional)
  - **Step 2 – Health & Consent:** "Does your child have food allergies?" toggle → if yes, show free-text field; Photo Publish Approval checkbox with explanation text
  - **Step 3 – Photo Upload:** `image_picker` + `image_cropper` (1:1 square crop); show `PhotoPlaceholderWidget` until image selected
- Validate all required fields before allowing step advancement
- On submit: upload photo to Supabase Storage, insert student record with status `pending`, show success screen
- Success screen: confirmation message, explain the approval process, button to return to home

**`student_status_screen.dart`**
- Shows individual child's registration details and current status badge
- If rejected: show rejection reason and "Edit & Resubmit" button
- If approved: show class assignment and attendance summary (last 4 sessions)

**`calendar_screen.dart`**
- `table_calendar` widget styled with `primaryRed` selected day, `goldAmber` event markers
- Events listed below the calendar for the selected day
- Each event card shows: title, time, event type chip, location

**`announcements_screen.dart`**
- Chronological list of announcements
- Emergency notices shown at top with `errorRed` left border
- Each card: author name, time ago, title, truncated body, tap to expand

---

### Step 8 — Teacher Features

**`teacher_home_screen.dart`**
- Bottom nav: Home, Attendance, Class, Announce, Profile
- Home tab: today's class info card, pending registration review count, recent announcements
- If not yet assigned to a class: show "Awaiting class assignment" placeholder card

**`attendance_screen.dart`**
- Session date header (today's date)
- Class name subheader
- List of students sorted alphabetically with photo (or `PhotoPlaceholderWidget`)
- Each student tile: photo, name, age, current status badge
- Swipe right → Check In; swipe left → Mark Absent; tapping an already checked-in student → Check Out
- Also provide explicit "Check In" / "Check Out" / "Absent" action buttons on the tile for accessibility
- Real-time update via Riverpod state; optimistic UI
- Summary bar at top: Present count / Total count

**`class_roster_screen.dart`**
- Full student list for assigned class
- Search bar to filter by name
- Tap student → `student_detail_screen.dart`

**`student_detail_screen.dart`**
- Student photo (signed URL or `PhotoPlaceholderWidget`)
- Full details: name, DOB, age, gender, allergies
- Parent contact section: name, phone, email (tap phone to dial)
- Attendance history: last 8 sessions as coloured chips
- "Message Parent" button → opens `message_thread_screen.dart`

**`send_announcement_screen.dart`**
- Title field + body field (multiline)
- Type selector: Class Announcement (pre-selected, teacher cannot change scope)
- Preview card showing how it will look
- Send button → inserts to `announcements`, triggers FCM via Supabase Edge Function

---

### Step 9 — Admin Web Portal Features

The admin features are web-first. Use a `Scaffold` with a persistent `NavigationRail` (left sidebar) on wide screens and a `Drawer` on narrow screens.

**`admin_dashboard_screen.dart`**
- Top row summary cards (4 cards):
  - Total Active Students (with trend arrow)
  - Total Active Teachers
  - Pending Registrations (tappable, links to registration queue)
  - Today's Attendance Rate (%)
- Attendance trend chart: `fl_chart` `LineChart` — last 8 Sundays, attendance % per session
- Per-class attendance bar chart: `BarChart` — one bar per class, current week
- Recent announcements list (last 5)

**`pending_registrations_screen.dart`**
- Tab bar: "Students" | "Teachers"
- Each pending registration shown as an expanded card:
  - Student: photo, name, DOB, age, parent details, allergy info, photo consent
  - Teacher: name, DOB, contact details
- Actions: "Approve" (green) / "Reject" (red with required reason text field)
- On approval of student: prompt admin to assign to a class immediately

**`student_management_screen.dart`**
- Searchable, filterable data table of all students
- Filters: class, status, name search
- Per-row actions: View, Edit Status (Active / Inactive / Dropped)
- Bulk export to CSV

**`teacher_management_screen.dart`**
- Table of all teachers with status
- Actions: View, Assign to Class, Deactivate

**`class_management_screen.dart`**
- List of classes with teacher and student count
- "Create Class" dialog: name, grade level, assign teacher dropdown
- "Manage Students" per class: drag-and-drop student assignment
  `// TODO: Replace drag-and-drop with checkbox assignment if drag-and-drop proves complex on web`

**`event_management_screen.dart`**
- Month-view calendar on the left, event list on the right
- "Add Event" FAB → dialog form: title, description, event type dropdown, start/end datetime, location
- Edit and delete inline on event list

**`reports_screen.dart`**
- Report selector: Daily / Weekly / Monthly
- Date range picker
- Class filter
- Results in a scrollable data table: student name, sessions attended, sessions total, attendance %
- Export to CSV button

**`announcement_compose_screen.dart`**
- Rich text title + body
- Scope selector: Entire School / Specific Class / Emergency
- Specific class dropdown (if class selected)
- Preview panel
- "Publish & Notify" button

---

### Step 10 — Shared Screens & Widgets

**`notification_centre_screen.dart`**
- Chronological list of all user notifications
- Unread items have `creamYellow` background
- Mark all as read button
- Tap notification → navigate to relevant screen (announcement, event, registration status)

**`message_thread_screen.dart`**
- Chat-style UI (bubbles)
- Sender's messages on the right (`primaryRed` bubble, white text)
- Recipient's messages on the left (`creamYellow` bubble, `darkBrown` text)
- Message input field + send icon button at the bottom
- Real-time via Supabase Realtime subscription on `messages` table

**`photo_placeholder.dart`**
```dart
// Styled dark Container used when no real photo is available
// Shows a person icon in darkBrown on creamYellow background
// Size configurable via constructor
```

**`status_badge.dart`**
- `Container` with colour-coded background and rounded corners
- Maps `StudentStatus` enum to label and colour

**`student_card.dart`**
- Reusable card with photo, name, age, class, status badge

**`attendance_tile.dart`**
- Reusable list tile for attendance screen
- Swipeable with `Dismissible`

**`loading_overlay.dart`**
- Full-screen semi-transparent overlay with centred `CircularProgressIndicator` in `primaryRed`

---

### Step 11 — Push Notifications Integration

1. In `notification_service.dart`:
   - On app launch, call `FirebaseMessaging.instance.requestPermission()`
   - Retrieve FCM token and save to `user_profiles.fcm_token`
   - Handle foreground messages with `flutter_local_notifications`
   - Handle background/terminated message tap → navigate to correct screen using `go_router`

2. Create Supabase Edge Function `send-notification/index.ts`:
   ```typescript
   // Triggered by database webhook on INSERT to announcements table
   // Fetches target user FCM tokens from user_profiles
   // Sends FCM multicast message via Firebase Admin SDK
   // TODO: Add FIREBASE_SERVICE_ACCOUNT_JSON to Supabase secrets
   ```

3. Register the Edge Function webhook in Supabase dashboard:
   - Table: `announcements`
   - Event: `INSERT`
   - URL: `{SUPABASE_URL}/functions/v1/send-notification`
   - `// TODO: Configure webhook in Supabase dashboard after deployment`

---

### Step 12 — Localisation

1. Create `assets/l10n/app_en.arb` with keys for all user-facing strings
2. Create `assets/l10n/app_si.arb` with Sinhala translations
   - `// TODO: Have a native Sinhala speaker review all Sinhala translations`
3. Register `flutter_localizations` delegates in `main.dart`
4. Wrap all user-visible strings with `AppLocalizations.of(context)!.keyName`
5. Add a language toggle in Profile screen (English / සිංහල)

---

### Step 13 — Web Build & Deployment

1. Ensure `web/index.html` has correct `<meta>` tags for SEO and mobile:
   ```html
   <meta name="description" content="Mahamevnawa Dhamma School – Student Management">
   <meta name="theme-color" content="#052254">
   <link rel="manifest" href="manifest.json">
   ```

2. Create `vercel.json` at project root:
   ```json
   {
     "buildCommand": "flutter build web --release",
     "outputDirectory": "build/web",
     "framework": null,
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

3. Create `Makefile` with convenience targets:
   ```makefile
   build-web:
       flutter build web --release --dart-define=SUPABASE_URL=$(SUPABASE_URL) --dart-define=SUPABASE_ANON_KEY=$(SUPABASE_ANON_KEY)

   build-android:
       flutter build apk --release

   build-ios:
       flutter build ios --release --no-codesign
   ```

---

## Final Report (Output When Build is Complete)

When all 13 steps are done, output a single report with these sections:

### Files Created
List every file created with a one-line description.

### TODOs
List every `// TODO:` comment left in the code with its file path and line number.

### How to Run

```
# 1. Copy env file
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_WEB_CLIENT_ID

# 2. Run Supabase migrations
supabase db push

# 3. Run on Android
flutter run -d android

# 4. Run on iOS
flutter run -d ios

# 5. Run web
flutter run -d chrome

# 6. Build web for Vercel
make build-web
```

### Pre-Launch Checklist

- [ ] Supabase project created and migrations applied
- [ ] Supabase RLS policies verified (test each role in Supabase SQL editor)
- [ ] Google OAuth credentials configured in Supabase Auth dashboard
- [ ] Apple Sign-In configured (requires Apple Developer account + service ID)
- [ ] Firebase project created; `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) added
- [ ] FCM Edge Function deployed to Supabase with `FIREBASE_SERVICE_ACCOUNT_JSON` secret set
- [ ] Default admin account created manually in Supabase Auth + `user_profiles` row inserted with `role = 'admin'`
- [ ] Default school record confirmed in `schools` table
- [ ] Sinhala translations reviewed by native speaker
- [ ] Student photo Storage bucket set to private; RLS on storage verified
- [ ] Flutter build signing configured for Android (keystore) and iOS (provisioning profile)
- [ ] App submitted to Google Play Store (internal testing track first)
- [ ] App submitted to Apple App Store (TestFlight first)
- [ ] Vercel project linked to repo; environment variables set in Vercel dashboard
- [ ] Tested end-to-end: parent registers → teacher reviews → admin approves → teacher takes attendance → parent receives notification
- [ ] Load tested with 500 concurrent users (use k6 or similar)
- [ ] WCAG 2.1 AA contrast check passed on all screens
