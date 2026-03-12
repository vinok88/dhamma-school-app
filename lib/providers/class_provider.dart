import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/class_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

final classesProvider =
    FutureProvider.family<List<ClassModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.getClasses(schoolId);
  return data.map(ClassModel.fromJson).toList();
});

class ClassNotifier extends AsyncNotifier<List<ClassModel>> {
  @override
  Future<List<ClassModel>> build() async {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) return [];
    final data = await SupabaseService.instance.getClasses(schoolId);
    return data.map(ClassModel.fromJson).toList();
  }

  Future<void> createClass(Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.classes.insert(data);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateClass(String classId, Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.classes
          .update(data)
          .eq('id', classId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteClass(String classId) async {
    try {
      await SupabaseService.instance.classes.delete().eq('id', classId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> assignTeacher(String classId, String teacherId) async {
    try {
      await SupabaseService.instance.classes
          .update({'teacher_id': teacherId})
          .eq('id', classId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> assignStudent(String studentId, String classId) async {
    try {
      await SupabaseService.instance.students
          .update({
            'class_id': classId,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', studentId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final classNotifierProvider =
    AsyncNotifierProvider<ClassNotifier, List<ClassModel>>(
        () => ClassNotifier());
