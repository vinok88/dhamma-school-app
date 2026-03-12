import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/message_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/message_provider.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/loading_overlay.dart';

class MessageThreadScreen extends ConsumerStatefulWidget {
  final String recipientId;
  final String recipientName;

  const MessageThreadScreen({
    super.key,
    required this.recipientId,
    required this.recipientName,
  });

  @override
  ConsumerState<MessageThreadScreen> createState() =>
      _MessageThreadScreenState();
}

class _MessageThreadScreenState extends ConsumerState<MessageThreadScreen> {
  final _messageCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  RealtimeChannel? _channel;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _subscribeToMessages();
  }

  void _subscribeToMessages() {
    final userId = ref.read(currentUserProvider)?.id;
    if (userId == null) return;

    _channel = SupabaseService.instance.subscribeToMessages(
      userId,
      widget.recipientId,
      (newMessage) {
        // New message received — refresh thread
        ref.invalidate(messageNotifierProvider(widget.recipientId));
        _scrollToBottom();
      },
    );
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    _scrollCtrl.dispose();
    _channel?.unsubscribe();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final body = _messageCtrl.text.trim();
    if (body.isEmpty) return;

    final schoolId = ref.read(currentSchoolIdProvider);
    if (schoolId == null) return;

    setState(() => _isSending = true);
    _messageCtrl.clear();

    try {
      await ref
          .read(messageNotifierProvider(widget.recipientId).notifier)
          .sendMessage(body, schoolId);
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
        _messageCtrl.text = body; // Restore text on failure
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ref.watch(currentUserProvider)?.id;
    final messagesAsync =
        ref.watch(messageNotifierProvider(widget.recipientId));

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      appBar: DhammaAppBar(
        title: widget.recipientName,
        showBack: true,
        showNotifications: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.message_outlined,
                            size: 52, color: AppColors.darkBrown),
                        const SizedBox(height: 12),
                        Text(
                          'Start a conversation with ${widget.recipientName}',
                          style: AppTextStyles.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                WidgetsBinding.instance
                    .addPostFrameCallback((_) => _scrollToBottom());

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMe = message.senderId == currentUserId;
                    return _MessageBubble(
                        message: message, isMe: isMe);
                  },
                );
              },
              loading: () => const Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primaryRed)),
              error: (e, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Error: ${e.toString()}'),
                    OutlinedButton(
                      onPressed: () => ref.refresh(
                          messageNotifierProvider(widget.recipientId)),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Message input bar
          Container(
            color: AppColors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageCtrl,
                      maxLines: null,
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _isSending
                        ? const SizedBox(
                            width: 48,
                            height: 48,
                            child: CircularProgressIndicator(
                                color: AppColors.primaryRed, strokeWidth: 2),
                          )
                        : IconButton(
                            onPressed: _send,
                            icon: const Icon(Icons.send_rounded),
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.primaryRed,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(48, 48),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;

  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            margin: EdgeInsets.only(
              top: 4,
              bottom: 2,
              left: isMe ? 64 : 0,
              right: isMe ? 0 : 64,
            ),
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? AppColors.primaryRed : AppColors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(20),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              message.body,
              style: AppTextStyles.bodyMedium.copyWith(
                color: isMe ? AppColors.white : AppColors.darkBrown,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              AppDateUtils.timeAgo(message.createdAt),
              style: AppTextStyles.caption,
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}
