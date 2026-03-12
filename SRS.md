# Software Requirements Specification (SRS)
## Dhamma School Student Management System

**Version:** 1.0
**Date:** 2026-03-12
**Organization:** Mahamevnawa Buddhist Monastery – Melbourne (Dhamma School)
**Prepared by:** Development Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [User Roles & Characteristics](#3-user-roles--characteristics)
4. [System Architecture & Platforms](#4-system-architecture--platforms)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [UI/UX & Design System](#7-uiux--design-system)
8. [Data Model](#8-data-model)
9. [Technology Stack](#9-technology-stack)
10. [Release Phases](#10-release-phases)
11. [Constraints & Assumptions](#11-constraints--assumptions)
12. [Success Criteria](#12-success-criteria)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification describes the functional and non-functional requirements for the **Dhamma School Student Management System** — a cross-platform digital solution to manage school operations for the Mahamevnawa Dhamma School, Melbourne (Southbank).

### 1.2 Scope

The system will replace manual spreadsheet-based processes with a unified digital platform covering:

- Student and teacher registration with approval workflows
- Attendance check-in/check-out
- Parent-teacher communication
- Event calendar management
- Administrative reporting and dashboards

The system is designed to scale to multiple Dhamma Schools (currently Southbank; planned: Mount Evelyn, West).

### 1.3 Definitions & Acronyms

| Term | Meaning |
|------|---------|
| RBAC | Role-Based Access Control |
| MVP | Minimum Viable Product |
| FCM | Firebase Cloud Messaging |
| SSO | Single Sign-On / Federated Social Login |
| Swamin Wahanse | Resident monk / spiritual overseer |
| Poya | Full moon day (Buddhist observance day) |
| SRS | Software Requirements Specification |

### 1.4 References

- Dhamma School App – Product Requirements Document (PRD), v1.0
- mahamevnawa.org.au – Branding and visual identity reference

---

## 2. Overall Description

### 2.1 Product Perspective

The system is a new standalone multi-platform product. It consists of:

- **Web Portal** – Admin-facing dashboard for Principal / Swamin Wahanse
- **Android Mobile App** – For Parents and Teachers
- **iOS Mobile App** – For Parents and Teachers

All platforms share the same backend (Supabase / PostgreSQL) and push notification service (Firebase).

### 2.2 Product Functions Summary

| Function | Parent | Teacher | Principal/Admin |
|----------|--------|---------|-----------------|
| Social Login | Yes | Yes | No (manual) |
| Register Self | Yes | Yes | N/A |
| Register Child (student) | Yes | No | No |
| Approve Registrations | No | Review only | Yes (final) |
| Attendance Check-in/out | No | Yes | View only |
| View Student Details | Own child only | Assigned class | All |
| Publish Announcements | No | Yes (class) | Yes (school-wide) |
| View Calendar | Yes (read-only) | Yes (read-only) | Yes (edit) |
| Create Calendar Events | No | No | Yes |
| View Reports | No | No | Yes |
| Send Messages | No | To parents | To all |
| Manage Classes | No | No | Yes |

### 2.3 Estimated User Base

| Role | Count |
|------|-------|
| Students | ~150 |
| Parents | 150–300 |
| Teachers | ~20 |
| Admin / Principal | 2 |
| **Total** | **~500** |

---

## 3. User Roles & Characteristics

### 3.1 Parent

- Primary users of the mobile app
- Technically varied; many may be non-native English speakers
- Registers themselves and their child(ren)
- Receives push notifications and in-app messages
- Views event calendar and announcements
- **Cannot** communicate with other parents

### 3.2 Teacher

- Uses the mobile app primarily for attendance management
- Views their assigned class roster and student details
- Sends class-level announcements to parents
- Reviews incoming student registrations for their class
- Marks student check-in and check-out during sessions

### 3.3 Principal / Swamin Wahanse (Admin)

- Accesses the system via the web portal
- Has full visibility over all students, teachers, and classes
- Approves or rejects teacher and student registrations
- Manages class assignments
- Publishes school-wide announcements and events
- Views administrative reports and attendance statistics
- Account created manually by system administrators (no social login)

---

## 4. System Architecture & Platforms

### 4.1 Platform Summary

| Platform | Target Users | Primary Interface |
|----------|-------------|-------------------|
| Web Portal | Principal, Admin | Desktop browser (responsive) |
| Android App | Parents, Teachers | Native Android (FlutterFlow) |
| iOS App | Parents, Teachers | Native iOS (FlutterFlow) |

### 4.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│   Web Portal (Vercel)  │  Android App  │  iOS App        │
│   (FlutterFlow/Web)    │ (FlutterFlow) │ (FlutterFlow)   │
└────────────────────────┴───────────────┴─────────────────┘
                          │
                  REST / Realtime
                          │
┌─────────────────────────────────────────────────────────┐
│                   Backend Layer                          │
│          Supabase (Auth + API + Storage)                 │
│          PostgreSQL (Database)                           │
│          Firebase (Push Notifications)                   │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Multi-Tenancy Consideration

The system must be designed with multi-school support in mind from the outset. Each Dhamma School (Southbank, Mount Evelyn, West) should operate as a separate tenant with isolated data. A `school_id` foreign key must be present in all primary data entities.

---

## 5. Functional Requirements

### 5.1 Authentication

**Priority: MUST HAVE**

#### 5.1.1 Social Federated Login

| Requirement ID | Description |
|---------------|-------------|
| AUTH-01 | Parents and teachers SHALL authenticate using Google Sign-In (OAuth 2.0) |
| AUTH-02 | Parents and teachers SHALL authenticate using Apple ID Sign-In |
| AUTH-03 | Facebook login SHOULD be supported as an optional provider |
| AUTH-04 | Upon first login, the system SHALL prompt the user to complete their profile and select their role (Parent or Teacher) |
| AUTH-05 | Principal/Admin accounts SHALL be created manually by system administrators via the Supabase dashboard |
| AUTH-06 | All authenticated sessions SHALL use JWT tokens with appropriate expiry |
| AUTH-07 | Users SHALL be able to log out from any device |

#### 5.1.2 Role Assignment

| Requirement ID | Description |
|---------------|-------------|
| AUTH-08 | After social login, new users SHALL be assigned a pending role status until registration is approved |
| AUTH-09 | Role-based access control SHALL restrict all API endpoints and UI views by role |

---

### 5.2 Parent Registration

**Priority: MUST HAVE**

| Requirement ID | Description |
|---------------|-------------|
| PREG-01 | Parents SHALL be able to register an account via social login |
| PREG-02 | Parent profile SHALL capture: First Name, Last Name, Phone Number, Email (from SSO), Address |
| PREG-03 | Parents SHALL be able to link multiple children to their account |
| PREG-04 | Parent accounts SHALL be self-activated upon social login completion |

---

### 5.3 Student Registration

**Priority: MUST HAVE**

#### 5.3.1 Registration Flow

1. Parent logs in via social login
2. Parent navigates to "Register Child"
3. Parent completes the student registration form
4. Parent uploads the student's photograph
5. Parent submits the form
6. System sets registration status to **Pending**
7. Assigned class teacher reviews the submission
8. Principal performs final approval or rejection
9. Parent is notified of the outcome via push notification and in-app message

#### 5.3.2 Student Data Fields

| Field | Required | Notes |
|-------|----------|-------|
| First Name | Yes | |
| Last Name | Yes | |
| Preferred Name | Optional | |
| Date of Birth | Yes | |
| Age | Auto-calculated | Derived from DOB |
| Gender | Optional | |
| Food Allergy Status | Yes | Free text + checkbox for no allergies |
| Photo Publish Approval | Yes | Boolean consent from parent |
| Student Photo | Yes | Image upload; stored in Supabase Storage |
| Parent Name | Yes | Auto-filled from parent profile |
| Parent Phone Number | Yes | Auto-filled from parent profile |
| Parent Email | Yes | Auto-filled from parent profile |
| Address | Yes | |

#### 5.3.3 Approval Workflow

| Step | Responsible Party | Action |
|------|------------------|--------|
| 1 – Teacher Review | Class Teacher | Review and recommend approval/rejection |
| 2 – Final Approval | Principal | Approve or Reject with optional note |

**Registration Statuses:** `Pending` → `Under Review` → `Approved` / `Rejected`

| Requirement ID | Description |
|---------------|-------------|
| SREG-01 | System SHALL notify the parent when registration status changes |
| SREG-02 | Rejected registrations SHALL include a reason visible to the parent |
| SREG-03 | Parents SHALL be able to edit and resubmit a rejected registration |
| SREG-04 | System SHALL prevent duplicate student registrations for the same child |

---

### 5.4 Teacher Registration

**Priority: MUST HAVE**

#### 5.4.1 Teacher Data Fields

| Field | Required | Notes |
|-------|----------|-------|
| First Name | Yes | |
| Last Name | Yes | |
| Preferred Name | Optional | |
| Date of Birth | Yes | |
| Age | Auto-calculated | |
| Address | Yes | |
| Phone Number | Yes | |
| Email | Yes | From SSO |
| Children's Details | Optional | For teachers who are also parents |

| Requirement ID | Description |
|---------------|-------------|
| TREG-01 | Teacher registration SHALL require Principal approval before the account is activated |
| TREG-02 | Teacher SHALL receive push notification upon approval or rejection |
| TREG-03 | Approved teachers SHALL be assigned to a class by the Principal before gaining class access |

---

### 5.5 Attendance Management

**Priority: MUST HAVE**

#### 5.5.1 Attendance Flow (per session)

1. Teacher opens the mobile app on the session day
2. Teacher views their assigned class student list
3. Teacher taps a student to mark **Check-in** (arrival)
4. At end of session, teacher marks **Check-out** (departure)
5. Records are timestamped and saved in real-time

#### 5.5.2 Data Captured per Record

| Field | Type | Notes |
|-------|------|-------|
| Student ID | UUID | FK to students table |
| Teacher ID | UUID | FK to teachers table |
| Class ID | UUID | FK to classes table |
| Date | Date | Session date |
| Check-in Time | Timestamp | Nullable |
| Check-out Time | Timestamp | Nullable |
| Attendance Status | Enum | See below |

**Attendance Statuses:** `Present` | `Checked In` | `Checked Out` | `Absent`

| Requirement ID | Description |
|---------------|-------------|
| ATT-01 | Teachers SHALL only see students in their assigned class |
| ATT-02 | Check-in SHALL be available from session start time |
| ATT-03 | Check-out SHALL only be available after check-in has been recorded |
| ATT-04 | Teachers SHALL be able to mark a student as absent |
| ATT-05 | Attendance records SHALL be immutable once the session is closed (editable only by Principal) |
| ATT-06 | Phase 2: QR code scanning SHALL be supported for faster check-in |

---

### 5.6 Class Management

**Priority: MUST HAVE**

| Requirement ID | Description |
|---------------|-------------|
| CLS-01 | Principal SHALL be able to create, edit, and delete classes |
| CLS-02 | Principal SHALL assign exactly one teacher per class |
| CLS-03 | Principal SHALL assign students to classes based on age group |
| CLS-04 | Teachers SHALL view only their assigned class roster |
| CLS-05 | Teachers SHALL view individual student profiles within their class |
| CLS-06 | Student profiles visible to teachers SHALL include: name, photo, DOB, food allergies, parent contact |

---

### 5.7 Notifications & Announcements

**Priority: MUST HAVE**

#### 5.7.1 Announcement Types

| Type | Created By | Audience |
|------|-----------|---------|
| School-wide Announcement | Principal | All parents and teachers |
| Class Announcement | Teacher or Principal | Parents of students in that class |
| Emergency Notice | Principal | All users |
| Event Reminder | Principal | All parents |

| Requirement ID | Description |
|---------------|-------------|
| NOT-01 | Announcements SHALL trigger a push notification via Firebase FCM |
| NOT-02 | Announcements SHALL appear in an in-app notification/message centre |
| NOT-03 | Push notifications SHALL be delivered even when the app is backgrounded or closed |
| NOT-04 | Users SHALL be able to view a history of all received notifications |
| NOT-05 | Teachers SHALL only be able to send announcements to their own class |
| NOT-06 | Emergency notices SHALL be visually distinguished from standard announcements |

---

### 5.8 Calendar (Event Management)

**Priority: MUST HAVE**

#### 5.8.1 Event Types

- Poya programs
- Special sermons
- Dhamma exams
- Holiday notices
- Special events (Concert, Pindapatha Dane, etc.)

| Requirement ID | Description |
|---------------|-------------|
| CAL-01 | Only the Principal/Admin SHALL be able to create, edit, or delete events |
| CAL-02 | Parents and teachers SHALL view events in a read-only calendar view |
| CAL-03 | Calendar SHALL support monthly and list views |
| CAL-04 | Events SHALL include: title, date/time, description, event type, and optional location |
| CAL-05 | Parents SHALL receive push notification reminders for upcoming events |
| CAL-06 | Past events SHALL remain visible in the calendar for reference |

---

### 5.9 Administrative Dashboard

**Priority: SHOULD HAVE**

| Requirement ID | Description |
|---------------|-------------|
| DASH-01 | Dashboard SHALL display: total students, total teachers, pending registrations, newly registered students, dropped students |
| DASH-02 | Dashboard SHALL display current-day attendance rate across all classes |
| DASH-03 | Dashboard SHALL display per-class attendance summary |
| DASH-04 | Dashboard SHALL be accessible on the web portal only |

#### 5.9.1 Attendance Reports

| Report | Description |
|--------|-------------|
| Daily Attendance | Per-class attendance for a selected date |
| Weekly Attendance | Aggregated attendance for a selected week |
| Monthly Attendance | Monthly summary per student and per class |

| Requirement ID | Description |
|---------------|-------------|
| REP-01 | Principal SHALL be able to export attendance reports as CSV |
| REP-02 | Reports SHALL be filterable by class, date range, and student |
| REP-03 | Reports SHALL show attendance percentage per student |

---

### 5.10 Student Lifecycle Management

**Priority: SHOULD HAVE**

| Requirement ID | Description |
|---------------|-------------|
| SLM-01 | Principal SHALL be able to set student status to `Active`, `Inactive`, or `Dropped` |
| SLM-02 | Dropped students SHALL be hidden from active class rosters but retained in the database |
| SLM-03 | Historical attendance records of dropped students SHALL remain accessible for reporting |
| SLM-04 | System SHALL record the date and reason when a student is marked Dropped |

---

### 5.11 Messaging System

**Priority: SHOULD HAVE**

| Requirement ID | Description |
|---------------|-------------|
| MSG-01 | Teachers SHALL be able to send direct messages to individual parents of their class students |
| MSG-02 | Principal SHALL be able to send messages to: entire school, a specific class, or individual parents |
| MSG-03 | Parents SHALL receive and reply to messages from teachers or the Principal |
| MSG-04 | Parents SHALL NOT be able to send messages to other parents |
| MSG-05 | Message threads SHALL show sender name, timestamp, and read status |
| MSG-06 | New message receipt SHALL trigger a push notification |

---

### 5.12 Profile Management

**Priority: SHOULD HAVE**

| Requirement ID | Description |
|---------------|-------------|
| PROF-01 | All users SHALL be able to update their phone number |
| PROF-02 | All users SHALL be able to update their address |
| PROF-03 | All users SHALL be able to update their profile photo |
| PROF-04 | Parents SHALL be able to update their registered children's details (subject to re-approval if core fields change) |
| PROF-05 | Email SHALL not be editable by the user (managed via SSO provider) |

---

## 6. Non-Functional Requirements

### 6.1 Security

| Requirement ID | Description |
|---------------|-------------|
| SEC-01 | All data transmission SHALL use TLS 1.2 or higher (HTTPS) |
| SEC-02 | Authentication SHALL be handled via Supabase Auth with JWT tokens |
| SEC-03 | Row-Level Security (RLS) policies SHALL be enforced at the database level in Supabase |
| SEC-04 | Users SHALL only access data permitted by their role |
| SEC-05 | Student photos and sensitive files SHALL be stored in private Supabase Storage buckets, accessible only via signed URLs |
| SEC-06 | Admin accounts SHALL support two-factor authentication (future consideration) |
| SEC-07 | All API endpoints SHALL validate user identity and role before processing |

### 6.2 Privacy & Data Protection

| Requirement ID | Description |
|---------------|-------------|
| PRIV-01 | Student personal data (name, DOB, photo, medical/allergy info) SHALL be accessible only to: the registering parent, assigned teacher, and Principal |
| PRIV-02 | Parent contact details SHALL NOT be visible to other parents |
| PRIV-03 | Photo publish approval (consent) SHALL be honoured — student photos without consent SHALL not appear in any shared view |
| PRIV-04 | The system SHALL comply with Australian Privacy Principles (APP) under the Privacy Act 1988 |

### 6.3 Performance

| Requirement ID | Description |
|---------------|-------------|
| PERF-01 | The system SHALL support a minimum of 500 concurrent users |
| PERF-02 | Attendance check-in/out SHALL commit to the database within 2 seconds under normal load |
| PERF-03 | Page/screen load times SHALL be under 3 seconds on a standard 4G mobile connection |
| PERF-04 | Push notifications SHALL be delivered within 30 seconds of trigger |

### 6.4 Usability

| Requirement ID | Description |
|---------------|-------------|
| USA-01 | Mobile UI SHALL be operable with one hand |
| USA-02 | Font sizes SHALL meet WCAG 2.1 AA minimum contrast ratios |
| USA-03 | The app SHALL support both English and Sinhala language content (for announcements and labels) |
| USA-04 | Onboarding flow SHALL complete new parent registration in under 5 minutes |
| USA-05 | Teachers SHALL be able to complete a full attendance session in under 3 minutes for a class of 20 |

### 6.5 Availability & Reliability

| Requirement ID | Description |
|---------------|-------------|
| REL-01 | The system SHALL target 99.5% uptime (excluding planned maintenance) |
| REL-02 | Data SHALL be backed up daily via Supabase managed backups |
| REL-03 | The mobile app SHALL cache class rosters locally for offline attendance marking when connectivity is unavailable |
| REL-04 | Offline attendance records SHALL sync automatically when connectivity is restored |

### 6.6 Scalability

| Requirement ID | Description |
|---------------|-------------|
| SCA-01 | The database schema SHALL include a `school_id` on all tenant-specific tables to support multi-school expansion |
| SCA-02 | The system architecture SHALL allow onboarding of additional Dhamma Schools (Mount Evelyn, West) without code changes |

---

## 7. UI/UX & Design System

The visual identity of the application SHALL align with the Mahamevnawa Buddhist Monastery Melbourne branding as defined on mahamevnawa.org.au.

### 7.1 Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary Accent | Red/Orange | `#f34e3a` |
| Headings / Text | Dark Brown | `#614141` |
| Background / Cards | Cream/Light Yellow | `#fbf4c2` |
| Surface | White | `#ffffff` |
| Header Overlay / Dark BG | Dark Navy | `#052254` |
| Footer / Links | Gold/Amber | `#f7b656` |
| Success State | Soft Green | `#4caf87` |
| Error/Danger State | Deep Red | `#c0392b` |

### 7.2 Typography

| Use | Font | Weight |
|-----|------|--------|
| Display / Screen Titles | DM Serif Display | Regular |
| Body Text | Work Sans | 400 |
| Navigation / Labels | Arima Madurai | 500 |
| Sinhala Content | UN Malithi / UN Isiwara | Regular |

### 7.3 Design Principles

- **Contemplative minimalism**: Clean layouts with generous whitespace, minimal visual noise
- **Buddhist-inspired warmth**: Warm earth tones (cream, brown, gold) balanced with the deep navy for authority sections
- **Gradient overlays**: Deep navy-to-transparent gradients on hero images/header sections to evoke spiritual depth
- **Accessible contrast**: All text/background combinations to meet WCAG 2.1 AA (minimum 4.5:1 ratio)
- **Multilingual readiness**: Layouts must gracefully handle both Latin and Sinhala character sets

### 7.4 Component Guidelines

| Component | Specification |
|-----------|--------------|
| Buttons (Primary) | Background `#f34e3a`, white text, 8px border radius |
| Buttons (Secondary) | Outlined `#614141`, transparent fill |
| Cards | White background, 1px border `#fbf4c2`, 12px radius, subtle shadow |
| App Bar | Dark Navy `#052254` with white title text |
| Bottom Navigation (Mobile) | White background, active icon in `#f34e3a` |
| Status Badges | Pending: amber; Approved: green; Rejected: red |
| Fonts (Mobile) | Minimum 14sp body, 18sp headings |

### 7.5 Platform-Specific UX Notes

**Mobile App (Android & iOS)**
- Splash screen: monastery/lotus motif on dark navy background
- Bottom navigation bar: Home, Attendance, Messages, Calendar, Profile
- Attendance screen: Full-page student photo card with large Check-in / Check-out buttons for ease of use during busy sessions

**Web Portal (Admin)**
- Left-side navigation panel
- Data-dense tables with filtering and export capability
- Dashboard with summary cards and chart widgets (attendance trend)

---

## 8. Data Model

### 8.1 Core Entities

```
schools
  id (PK), name, location, created_at

users
  id (PK), school_id (FK), email, full_name, preferred_name,
  phone, address, role (parent|teacher|admin), profile_photo_url,
  status (active|inactive), created_at

students
  id (PK), school_id (FK), first_name, last_name, preferred_name,
  dob, age (computed), gender, food_allergy_notes, has_allergies,
  photo_url, photo_publish_consent, parent_id (FK → users),
  class_id (FK → classes), status (pending|approved|rejected|active|inactive|dropped),
  created_at, updated_at

classes
  id (PK), school_id (FK), name, grade_level, teacher_id (FK → users),
  created_at

attendance_records
  id (PK), school_id (FK), student_id (FK), teacher_id (FK),
  class_id (FK), date, checkin_time, checkout_time,
  status (present|checked_in|checked_out|absent), created_at

announcements
  id (PK), school_id (FK), author_id (FK → users), title, body,
  type (school|class|emergency|event_reminder), target_class_id (nullable),
  published_at, created_at

events
  id (PK), school_id (FK), title, description, event_type
  (poya|sermon|exam|holiday|special), start_datetime, end_datetime,
  location, created_by (FK → users), created_at

messages
  id (PK), school_id (FK), sender_id (FK → users),
  recipient_id (FK → users), body, read_at, created_at

notifications
  id (PK), user_id (FK), title, body, type, reference_id,
  read, created_at
```

---

## 9. Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Mobile Frontend | Flutter / FlutterFlow | Single codebase for Android & iOS |
| Web Portal Frontend | FlutterFlow Web | Compiled to Vercel |
| Backend / Auth | Supabase | Auth, REST API, Realtime, Row-Level Security |
| Database | PostgreSQL (via Supabase) | Hosted managed instance |
| File Storage | Supabase Storage | Student photos, profile images |
| Push Notifications | Firebase Cloud Messaging (FCM) | Via Supabase Edge Functions trigger |
| Hosting (Web) | Vercel | CD from main branch |
| CI/CD | GitHub Actions | Lint, test, deploy pipeline |

---

## 10. Release Phases

### Phase 1 – MVP (Must Have)

1. Social login (Google, Apple ID)
2. Parent self-registration
3. Student registration form + photo upload
4. Teacher registration
5. Student registration approval workflow (Teacher review → Principal approval)
6. Attendance check-in / check-out
7. Basic school-wide and class announcements with push notifications
8. Read-only event calendar for parents

### Phase 2 – Enhanced Features (Should Have)

1. Administrative dashboard with summary metrics
2. Attendance reports (daily, weekly, monthly) with CSV export
3. Student lifecycle management (Active / Inactive / Dropped)
4. In-app messaging (Teacher ↔ Parent, Principal ↔ School)
5. Advanced reporting
6. QR code attendance scanning
7. Volunteer management
8. Food roster management

### Phase 3 – Future Enhancements

1. Student merit / achievement tracking
2. Online class materials repository
3. Donation management
4. Volunteer scheduling
5. Multi-school onboarding (Mount Evelyn, West)

---

## 11. Constraints & Assumptions

### Constraints

- The mobile apps must be available on both Google Play Store and Apple App Store
- Apple Sign-In is mandatory when offering third-party OAuth on iOS (App Store policy)
- Student data must be stored in Australian data residency compliant infrastructure
- The web portal is desktop-first; mobile browser support is desirable but not required for Phase 1

### Assumptions

- All Dhamma School sessions occur weekly (Sunday); attendance is per-session, not daily
- Each class has exactly one assigned teacher at a time
- A parent may have multiple children enrolled across different classes
- Teachers who are also parents may have both roles; the system should support dual-role accounts
- Internet connectivity is available on-site during sessions (mobile data assumed as fallback)
- Initial deployment is for the Melbourne Southbank Dhamma School only

---

## 12. Success Criteria

The system is considered successful when the school can achieve all of the following **without manual spreadsheets**:

| Criterion | Measure |
|-----------|---------|
| Student onboarding | New students registered and approved end-to-end in the app |
| Attendance tracking | Teachers complete weekly class attendance in under 3 minutes |
| Parent communication | Announcements and event reminders delivered to all parents via push notification |
| Administrative visibility | Principal can view real-time attendance and generate monthly reports |
| Data integrity | Zero loss of historical student or attendance records |
| Adoption | 80%+ of active parents using the app within 3 months of launch |

---

*End of Software Requirements Specification*
