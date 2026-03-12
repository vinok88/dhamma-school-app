import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/attendance_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// Today's attendance for a class.
final todayAttendanceProvider =
    FutureProvider.family<List<AttendanceModel>, String>((ref, classId) async {
  final data = await SupabaseService.instance.getTodayAttendance(classId);
  return data.map(AttendanceModel.fromJson).toList();
});

/// Attendance history for a single student.
final studentAttendanceHistoryProvider =
    FutureProvider.family<List<AttendanceModel>, String>(
        (ref, studentId) async {
  final data = await SupabaseService.instance.getAttendanceHistory(studentId);
  return data.map(AttendanceModel.fromJson).toList();
});

/// Manages attendance check-in, check-out, and absent marking.
/// Supports optimistic updates for snappy UX.
class AttendanceNotifier
    extends FamilyAsyncNotifier<List<AttendanceModel>, String> {
  @override
  Future<List<AttendanceModel>> build(String classId) async {
    final data = await SupabaseService.instance.getTodayAttendance(classId);
    return data.map(AttendanceModel.fromJson).toList();
  }

  String get _todayDate {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  Future<void> checkIn(String studentId, String teacherId, String schoolId) async {
    final now = DateTime.now();

    // Optimistic update
    final current = state.valueOrNull ?? [];
    final existingIndex = current.indexWhere((a) => a.studentId == studentId);
    List<AttendanceModel> updated;

    if (existingIndex >= 0) {
      updated = List.from(current);
      updated[existingIndex] = updated[existingIndex].copyWith(
        status: AttendanceStatus.checkedIn,
        checkinTime: now,
      );
    } else {
      updated = [
        ...current,
        AttendanceModel(
          id: 'optimistic-$studentId',
          schoolId: schoolId,
          studentId: studentId,
          teacherId: teacherId,
          classId: arg,
          sessionDate: DateTime.now(),
          checkinTime: now,
          status: AttendanceStatus.checkedIn,
          createdAt: now,
        ),
      ];
    }
    state = AsyncValue.data(updated);

    try {
      await SupabaseService.instance.upsertAttendance({
        'school_id': schoolId,
        'student_id': studentId,
        'teacher_id': teacherId,
        'class_id': arg,
        'session_date': _todayDate,
        'checkin_time': now.toIso8601String(),
        'status': AttendanceStatus.checkedIn.toJson(),
      });
      // Refresh from server to get real ID
      ref.invalidateSelf();
    } catch (e) {
      // Revert optimistic update on error
      ref.invalidateSelf();
      rethrow;
    }
  }

  Future<void> checkOut(String studentId, String teacherId, String schoolId) async {
    final now = DateTime.now();

    // Optimistic update
    final current = state.valueOrNull ?? [];
    final existingIndex = current.indexWhere((a) => a.studentId == studentId);
    if (existingIndex >= 0) {
      final updated = List<AttendanceModel>.from(current);
      updated[existingIndex] = updated[existingIndex].copyWith(
        status: AttendanceStatus.checkedOut,
        checkoutTime: now,
      );
      state = AsyncValue.data(updated);
    }

    try {
      await SupabaseService.instance.upsertAttendance({
        'school_id': schoolId,
        'student_id': studentId,
        'teacher_id': teacherId,
        'class_id': arg,
        'session_date': _todayDate,
        'checkout_time': now.toIso8601String(),
        'status': AttendanceStatus.checkedOut.toJson(),
      });
      ref.invalidateSelf();
    } catch (e) {
      ref.invalidateSelf();
      rethrow;
    }
  }

  Future<void> markAbsent(String studentId, String teacherId, String schoolId) async {
    // Optimistic update
    final current = state.valueOrNull ?? [];
    final existingIndex = current.indexWhere((a) => a.studentId == studentId);
    if (existingIndex >= 0) {
      final updated = List<AttendanceModel>.from(current);
      updated[existingIndex] = updated[existingIndex].copyWith(
        status: AttendanceStatus.absent,
      );
      state = AsyncValue.data(updated);
    }

    try {
      await SupabaseService.instance.upsertAttendance({
        'school_id': schoolId,
        'student_id': studentId,
        'teacher_id': teacherId,
        'class_id': arg,
        'session_date': _todayDate,
        'status': AttendanceStatus.absent.toJson(),
      });
      ref.invalidateSelf();
    } catch (e) {
      ref.invalidateSelf();
      rethrow;
    }
  }
}

final attendanceNotifierProvider = AsyncNotifierProviderFamily<
    AttendanceNotifier, List<AttendanceModel>, String>(
  () => AttendanceNotifier(),
);
