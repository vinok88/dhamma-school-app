import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/class_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/class_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/loading_overlay.dart';

class ClassManagementScreen extends ConsumerWidget {
  const ClassManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    final classesAsync = ref.watch(classesProvider(schoolId));

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateClassDialog(context, ref, schoolId),
        icon: const Icon(Icons.add),
        label: const Text('Create Class'),
      ),
      body: classesAsync.when(
        data: (classes) {
          if (classes.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.class_outlined,
                      size: 72, color: AppColors.darkBrown),
                  const SizedBox(height: 16),
                  Text('No classes yet', style: AppTextStyles.headlineSmall),
                  const SizedBox(height: 8),
                  FilledButton.icon(
                    onPressed: () =>
                        _showCreateClassDialog(context, ref, schoolId),
                    icon: const Icon(Icons.add),
                    label: const Text('Create First Class'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(classesProvider(schoolId).future),
            color: AppColors.primaryRed,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: classes.length,
              itemBuilder: (context, index) => _ClassCard(
                classModel: classes[index],
                schoolId: schoolId,
              ),
            ),
          );
        },
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
      ),
    );
  }

  void _showCreateClassDialog(
      BuildContext context, WidgetRef ref, String schoolId) {
    showDialog(
      context: context,
      builder: (context) =>
          _CreateClassDialog(schoolId: schoolId),
    );
  }
}

class _ClassCard extends ConsumerWidget {
  final ClassModel classModel;
  final String schoolId;

  const _ClassCard({required this.classModel, required this.schoolId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.class_, color: AppColors.darkNavy),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(classModel.name,
                          style: AppTextStyles.headlineSmall),
                      if (classModel.gradeLevel != null)
                        Text(classModel.gradeLevel!,
                            style: AppTextStyles.bodySmall),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                        value: 'students',
                        child: Text('Manage Students')),
                    const PopupMenuItem(
                        value: 'delete', child: Text('Delete Class')),
                  ],
                  onSelected: (action) {
                    if (action == 'students') {
                      _showStudentAssignment(context, ref, classModel.id);
                    } else if (action == 'delete') {
                      _confirmDelete(context, ref, classModel.id);
                    }
                  },
                ),
              ],
            ),
            const Divider(height: 16),
            Row(
              children: [
                Expanded(
                  child: _InfoItem(
                    icon: Icons.person_outline,
                    label: 'Teacher',
                    value: classModel.teacherName ?? 'Unassigned',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentAssignment(
      BuildContext context, WidgetRef ref, String classId) {
    // TODO: Replace with checkbox-based student assignment
    // Currently shows a simple list with students not in this class
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manage Students'),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: _StudentAssignmentList(
              classId: classId, schoolId: schoolId),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, String classId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Class'),
        content: const Text(
            'Are you sure? This will unassign all students from this class.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref
                    .read(classNotifierProvider.notifier)
                    .deleteClass(classId);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Class deleted'),
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
            },
            style:
                FilledButton.styleFrom(backgroundColor: AppColors.errorRed),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _StudentAssignmentList extends ConsumerWidget {
  final String classId;
  final String schoolId;

  const _StudentAssignmentList(
      {required this.classId, required this.schoolId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsProvider(schoolId));
    return studentsAsync.when(
      data: (students) {
        final approved = students
            .where((s) =>
                s.status == StudentStatus.approved ||
                s.status == StudentStatus.active)
            .toList();
        return ListView.builder(
          itemCount: approved.length,
          itemBuilder: (context, i) {
            final student = approved[i];
            final isInClass = student.classId == classId;
            return ListTile(
              title: Text(student.fullName),
              subtitle: Text(student.className ?? 'No class'),
              trailing: TextButton(
                onPressed: () async {
                  try {
                    await ref
                        .read(classNotifierProvider.notifier)
                        .assignStudent(student.id, classId);
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
                child: Text(isInClass ? 'Assigned' : 'Assign'),
              ),
            );
          },
        );
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Text('Error: ${e.toString()}'),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.darkBrown),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTextStyles.caption),
            Text(value, style: AppTextStyles.bodySmall),
          ],
        ),
      ],
    );
  }
}

class _CreateClassDialog extends ConsumerStatefulWidget {
  final String schoolId;
  const _CreateClassDialog({required this.schoolId});

  @override
  ConsumerState<_CreateClassDialog> createState() =>
      _CreateClassDialogState();
}

class _CreateClassDialogState extends ConsumerState<_CreateClassDialog> {
  final _nameCtrl = TextEditingController();
  final _gradeCtrl = TextEditingController();
  String? _selectedTeacherId;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _gradeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final teachersAsync = ref.watch(teachersProvider(widget.schoolId));

    return AlertDialog(
      title: const Text('Create Class'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Class Name *'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _gradeCtrl,
            decoration: const InputDecoration(labelText: 'Grade Level'),
          ),
          const SizedBox(height: 12),
          teachersAsync.when(
            data: (teachers) => DropdownButtonFormField<String>(
              value: _selectedTeacherId,
              decoration: const InputDecoration(labelText: 'Assign Teacher'),
              items: teachers
                  .map((t) => DropdownMenuItem(
                        value: t.id,
                        child: Text(t.displayName),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _selectedTeacherId = v),
            ),
            loading: () => const CircularProgressIndicator(
                color: AppColors.primaryRed),
            error: (_, __) => const Text('Could not load teachers'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isLoading
              ? null
              : () async {
                  if (_nameCtrl.text.trim().isEmpty) return;
                  setState(() => _isLoading = true);
                  try {
                    await ref
                        .read(classNotifierProvider.notifier)
                        .createClass({
                      'school_id': widget.schoolId,
                      'name': _nameCtrl.text.trim(),
                      'grade_level': _gradeCtrl.text.trim().isEmpty
                          ? null
                          : _gradeCtrl.text.trim(),
                      'teacher_id': _selectedTeacherId,
                      'created_at': DateTime.now().toIso8601String(),
                    });
                    if (context.mounted) Navigator.pop(context);
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error: ${e.toString()}'),
                          backgroundColor: AppColors.errorRed,
                        ),
                      );
                    }
                  } finally {
                    if (mounted) setState(() => _isLoading = false);
                  }
                },
          child: const Text('Create'),
        ),
      ],
    );
  }
}
