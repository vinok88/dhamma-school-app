import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/student_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// All students for admin view.
final studentsProvider =
    FutureProvider.family<List<StudentModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.getAllStudents(schoolId);
  return data.map(StudentModel.fromJson).toList();
});

/// Parent's own children.
final myStudentsProvider = FutureProvider<List<StudentModel>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  final data = await SupabaseService.instance.getStudentsByParent(user.id);
  return data.map(StudentModel.fromJson).toList();
});

/// Students in a class (teacher view).
final classStudentsProvider =
    FutureProvider.family<List<StudentModel>, String>((ref, classId) async {
  final data = await SupabaseService.instance.getStudentsByClass(classId);
  return data.map(StudentModel.fromJson).toList();
});

/// Pending students for admin approval.
final pendingStudentsProvider =
    FutureProvider.family<List<StudentModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.getPendingStudents(schoolId);
  return data.map(StudentModel.fromJson).toList();
});

/// Single student detail.
final studentDetailProvider =
    FutureProvider.family<StudentModel?, String>((ref, studentId) async {
  final data = await SupabaseService.instance.getStudentById(studentId);
  if (data == null) return null;
  return StudentModel.fromJson(data);
});

/// Manages student creation, update, approval, rejection.
class StudentNotifier extends AsyncNotifier<List<StudentModel>> {
  late String _schoolId;

  @override
  Future<List<StudentModel>> build() async {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) return [];
    _schoolId = schoolId;
    final data = await SupabaseService.instance.getAllStudents(schoolId);
    return data.map(StudentModel.fromJson).toList();
  }

  Future<void> createStudent(Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.students.insert(data);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> approveStudent(String studentId, {String? classId}) async {
    try {
      await SupabaseService.instance.updateStudentStatus(
        studentId,
        StudentStatus.approved.toJson(),
        classId: classId,
      );
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> rejectStudent(String studentId, String reason) async {
    try {
      await SupabaseService.instance.updateStudentStatus(
        studentId,
        StudentStatus.rejected.toJson(),
        note: reason,
      );
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateStatus(
    String studentId,
    StudentStatus status, {
    String? note,
  }) async {
    try {
      await SupabaseService.instance.updateStudentStatus(
        studentId,
        status.toJson(),
        note: note,
      );
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateStudent(
      String studentId, Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.students
          .update({...data, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', studentId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final studentNotifierProvider =
    AsyncNotifierProvider<StudentNotifier, List<StudentModel>>(
        () => StudentNotifier());
