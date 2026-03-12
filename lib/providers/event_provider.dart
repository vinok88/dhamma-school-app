import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/event_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// All events for a school ordered by start_datetime.
final eventsProvider =
    FutureProvider.family<List<EventModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.getEvents(schoolId);
  return data.map(EventModel.fromJson).toList();
});

/// Events from today onwards.
final upcomingEventsProvider =
    FutureProvider.family<List<EventModel>, String>((ref, schoolId) async {
  final data = await SupabaseService.instance.getUpcomingEvents(schoolId);
  return data.map(EventModel.fromJson).toList();
});

class EventNotifier extends AsyncNotifier<List<EventModel>> {
  @override
  Future<List<EventModel>> build() async {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) return [];
    final data = await SupabaseService.instance.getEvents(schoolId);
    return data.map(EventModel.fromJson).toList();
  }

  Future<void> createEvent(Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.events.insert({
        ...data,
        'created_at': DateTime.now().toIso8601String(),
      });
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateEvent(String eventId, Map<String, dynamic> data) async {
    try {
      await SupabaseService.instance.events.update(data).eq('id', eventId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteEvent(String eventId) async {
    try {
      await SupabaseService.instance.events.delete().eq('id', eventId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final eventNotifierProvider =
    AsyncNotifierProvider<EventNotifier, List<EventModel>>(
        () => EventNotifier());
