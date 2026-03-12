import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/student_model.dart';
import '../../models/attendance_model.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/photo_placeholder.dart';

class StudentStatusScreen extends ConsumerWidget {
  final String studentId;

  const StudentStatusScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentAsync = ref.watch(studentDetailProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      appBar: DhammaAppBar(
        title: 'Student Status',
        showBack: true,
        showNotifications: false,
      ),
      body: studentAsync.when(
        data: (student) {
          if (student == null) {
            return const Center(child: Text('Student not found'));
          }
          return _StudentStatusBody(student: student);
        },
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: ${error.toString()}',
                  style: AppTextStyles.bodyMedium),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () =>
                    ref.refresh(studentDetailProvider(studentId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentStatusBody extends ConsumerWidget {
  final StudentModel student;

  const _StudentStatusBody({required this.student});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      NetworkPhotoWidget(
                        imageUrl: student.photoUrl,
                        size: 80,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student.fullName,
                              style: AppTextStyles.headlineSmall,
                            ),
                            if (student.preferredName != null &&
                                student.preferredName != student.firstName) ...[
                              const SizedBox(height: 2),
                              Text(
                                'Known as: ${student.preferredName}',
                                style: AppTextStyles.bodySmall,
                              ),
                            ],
                            const SizedBox(height: 8),
                            StatusBadge(status: student.status),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  _InfoRow(
                    label: 'Date of Birth',
                    value: AppDateUtils.formatDate(student.dob),
                  ),
                  _InfoRow(
                    label: 'Age',
                    value: '${student.age} years old',
                  ),
                  if (student.gender != null)
                    _InfoRow(label: 'Gender', value: student.gender!),
                  if (student.className != null)
                    _InfoRow(label: 'Class', value: student.className!),
                  _InfoRow(
                    label: 'Registered',
                    value: AppDateUtils.formatDate(student.createdAt),
                  ),
                ],
              ),
            ),
          ),

          // Health Info
          if (student.hasAllergies) ...[
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.pendingAmber, width: 2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded,
                            color: AppColors.pendingAmber, size: 20),
                        const SizedBox(width: 8),
                        Text('Food Allergies',
                            style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.pendingAmber)),
                      ],
                    ),
                    if (student.allergyNotes != null) ...[
                      const SizedBox(height: 8),
                      Text(student.allergyNotes!, style: AppTextStyles.bodyMedium),
                    ],
                  ],
                ),
              ),
            ),
          ],

          // Rejection Notice
          if (student.status == StudentStatus.rejected &&
              student.statusNote != null) ...[
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side:
                    const BorderSide(color: AppColors.errorRed, width: 2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.cancel_outlined,
                            color: AppColors.errorRed, size: 20),
                        const SizedBox(width: 8),
                        Text('Rejection Reason',
                            style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.errorRed)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(student.statusNote!, style: AppTextStyles.bodyMedium),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () {
                        // TODO: Navigate to pre-filled edit form for resubmission
                        context.push(AppRoutes.registerStudent);
                      },
                      icon: const Icon(Icons.edit),
                      label: const Text('Edit & Resubmit'),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Attendance history (if approved/active)
          if (student.status == StudentStatus.approved ||
              student.status == StudentStatus.active) ...[
            const SizedBox(height: 16),
            Text('Recent Attendance', style: AppTextStyles.headlineSmall),
            const SizedBox(height: 8),
            _AttendanceHistory(studentId: student.id),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _AttendanceHistory extends ConsumerWidget {
  final String studentId;
  const _AttendanceHistory({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(studentAttendanceHistoryProvider(studentId));
    return history.when(
      data: (records) {
        if (records.isEmpty) {
          return Text('No attendance records yet',
              style: AppTextStyles.bodySmall);
        }
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: records
              .take(4)
              .map((record) => _AttendanceChip(record: record))
              .toList(),
        );
      },
      loading: () => const SizedBox(
        height: 40,
        child: CircularProgressIndicator(color: AppColors.primaryRed),
      ),
      error: (_, __) =>
          Text('Could not load attendance', style: AppTextStyles.bodySmall),
    );
  }
}

class _AttendanceChip extends StatelessWidget {
  final AttendanceModel record;
  const _AttendanceChip({required this.record});

  Color get _color {
    if (record.status.isPresent) return AppColors.successGreen;
    return AppColors.errorRed;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _color.withAlpha(80)),
      ),
      child: Column(
        children: [
          Text(
            AppDateUtils.formatDateShort(record.sessionDate),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: _color,
            ),
          ),
          const SizedBox(height: 2),
          Icon(
            record.status.isPresent ? Icons.check_circle : Icons.cancel,
            size: 16,
            color: _color,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: AppTextStyles.bodyMedium),
          ),
        ],
      ),
    );
  }
}
