import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// All teachers (admin view).
final teachersProvider =
    FutureProvider.family<List<UserModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.userProfiles
      .select()
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .order('full_name');
  return List<Map<String, dynamic>>.from(data)
      .map(UserModel.fromJson)
      .toList();
});

/// Pending teachers awaiting approval.
final pendingTeachersProvider =
    FutureProvider.family<List<UserModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.userProfiles
      .select()
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .eq('status', 'pending')
      .order('created_at');
  return List<Map<String, dynamic>>.from(data)
      .map(UserModel.fromJson)
      .toList();
});

/// Current teacher's assigned class.
final myClassProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  return SupabaseService.instance.getTeacherClass(user.id);
});

class TeacherNotifier extends AsyncNotifier<List<UserModel>> {
  @override
  Future<List<UserModel>> build() async {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) return [];
    final data = await SupabaseService.instance.userProfiles
        .select()
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .order('full_name');
    return List<Map<String, dynamic>>.from(data)
        .map(UserModel.fromJson)
        .toList();
  }

  Future<void> approveTeacher(String teacherId) async {
    try {
      await SupabaseService.instance.userProfiles
          .update({
            'status': 'active',
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', teacherId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> rejectTeacher(String teacherId, String reason) async {
    try {
      // TODO: Store rejection reason in a separate notes field or status_note column
      await SupabaseService.instance.userProfiles
          .update({
            'status': 'inactive',
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', teacherId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> assignToClass(String teacherId, String classId) async {
    try {
      await SupabaseService.instance.classes
          .update({'teacher_id': teacherId})
          .eq('id', classId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deactivateTeacher(String teacherId) async {
    try {
      await SupabaseService.instance.userProfiles
          .update({
            'status': 'inactive',
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', teacherId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final teacherNotifierProvider =
    AsyncNotifierProvider<TeacherNotifier, List<UserModel>>(
        () => TeacherNotifier());
