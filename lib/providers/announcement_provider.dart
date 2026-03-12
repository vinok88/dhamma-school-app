import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/announcement_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// All announcements for a school.
final announcementsProvider =
    FutureProvider.family<List<AnnouncementModel>, String>(
        (ref, schoolId) async {
  final data = await SupabaseService.instance.getAnnouncements(schoolId);
  return data.map(AnnouncementModel.fromJson).toList();
});

/// Class-scoped announcements.
final classAnnouncementsProvider =
    FutureProvider.family<List<AnnouncementModel>, String>(
        (ref, classId) async {
  final data = await SupabaseService.instance.getClassAnnouncements(classId);
  return data.map(AnnouncementModel.fromJson).toList();
});

class AnnouncementNotifier extends AsyncNotifier<List<AnnouncementModel>> {
  @override
  Future<List<AnnouncementModel>> build() async {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) return [];
    final data = await SupabaseService.instance.getAnnouncements(schoolId);
    return data.map(AnnouncementModel.fromJson).toList();
  }

  Future<void> createAnnouncement(Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.announcements.insert({
        ...data,
        'published_at': DateTime.now().toIso8601String(),
        'created_at': DateTime.now().toIso8601String(),
      });
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteAnnouncement(String id) async {
    try {
      await SupabaseService.instance.announcements.delete().eq('id', id);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final announcementNotifierProvider =
    AsyncNotifierProvider<AnnouncementNotifier, List<AnnouncementModel>>(
        () => AnnouncementNotifier());
