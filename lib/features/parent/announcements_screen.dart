import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/announcement_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/announcement_provider.dart';
import '../../widgets/announcement_card.dart';

class AnnouncementsScreen extends ConsumerWidget {
  final bool embedded;

  const AnnouncementsScreen({super.key, this.embedded = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolId = ref.watch(currentSchoolIdProvider);

    if (schoolId == null) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryRed),
      );
    }

    final announcementsAsync = ref.watch(announcementsProvider(schoolId));

    return RefreshIndicator(
      onRefresh: () => ref.refresh(announcementsProvider(schoolId).future),
      color: AppColors.primaryRed,
      child: announcementsAsync.when(
        data: (announcements) {
          if (announcements.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.campaign_outlined,
                    size: 72,
                    color: AppColors.darkBrown,
                  ),
                  SizedBox(height: 16),
                  Text('No announcements yet'),
                ],
              ),
            );
          }

          // Sort: emergencies first, then by date
          final sorted = [...announcements];
          sorted.sort((a, b) {
            if (a.type.isEmergency && !b.type.isEmergency) return -1;
            if (!a.type.isEmergency && b.type.isEmergency) return 1;
            return b.publishedAt.compareTo(a.publishedAt);
          });

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: sorted.length,
            itemBuilder: (context, index) =>
                AnnouncementCard(announcement: sorted[index]),
          );
        },
        loading: () => const Center(
            child:
                CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Failed to load announcements',
                  style: AppTextStyles.bodyMedium),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () =>
                    ref.refresh(announcementsProvider(schoolId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
