import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/class_provider.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/status_badge.dart';

class TeacherManagementScreen extends ConsumerWidget {
  const TeacherManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    final teachersAsync = ref.watch(teachersProvider(schoolId));

    return teachersAsync.when(
      data: (teachers) {
        if (teachers.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.school_outlined,
                    size: 72, color: AppColors.darkBrown),
                const SizedBox(height: 16),
                Text('No teachers registered',
                    style: AppTextStyles.headlineSmall),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => ref.refresh(teachersProvider(schoolId).future),
          color: AppColors.primaryRed,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: teachers.length,
            itemBuilder: (context, index) =>
                _TeacherTile(teacher: teachers[index]),
          ),
        );
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
    );
  }
}

class _TeacherTile extends ConsumerWidget {
  final UserModel teacher;
  const _TeacherTile({required this.teacher});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            NetworkPhotoWidget(
              imageUrl: teacher.profilePhotoUrl,
              size: 52,
              isCircle: true,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(teacher.displayName,
                      style: AppTextStyles.bodyMedium
                          .copyWith(fontWeight: FontWeight.w600)),
                  if (teacher.phone != null)
                    Text(teacher.phone!, style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            CustomBadge(
              label: teacher.status.toJson(),
              backgroundColor: teacher.status == UserStatus.active
                  ? AppColors.successGreen
                  : teacher.status == UserStatus.pending
                      ? AppColors.pendingAmber
                      : AppColors.errorRed,
              compact: true,
            ),
            PopupMenuButton<String>(
              itemBuilder: (_) => [
                const PopupMenuItem(
                    value: 'assign', child: Text('Assign to Class')),
                const PopupMenuItem(
                    value: 'deactivate', child: Text('Deactivate')),
              ],
              onSelected: (action) async {
                if (action == 'assign') {
                  _showClassAssignment(context, ref, teacher);
                } else if (action == 'deactivate') {
                  try {
                    await ref
                        .read(teacherNotifierProvider.notifier)
                        .deactivateTeacher(teacher.id);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Teacher deactivated'),
                          backgroundColor: AppColors.pendingAmber,
                        ),
                      );
                    }
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
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showClassAssignment(
      BuildContext context, WidgetRef ref, UserModel teacher) {
    final schoolId = ref.read(currentSchoolIdProvider);
    if (schoolId == null) return;

    showDialog(
      context: context,
      builder: (context) {
        final classesAsync = ref.watch(classesProvider(schoolId));
        return AlertDialog(
          title: Text('Assign ${teacher.displayName} to Class'),
          content: classesAsync.when(
            data: (classes) {
              if (classes.isEmpty) {
                return const Text('No classes available. Create a class first.');
              }
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: classes
                    .map((c) => ListTile(
                          title: Text(c.name),
                          subtitle: c.gradeLevel != null
                              ? Text(c.gradeLevel!)
                              : null,
                          trailing: c.teacherId == teacher.id
                              ? const Icon(Icons.check,
                                  color: AppColors.successGreen)
                              : null,
                          onTap: () async {
                            Navigator.pop(context);
                            try {
                              await ref
                                  .read(teacherNotifierProvider.notifier)
                                  .assignToClass(teacher.id, c.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        '${teacher.displayName} assigned to ${c.name}'),
                                    backgroundColor: AppColors.successGreen,
                                  ),
                                );
                              }
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
                        ))
                    .toList(),
              );
            },
            loading: () => const CircularProgressIndicator(
                color: AppColors.primaryRed),
            error: (e, _) => Text('Error: ${e.toString()}'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }
}
