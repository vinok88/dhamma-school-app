import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/attendance_model.dart';
import '../../models/student_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../widgets/attendance_tile.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myClassAsync = ref.watch(myClassProvider);

    return myClassAsync.when(
      data: (classData) {
        if (classData == null) {
          return const _NoClassPlaceholder();
        }
        final classId = classData['id'] as String;
        final className = classData['name'] as String? ?? 'My Class';
        return _AttendanceBody(classId: classId, className: className);
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Center(
        child: Text('Error loading class: ${e.toString()}'),
      ),
    );
  }
}

class _AttendanceBody extends ConsumerWidget {
  final String classId;
  final String className;

  const _AttendanceBody({required this.classId, required this.className});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final profile = ref.watch(userProfileProvider).valueOrNull;
    final studentsAsync = ref.watch(classStudentsProvider(classId));
    final attendanceAsync =
        ref.watch(attendanceNotifierProvider(classId));

    return Column(
      children: [
        // Session header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: AppColors.white,
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(className, style: AppTextStyles.headlineSmall),
                  Text(
                    AppDateUtils.formatDate(DateTime.now()),
                    style: AppTextStyles.bodySmall,
                  ),
                ],
              ),
              const Spacer(),
              // Summary bar
              attendanceAsync.when(
                data: (attendanceList) {
                  final presentCount =
                      attendanceList.where((a) => a.status.isPresent).length;
                  final totalCount = studentsAsync.valueOrNull?.length ?? 0;
                  return Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.successGreen.withAlpha(30),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: AppColors.successGreen.withAlpha(80)),
                    ),
                    child: Text(
                      '$presentCount / $totalCount Present',
                      style: AppTextStyles.labelMedium.copyWith(
                        color: AppColors.successGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: studentsAsync.when(
            data: (students) {
              if (students.isEmpty) {
                return const Center(
                  child: Text('No students in this class'),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(classStudentsProvider(classId));
                  ref.invalidate(attendanceNotifierProvider(classId));
                },
                color: AppColors.primaryRed,
                child: attendanceAsync.when(
                  data: (attendanceList) {
                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: students.length,
                      itemBuilder: (context, index) {
                        final student = students[index];
                        final record = attendanceList
                            .where((a) => a.studentId == student.id)
                            .firstOrNull;
                        final status =
                            record?.status ?? AttendanceStatus.absent;

                        return AttendanceTile(
                          student: student,
                          currentStatus: status,
                          onCheckIn: () => _checkIn(
                              context, ref, student, user?.id ?? '',
                              profile?.schoolId ?? ''),
                          onCheckOut: () => _checkOut(
                              context, ref, student, user?.id ?? '',
                              profile?.schoolId ?? ''),
                          onMarkAbsent: () => _markAbsent(
                              context, ref, student, user?.id ?? '',
                              profile?.schoolId ?? ''),
                        );
                      },
                    );
                  },
                  loading: () => const Center(
                    child: CircularProgressIndicator(
                        color: AppColors.primaryRed),
                  ),
                  error: (e, _) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Error: ${e.toString()}'),
                        OutlinedButton(
                          onPressed: () =>
                              ref.refresh(attendanceNotifierProvider(classId)),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.primaryRed),
            ),
            error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
          ),
        ),
      ],
    );
  }

  Future<void> _checkIn(
    BuildContext context,
    WidgetRef ref,
    StudentModel student,
    String teacherId,
    String schoolId,
  ) async {
    try {
      await ref
          .read(attendanceNotifierProvider(classId).notifier)
          .checkIn(student.id, teacherId, schoolId);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-in failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    }
  }

  Future<void> _checkOut(
    BuildContext context,
    WidgetRef ref,
    StudentModel student,
    String teacherId,
    String schoolId,
  ) async {
    try {
      await ref
          .read(attendanceNotifierProvider(classId).notifier)
          .checkOut(student.id, teacherId, schoolId);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-out failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    }
  }

  Future<void> _markAbsent(
    BuildContext context,
    WidgetRef ref,
    StudentModel student,
    String teacherId,
    String schoolId,
  ) async {
    try {
      await ref
          .read(attendanceNotifierProvider(classId).notifier)
          .markAbsent(student.id, teacherId, schoolId);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    }
  }
}

class _NoClassPlaceholder extends StatelessWidget {
  const _NoClassPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.class_outlined,
            size: 72,
            color: AppColors.darkBrown.withAlpha(80),
          ),
          const SizedBox(height: 16),
          Text(
            'No Class Assigned',
            style: AppTextStyles.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Please wait for the Principal to assign you to a class.',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
