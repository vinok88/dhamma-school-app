import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/notification_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/message_provider.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_bar_widget.dart';

class NotificationCentreScreen extends ConsumerWidget {
  const NotificationCentreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      appBar: DhammaAppBar(
        title: 'Notifications',
        showBack: true,
        showNotifications: false,
        actions: [
          TextButton(
            onPressed: () async {
              final user = ref.read(currentUserProvider);
              if (user == null) return;
              try {
                await SupabaseService.instance
                    .markAllNotificationsRead(user.id);
                ref.invalidate(notificationsProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: ${e.toString()}'),
                      backgroundColor: AppColors.errorRed,
                    ),
                  );
                }
              }
            },
            child: Text(
              'Mark All Read',
              style: AppTextStyles.labelMedium.copyWith(
                color: AppColors.goldAmber,
              ),
            ),
          ),
        ],
      ),
      body: notificationsAsync.when(
        data: (rawList) {
          final notifications = rawList
              .map((r) => NotificationModel.fromJson(
                  r as Map<String, dynamic>))
              .toList();

          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_off_outlined,
                    size: 72,
                    color: AppColors.darkBrown.withAlpha(80),
                  ),
                  const SizedBox(height: 16),
                  Text('No notifications yet',
                      style: AppTextStyles.headlineSmall),
                  const SizedBox(height: 8),
                  Text(
                    'Announcements and updates will appear here',
                    style: AppTextStyles.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(notificationsProvider.future),
            color: AppColors.primaryRed,
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notif = notifications[index];
                return _NotificationTile(
                  notification: notif,
                  onTap: () async {
                    if (!notif.isRead) {
                      await SupabaseService.instance
                          .markNotificationRead(notif.id);
                      ref.invalidate(notificationsProvider);
                    }
                    // TODO: Navigate to the relevant screen based on notif.type and notif.referenceId
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Failed to load notifications',
                  style: AppTextStyles.bodyMedium),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => ref.refresh(notificationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback? onTap;

  const _NotificationTile({required this.notification, this.onTap});

  IconData get _icon {
    switch (notification.type) {
      case 'announcement':
        return Icons.campaign_outlined;
      case 'event':
        return Icons.event_outlined;
      case 'registration':
        return Icons.person_add_outlined;
      case 'message':
        return Icons.message_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: notification.isRead
            ? null
            : AppColors.creamYellow,
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: notification.isRead
                    ? AppColors.darkBrown.withAlpha(20)
                    : AppColors.primaryRed.withAlpha(20),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _icon,
                size: 20,
                color: notification.isRead
                    ? AppColors.darkBrown
                    : AppColors.primaryRed,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: notification.isRead
                                ? FontWeight.w400
                                : FontWeight.w700,
                          ),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryRed,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    AppDateUtils.timeAgo(notification.createdAt),
                    style: AppTextStyles.caption,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
