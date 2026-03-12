import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../models/attendance_model.dart';
import '../models/student_model.dart';
import 'photo_placeholder.dart';
import 'status_badge.dart';

/// Swipeable attendance tile for the attendance screen.
/// Swipe right → Check In, Swipe left → Mark Absent.
/// Tapping an already checked-in student → Check Out.
class AttendanceTile extends StatelessWidget {
  final StudentModel student;
  final AttendanceStatus currentStatus;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;
  final VoidCallback onMarkAbsent;

  const AttendanceTile({
    super.key,
    required this.student,
    required this.currentStatus,
    required this.onCheckIn,
    required this.onCheckOut,
    required this.onMarkAbsent,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key('attendance-${student.id}'),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.startToEnd) {
          // Swipe right = Check In
          if (currentStatus == AttendanceStatus.checkedIn) {
            onCheckOut();
          } else {
            onCheckIn();
          }
        } else {
          // Swipe left = Mark Absent
          onMarkAbsent();
        }
        return false; // Don't actually dismiss the tile
      },
      background: Container(
        color: AppColors.successGreen,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 28),
            Text(
              currentStatus == AttendanceStatus.checkedIn
                  ? 'Check Out'
                  : 'Check In',
              style:
                  AppTextStyles.labelMedium.copyWith(color: AppColors.white),
            ),
          ],
        ),
      ),
      secondaryBackground: Container(
        color: AppColors.errorRed,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cancel, color: Colors.white, size: 28),
            Text(
              'Absent',
              style:
                  AppTextStyles.labelMedium.copyWith(color: AppColors.white),
            ),
          ],
        ),
      ),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              NetworkPhotoWidget(
                imageUrl: student.photoUrl,
                size: 52,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.fullName,
                      style: AppTextStyles.bodyMedium
                          .copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          '${student.age} yrs',
                          style: AppTextStyles.caption,
                        ),
                        if (student.hasAllergies) ...[
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.warning_amber_rounded,
                            size: 12,
                            color: AppColors.pendingAmber,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            'Allergy',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.pendingAmber,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AttendanceBadge(status: currentStatus, compact: true),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _ActionButton(
                        icon: Icons.login,
                        label: 'In',
                        color: AppColors.successGreen,
                        onTap: onCheckIn,
                        enabled: currentStatus != AttendanceStatus.checkedIn,
                      ),
                      const SizedBox(width: 6),
                      _ActionButton(
                        icon: Icons.logout,
                        label: 'Out',
                        color: AppColors.darkNavy,
                        onTap: onCheckOut,
                        enabled: currentStatus == AttendanceStatus.checkedIn,
                      ),
                      const SizedBox(width: 6),
                      _ActionButton(
                        icon: Icons.close,
                        label: 'Absent',
                        color: AppColors.errorRed,
                        onTap: onMarkAbsent,
                        enabled: currentStatus != AttendanceStatus.absent,
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool enabled;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: enabled ? color : color.withAlpha(60),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: Colors.white),
            const SizedBox(width: 2),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
