/// Application-wide constants.
class AppConstants {
  AppConstants._();

  static const String appName = 'Dhamma School';
  static const String appFullName = 'Mahamevnawa Dhamma School';
  static const String appOrganisation = 'Mahamevnawa Buddhist Monastery, Melbourne';
  static const String appLocation = 'Southbank, VIC';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  static const String appBundleId = 'com.mahamevnawa.dhammaschool';

  // Supabase table names
  static const String tableSchools = 'schools';
  static const String tableUserProfiles = 'user_profiles';
  static const String tableStudents = 'students';
  static const String tableClasses = 'classes';
  static const String tableAttendanceRecords = 'attendance_records';
  static const String tableAnnouncements = 'announcements';
  static const String tableEvents = 'events';
  static const String tableMessages = 'messages';
  static const String tableNotifications = 'notifications';

  // Supabase Storage bucket names
  static const String bucketStudentPhotos = 'student-photos';
  static const String bucketProfilePhotos = 'profile-photos';

  // Signed URL expiry (seconds)
  static const int signedUrlExpiry = 3600; // 1 hour

  // Supabase Realtime channels
  static const String channelMessages = 'messages-realtime';
  static const String channelAttendance = 'attendance-realtime';

  // Pagination
  static const int pageSize = 20;

  // Session / timing
  /// Dhamma School sessions occur on Sundays
  static const int sessionDayOfWeek = DateTime.sunday;

  /// Splash screen delay in milliseconds
  static const int splashDelayMs = 2000;

  // Image sizing
  static const double photoThumbnailSize = 60.0;
  static const double photoProfileSize = 100.0;
  static const double photoDetailSize = 160.0;

  // Attendance status string values (matching DB enum)
  static const String statusPresent = 'present';
  static const String statusCheckedIn = 'checked_in';
  static const String statusCheckedOut = 'checked_out';
  static const String statusAbsent = 'absent';

  // Student status string values
  static const String studentPending = 'pending';
  static const String studentUnderReview = 'under_review';
  static const String studentApproved = 'approved';
  static const String studentRejected = 'rejected';
  static const String studentActive = 'active';
  static const String studentInactive = 'inactive';
  static const String studentDropped = 'dropped';

  // User role string values
  static const String roleParent = 'parent';
  static const String roleTeacher = 'teacher';
  static const String roleAdmin = 'admin';

  // Announcement type string values
  static const String announcementSchool = 'school';
  static const String announcementClass = 'class';
  static const String announcementEmergency = 'emergency';
  static const String announcementEventReminder = 'event_reminder';

  // Event type string values
  static const String eventPoya = 'poya';
  static const String eventSermon = 'sermon';
  static const String eventExam = 'exam';
  static const String eventHoliday = 'holiday';
  static const String eventSpecial = 'special';
}
