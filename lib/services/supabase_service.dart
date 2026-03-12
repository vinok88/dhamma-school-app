import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants/app_constants.dart';

/// Singleton wrapper around Supabase client.
/// Provides typed query helpers for each table.
class SupabaseService {
  SupabaseService._();
  static final SupabaseService instance = SupabaseService._();

  SupabaseClient get client => Supabase.instance.client;

  // ----------------------------------------------------------------
  // Convenience table references
  // ----------------------------------------------------------------

  SupabaseQueryBuilder get schools =>
      client.from(AppConstants.tableSchools);

  SupabaseQueryBuilder get userProfiles =>
      client.from(AppConstants.tableUserProfiles);

  SupabaseQueryBuilder get students =>
      client.from(AppConstants.tableStudents);

  SupabaseQueryBuilder get classes =>
      client.from(AppConstants.tableClasses);

  SupabaseQueryBuilder get attendanceRecords =>
      client.from(AppConstants.tableAttendanceRecords);

  SupabaseQueryBuilder get announcements =>
      client.from(AppConstants.tableAnnouncements);

  SupabaseQueryBuilder get events =>
      client.from(AppConstants.tableEvents);

  SupabaseQueryBuilder get messages =>
      client.from(AppConstants.tableMessages);

  SupabaseQueryBuilder get notifications =>
      client.from(AppConstants.tableNotifications);

  // ----------------------------------------------------------------
  // Auth helpers
  // ----------------------------------------------------------------

  User? get currentUser => client.auth.currentUser;
  String? get currentUserId => client.auth.currentUser?.id;
  Session? get currentSession => client.auth.currentSession;

