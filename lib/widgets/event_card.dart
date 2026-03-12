import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../core/utils/date_utils.dart';
import '../models/event_model.dart';
import 'status_badge.dart';

/// Card displaying event details.
class EventCard extends StatelessWidget {
  final EventModel event;
  final VoidCallback? onTap;
  final bool showActions;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const EventCard({
    super.key,
    required this.event,
    this.onTap,
    this.showActions = false,
    this.onEdit,
    this.onDelete,
  });

  Color get _typeColor {
    switch (event.eventType) {
      case EventType.poya:
        return AppColors.goldAmber;
      case EventType.sermon:
        return AppColors.darkNavy;
      case EventType.exam:
        return AppColors.primaryRed;
      case EventType.holiday:
        return AppColors.successGreen;
      case EventType.special:
        return AppColors.darkBrown;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            Container(
              height: 4,
              decoration: BoxDecoration(
                color: _typeColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          event.title,
                          style: AppTextStyles.bodyLarge.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      CustomBadge(
                        label: event.eventType.displayLabel,
                        backgroundColor: _typeColor,
                        compact: true,
                      ),
                      if (showActions) ...[
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          onPressed: onEdit,
                          color: AppColors.darkBrown,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        const SizedBox(width: 4),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          onPressed: onDelete,
                          color: AppColors.errorRed,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_outlined,
                        size: 14,
                        color: AppColors.darkBrown,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        AppDateUtils.formatDateTime(event.startDatetime),
                        style: AppTextStyles.bodySmall,
                      ),
                      if (event.endDatetime != null) ...[
                        Text(' – ', style: AppTextStyles.bodySmall),
                        Text(
                          AppDateUtils.formatTime(event.endDatetime!),
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ],
                  ),
                  if (event.location != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: AppColors.darkBrown,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          event.location!,
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                  ],
                  if (event.description != null &&
                      event.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      event.description!,
                      style: AppTextStyles.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
