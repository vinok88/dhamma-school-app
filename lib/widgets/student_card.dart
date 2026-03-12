import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../core/utils/date_utils.dart';
import '../models/student_model.dart';
import 'photo_placeholder.dart';
import 'status_badge.dart';

/// Reusable card showing student photo, name, age, class, and status badge.
class StudentCard extends StatelessWidget {
  final StudentModel student;
  final VoidCallback? onTap;
  final bool showStatus;
  final bool showClass;
  final bool compact;

  const StudentCard({
    super.key,
    required this.student,
    this.onTap,
    this.showStatus = true,
    this.showClass = true,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(compact ? 10 : 14),
          child: Row(
            children: [
              NetworkPhotoWidget(
                imageUrl: student.photoUrl,
                size: compact ? 48 : 60,
                isCircle: false,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            student.fullName,
                            style: compact
                                ? AppTextStyles.bodyMedium.copyWith(
                                    fontWeight: FontWeight.w600)
                                : AppTextStyles.bodyLarge.copyWith(
                                    fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (showStatus)
                          StatusBadge(status: student.status, compact: compact),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.cake_outlined,
                          size: 13,
                          color: AppColors.darkBrown.withAlpha(150),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${student.age} years old',
                          style: AppTextStyles.bodySmall,
                        ),
                        if (showClass && student.className != null) ...[
                          const SizedBox(width: 12),
                          Icon(
                            Icons.school_outlined,
                            size: 13,
                            color: AppColors.darkBrown.withAlpha(150),
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              student.className!,
                              style: AppTextStyles.bodySmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (student.preferredName != null &&
                        student.preferredName != student.firstName) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Known as: ${student.preferredName}',
                        style: AppTextStyles.caption,
                      ),
                    ],
                    if (student.hasAllergies) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            size: 13,
                            color: AppColors.pendingAmber,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Food Allergies',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.pendingAmber,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (onTap != null)
                Icon(
                  Icons.chevron_right,
                  color: AppColors.darkBrown.withAlpha(120),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