  // ----------------------------------------------------------------
  // User profile queries
  // ----------------------------------------------------------------

  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    final response = await userProfiles
        .select()
        .eq('id', userId)
        .maybeSingle();
    return response;
  }

  Future<void> upsertUserProfile(Map<String, dynamic> data) async {
    await userProfiles.upsert(data);
  }

  Future<void> updateFcmToken(String userId, String token) async {
    await userProfiles.update({'fcm_token': token}).eq('id', userId);
  }

  // ----------------------------------------------------------------
  // Student queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getStudentsByParent(
      String parentId) async {
    final response = await students
        .select('*, classes(name)')
        .eq('parent_id', parentId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getStudentsByClass(
      String classId) async {
    final response = await students
        .select('*, user_profiles!parent_id(full_name, phone)')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('first_name');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getPendingStudents(
      String schoolId) async {
    final response = await students
        .select('*, user_profiles!parent_id(full_name, phone, address)')
        .eq('school_id', schoolId)
        .inFilter('status', ['pending', 'under_review']).order('created_at');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getAllStudents(String schoolId) async {
    final response = await students
        .select('*, classes(name), user_profiles!parent_id(full_name, phone)')
        .eq('school_id', schoolId)
        .order('first_name');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<Map<String, dynamic>?> getStudentById(String studentId) async {
    final response = await students
        .select('*, classes(name), user_profiles!parent_id(full_name, phone, address)')
        .eq('id', studentId)
        .maybeSingle();
    return response;
  }

  Future<void> updateStudentStatus(
    String studentId,
    String status, {
    String? note,
    String? classId,
  }) async {
    final data = <String, dynamic>{
      'status': status,
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (note != null) data['status_note'] = note;
    if (classId != null) data['class_id'] = classId;
    await students.update(data).eq('id', studentId);
  }

  // ----------------------------------------------------------------
  // Attendance queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getTodayAttendance(
      String classId) async {
    final today = DateTime.now();
    final dateStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final response = await attendanceRecords
        .select('*, students(first_name, last_name, photo_url)')
        .eq('class_id', classId)
        .eq('session_date', dateStr);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getAttendanceHistory(
    String studentId, {
    int limit = 8,
  }) async {
    final response = await attendanceRecords
        .select()
        .eq('student_id', studentId)
        .order('session_date', ascending: false)
        .limit(limit);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> upsertAttendance(Map<String, dynamic> data) async {
    await attendanceRecords.upsert(data,
        onConflict: 'student_id, session_date');
  }

  // ----------------------------------------------------------------
  // Announcements queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getAnnouncements(
      String schoolId) async {
    final response = await announcements
        .select('*, user_profiles!author_id(full_name)')
        .eq('school_id', schoolId)
        .order('published_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getClassAnnouncements(
      String classId) async {
    final response = await announcements
        .select('*, user_profiles!author_id(full_name)')
        .eq('target_class_id', classId)
        .order('published_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  // ----------------------------------------------------------------
  // Events queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getEvents(String schoolId) async {
    final response = await events
        .select()
        .eq('school_id', schoolId)
        .order('start_datetime');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> getUpcomingEvents(
      String schoolId) async {
    final now = DateTime.now().toIso8601String();
    final response = await events
        .select()
        .eq('school_id', schoolId)
        .gte('start_datetime', now)
        .order('start_datetime')
        .limit(20);
    return List<Map<String, dynamic>>.from(response);
  }

  // ----------------------------------------------------------------
  // Messages queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getConversations(
      String userId) async {
    // Get distinct conversation partners
    final sent = await messages
        .select(
            'id, sender_id, recipient_id, body, created_at, read_at, user_profiles!recipient_id(full_name)')
        .eq('sender_id', userId)
        .order('created_at', ascending: false);

    final received = await messages
        .select(
            'id, sender_id, recipient_id, body, created_at, read_at, user_profiles!sender_id(full_name)')
        .eq('recipient_id', userId)
        .order('created_at', ascending: false);

    return [
      ...List<Map<String, dynamic>>.from(sent),
      ...List<Map<String, dynamic>>.from(received),
    ];
  }

  Future<List<Map<String, dynamic>>> getMessageThread(
    String userId,
    String recipientId,
  ) async {
    final response = await messages
        .select('*, user_profiles!sender_id(full_name)')
        .or('and(sender_id.eq.$userId,recipient_id.eq.$recipientId),and(sender_id.eq.$recipientId,recipient_id.eq.$userId)')
        .order('created_at');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> sendMessage(Map<String, dynamic> data) async {
    await messages.insert(data);
  }

  Future<void> markMessageRead(String messageId) async {
    await messages.update({'read_at': DateTime.now().toIso8601String()}).eq(
        'id', messageId);
  }

  // ----------------------------------------------------------------
  // Notifications queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getNotifications(
      String userId) async {
    final response = await notifications
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> markNotificationRead(String notificationId) async {
    await notifications
        .update({'is_read': true}).eq('id', notificationId);
  }

  Future<void> markAllNotificationsRead(String userId) async {
    await notifications
        .update({'is_read': true})
        .eq('user_id', userId)
        .eq('is_read', false);
  }

  // ----------------------------------------------------------------
  // Class queries
  // ----------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getClasses(String schoolId) async {
    final response = await classes
        .select('*, user_profiles!teacher_id(full_name)')
        .eq('school_id', schoolId)
        .order('name');
    return List<Map<String, dynamic>>.from(response);
  }

  Future<Map<String, dynamic>?> getTeacherClass(String teacherId) async {
    final response = await classes
        .select()
        .eq('teacher_id', teacherId)
        .maybeSingle();
    return response;
  }

  // ----------------------------------------------------------------
  // Realtime subscriptions
  // ----------------------------------------------------------------

  RealtimeChannel subscribeToMessages(
    String userId,
    String recipientId,
    void Function(Map<String, dynamic>) onInsert,
  ) {
    return client
        .channel('messages-$userId-$recipientId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: AppConstants.tableMessages,
          callback: (payload) {
            final newRecord = payload.newRecord;
            final senderId = newRecord['sender_id'];
            final recipId = newRecord['recipient_id'];
            if ((senderId == userId && recipId == recipientId) ||
                (senderId == recipientId && recipId == userId)) {
              onInsert(newRecord);
            }
          },
        )
        .subscribe();
  }

  RealtimeChannel subscribeToAttendance(
    String classId,
    String sessionDate,
    void Function(Map<String, dynamic>) onChange,
  ) {
    return client
        .channel('attendance-$classId-$sessionDate')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: AppConstants.tableAttendanceRecords,
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'class_id',
            value: classId,
          ),
          callback: (payload) {
            onChange(payload.newRecord);
          },
        )
        .subscribe();
  }
}
