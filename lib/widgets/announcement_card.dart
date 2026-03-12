import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../core/utils/date_utils.dart';
import '../models/announcement_model.dart';

/// Announcement display card with emergency visual distinction.
class AnnouncementCard extends StatefulWidget {
  final AnnouncementModel announcement;
  final VoidCallback? onTap;

  const AnnouncementCard({
    super.key,
    required this.announcement,
    this.onTap,
  });

  @override
  State<AnnouncementCard> createState() => _AnnouncementCardState();
}

class _AnnouncementCardState extends State<AnnouncementCard> {
  bool _expanded = false;

  bool get _isEmergency =>
      widget.announcement.type == AnnouncementType.emergency;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: _isEmergency
            ? const BorderSide(color: AppColors.errorRed, width: 2)
            : const BorderSide(color: AppColors.cardBorder, width: 1),
      ),
      child: InkWell(
        onTap: () {
          setState(() => _expanded = !_expanded);
          widget.onTap?.call();
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_isEmergency)
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: const BoxDecoration(
                  color: AppColors.errorRed,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(10)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_rounded,
                        color: Colors.white, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'EMERGENCY NOTICE',
                      style: AppTextStyles.labelMedium.copyWith(
                        color: AppColors.white,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.announcement.title,
                              style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: FontWeight.w700,
                                color: _isEmergency
                                    ? AppColors.errorRed
                                    : AppColors.darkBrown,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  widget.announcement.authorName ?? 'Dhamma School',
                                  style: AppTextStyles.caption.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text('·', style: AppTextStyles.caption),
                                const SizedBox(width: 6),
                                Text(
                                  AppDateUtils.timeAgo(
                                      widget.announcement.publishedAt),
                                  style: AppTextStyles.caption,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      _TypeChip(type: widget.announcement.type),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.announcement.body,
                    style: AppTextStyles.bodyMedium,
                    maxLines: _expanded ? null : 3,
                    overflow: _expanded ? null : TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      _expanded ? 'Show less' : 'Read more',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.darkNavy,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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

class _TypeChip extends StatelessWidget {
  final AnnouncementType type;

  const _TypeChip({required this.type});

  Color get _color {
    switch (type) {
      case AnnouncementType.emergency:
        return AppColors.errorRed;
      case AnnouncementType.school:
        return AppColors.darkNavy;
      case AnnouncementType.clazz:
        return AppColors.darkBrown;
      case AnnouncementType.eventReminder:
        return AppColors.goldAmber;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _color.withAlpha(60)),
      ),
      child: Text(
        type.displayLabel,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _color,
        ),
      ),
    );
  }
}
