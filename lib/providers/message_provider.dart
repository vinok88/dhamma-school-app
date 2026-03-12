import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/message_model.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

/// All conversations for the current user.
final conversationsProvider = FutureProvider<List<MessageModel>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final data = await SupabaseService.instance.getConversations(user.id);
  return data.map(MessageModel.fromJson).toList();
});

/// Messages in a thread between current user and a recipient.
final threadProvider =
    FutureProvider.family<List<MessageModel>, String>((ref, recipientId) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final data = await SupabaseService.instance.getMessageThread(
    user.id,
    recipientId,
  );
  return data.map(MessageModel.fromJson).toList();
});

class MessageNotifier extends FamilyAsyncNotifier<List<MessageModel>, String> {
  @override
  Future<List<MessageModel>> build(String recipientId) async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];

    final data = await SupabaseService.instance.getMessageThread(
      user.id,
      recipientId,
    );
    return data.map(MessageModel.fromJson).toList();
  }

  Future<void> sendMessage(String body, String schoolId) async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return;

    final now = DateTime.now();
    // Optimistic update
    final current = state.valueOrNull ?? [];
    final optimistic = MessageModel(
      id: 'optimistic-${now.millisecondsSinceEpoch}',
      schoolId: schoolId,
      senderId: user.id,
      recipientId: arg,
      body: body,
      createdAt: now,
    );
    state = AsyncValue.data([...current, optimistic]);

    try {
      await SupabaseService.instance.sendMessage({
        'school_id': schoolId,
        'sender_id': user.id,
        'recipient_id': arg,
        'body': body,
        'created_at': now.toIso8601String(),
      });
      ref.invalidateSelf();
    } catch (e) {
      ref.invalidateSelf();
      rethrow;
    }
  }

  Future<void> markRead(String messageId) async {
    try {
      await SupabaseService.instance.markMessageRead(messageId);
      ref.invalidateSelf();
    } catch (e) {
      rethrow;
    }
  }
}

final messageNotifierProvider =
    AsyncNotifierProviderFamily<MessageNotifier, List<MessageModel>, String>(
  () => MessageNotifier(),
);

/// Notifications provider
final notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return SupabaseService.instance.getNotifications(user.id);
});
