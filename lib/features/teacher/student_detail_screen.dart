import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart' show launchUrl, Uri;
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/attendance_model.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/status_badge.dart';

class StudentDetailScreen extends ConsumerWidget {
  final String studentId;

  const StudentDetailScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentAsync = ref.watch(studentDetailProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      appBar: DhammaAppBar(
        title: 'Student Profile',
        showBack: true,
        showNotifications: false,
      ),
      body: studentAsync.when(
        data: (student) {
          if (student == null) {
            return const Center(child: Text('Student not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo and basic info
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        NetworkPhotoWidget(
                          imageUrl: student.photoUrl,
                          size: 90,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(student.fullName,
                                  style: AppTextStyles.headlineSmall),
                              if (student.preferredName != null)
                                Text('Known as: ${student.preferredName}',
                                    style: AppTextStyles.bodySmall),
                              const SizedBox(height: 8),
                              Text(
                                  '${student.age} years old · ${AppDateUtils.formatDate(student.dob)}',
                                  style: AppTextStyles.bodySmall),
                              if (student.gender != null)
                                Text(student.gender!,
                                    style: AppTextStyles.bodySmall),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Health info
                if (student.hasAllergies) ...[
                  const SizedBox(height: 12),
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(
                          color: AppColors.pendingAmber, width: 2),
                    ),
                    child: ListTile(
                      leading: const Icon(Icons.warning_amber_rounded,
                          color: AppColors.pendingAmber),
                      title: Text('Food Allergies',
                          style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.pendingAmber)),
                      subtitle: student.allergyNotes != null
                          ? Text(student.allergyNotes!,
                              style: AppTextStyles.bodySmall)
                          : null,
                    ),
                  ),
                ],

                // Parent contact
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Parent / Guardian',
                            style: AppTextStyles.headlineSmall),
                        const SizedBox(height: 12),
                        if (student.parentName != null)
                          ListTile(
                            leading: const Icon(Icons.person_outline),
                            title: Text(student.parentName!),
                            contentPadding: EdgeInsets.zero,
                          ),
                        if (student.parentPhone != null)
                          ListTile(
                            leading: const Icon(Icons.phone_outlined),
                            title: Text(student.parentPhone!),
                            contentPadding: EdgeInsets.zero,
                            onTap: () async {
                              final uri = Uri(
                                  scheme: 'tel',
                                  path: student.parentPhone!);
                              // TODO: import url_launcher; replace with proper launch
                              // await launchUrl(uri);
                            },
                            trailing: IconButton(
                              icon: const Icon(Icons.call,
                                  color: AppColors.successGreen),
                              onPressed: () async {
                                // TODO: Use url_launcher to dial parent phone
                              },
                            ),
                          ),
                        const SizedBox(height: 8),
                        FilledButton.icon(
                          onPressed: () {
                            context.push(
                              '/messages/${student.parentId}?name=${Uri.encodeComponent(student.parentName ?? 'Parent')}',
                            );
                          },
                          icon: const Icon(Icons.message_outlined),
                          label: const Text('Message Parent'),
                        ),
                      ],
                    ),
                  ),
                ),

                // Attendance history
                const SizedBox(height: 12),
                Text('Attendance History (Last 8 Sessions)',
                    style: AppTextStyles.headlineSmall),
                const SizedBox(height: 8),
                _AttendanceHistory(studentId: studentId),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
      ),
    );
  }
}

class _AttendanceHistory extends ConsumerWidget {
  final String studentId;
  const _AttendanceHistory({required this.studentId});

  Color _chipColor(AttendanceStatus status) {
    if (status.isPresent) return AppColors.successGreen;
    return AppColors.errorRed;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync =
        ref.watch(studentAttendanceHistoryProvider(studentId));
    return historyAsync.when(
      data: (records) {
        if (records.isEmpty) {
          return Text('No attendance records', style: AppTextStyles.bodySmall);
        }
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: records.map((r) {
            final color = _chipColor(r.status);
            return Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: color.withAlpha(80)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    AppDateUtils.formatDateShort(r.sessionDate),
                    style: TextStyle(
                      fontSize: 11,
                      color: color,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Icon(
                    r.status.isPresent
                        ? Icons.check_circle
                        : Icons.cancel,
                    size: 16,
                    color: color,
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
      loading: () => const CircularProgressIndicator(color: AppColors.primaryRed),
      error: (_, __) => Text('Could not load', style: AppTextStyles.bodySmall),
    );
  }
}
