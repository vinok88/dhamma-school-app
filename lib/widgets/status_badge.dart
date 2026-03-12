import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text_styles.dart';
import '../models/student_model.dart';
import '../models/attendance_model.dart';

/// Color-coded status badge for student registration statuses.
class StatusBadge extends StatelessWidget {
  final StudentStatus status;
  final bool compact;

  const StatusBadge({
    super.key,
    required this.status,
    this.compact = false,
  });

  Color get _bgColor {
    switch (status) {
      case StudentStatus.pending:
        return AppColors.pendingAmber;
      case StudentStatus.underReview:
        return AppColors.pendingAmber.withAlpha(200);
      case StudentStatus.approved:
        return AppColors.successGreen;
      case StudentStatus.active:
        return AppColors.successGreen;
      case StudentStatus.rejected:
        return AppColors.errorRed;
      case StudentStatus.dropped:
        return AppColors.errorRed.withAlpha(180);
      case StudentStatus.inactive:
        return AppColors.darkBrown.withAlpha(150);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.displayLabel,
        style: AppTextStyles.badge.copyWith(
          fontSize: compact ? 10 : 11,
        ),
      ),
    );
  }
}

/// Color-coded attendance status badge.
class AttendanceBadge extends StatelessWidget {
  final AttendanceStatus status;
  final bool compact;

  const AttendanceBadge({
    super.key,
    required this.status,
    this.compact = false,
  });

  Color get _bgColor {
    switch (status) {
      case AttendanceStatus.present:
        return AppColors.successGreen;
      case AttendanceStatus.checkedIn:
        return AppColors.successGreen;
      case AttendanceStatus.checkedOut:
        return AppColors.darkNavy;
      case AttendanceStatus.absent:
        return AppColors.errorRed;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.displayLabel,
        style: AppTextStyles.badge.copyWith(
          fontSize: compact ? 10 : 11,
        ),
      ),
    );
  }
}

/// Generic text badge with custom color.
class CustomBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final bool compact;

  const CustomBadge({
    super.key,
    required this.label,
    this.backgroundColor = AppColors.darkNavy,
    this.textColor = AppColors.white,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AppTextStyles.badge.copyWith(
          color: textColor,
          fontSize: compact ? 10 : 11,
        ),
      ),
    );
  }
}
