// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'parent' | 'teacher' | 'admin' | 'principal' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type StudentStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'dropped';
export type AttendanceStatus = 'present' | 'checked_in' | 'checked_out' | 'absent';
export type AnnouncementType = 'school' | 'class' | 'emergency' | 'event_reminder';
export type EventType = 'poya' | 'sermon' | 'exam' | 'holiday' | 'special';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface UserModel {
  id: string;
  schoolId: string;
  fullName: string;
  preferredName?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  profilePhotoUrl?: string;
  fcmToken?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentModel {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string; // ISO date yyyy-MM-dd
  gender: string;
  hasAllergies: boolean;
  allergyNotes?: string;
  photoUrl?: string;
  photoPublishConsent: boolean;
  address?: string;
  classId?: string;
  className?: string;
  status: StudentStatus;
  statusNote?: string;
  parents: StudentParentLink[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentParentLink {
  id: string;
  studentId: string;
  parentEmail: string;
  parentName?: string;
  parentPhone?: string;
  parentUserId?: string;
}

export interface TeacherInvitation {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  invitedBy?: string;
  claimedBy?: string;
  createdAt: string;
}

export interface ClassModel {
  id: string;
  schoolId: string;
  name: string;
  gradeLevel: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  createdAt: string;
}

export interface AttendanceModel {
  id: string;
  schoolId: string;
  studentId: string;
  teacherId: string;
  classId: string;
  sessionDate: string; // ISO date
  checkinTime?: string;
  checkoutTime?: string;
  status: AttendanceStatus;
  createdAt: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentPhotoUrl?: string;
}

export interface AnnouncementModel {
  id: string;
  schoolId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  type: AnnouncementType;
  targetClassId?: string;
  publishedAt: string;
  createdAt: string;
}

export interface EventModel {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  eventType: EventType;
  startDatetime: string;
  endDatetime?: string;
  location: string;
  createdBy: string;
  createdAt: string;
}

export interface MessageModel {
  id: string;
  schoolId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  body: string;
  readAt?: string;
  createdAt: string;
}

export interface ConversationModel {
  recipientId: string;
  recipientName: string;
  recipientPhotoUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface RegisterStudentStep1 {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;
  gender: string;
}

export interface RegisterStudentStep2 {
  hasAllergies: boolean;
  allergyNotes?: string;
  photoPublishConsent: boolean;
}

export interface RegisterStudentStep3 {
  photoUri?: string;
}

export interface ProfileFormData {
  fullName: string;
  preferredName?: string;
  phone?: string;
  address?: string;
}

export interface RoleSelectFormData extends ProfileFormData {
  role: UserRole;
}

export interface AnnouncementFormData {
  title: string;
  body: string;
  type: AnnouncementType;
  targetClassId?: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  eventType: EventType;
  startDatetime: string;
  endDatetime?: string;
  location: string;
}

export interface ClassFormData {
  name: string;
  gradeLevel: string;
  teacherId?: string;
}
