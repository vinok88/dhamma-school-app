import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/student_model.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/class_provider.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/loading_overlay.dart';

class PendingRegistrationsScreen extends ConsumerStatefulWidget {
  const PendingRegistrationsScreen({super.key});

  @override
  ConsumerState<PendingRegistrationsScreen> createState() =>
      _PendingRegistrationsScreenState();
}

class _PendingRegistrationsScreenState
    extends ConsumerState<PendingRegistrationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final schoolId = ref.watch(currentSchoolIdProvider);

    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      body: Column(
        children: [
          Container(
            color: AppColors.white,
            child: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Students'),
                Tab(text: 'Teachers'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _PendingStudentsTab(schoolId: schoolId),
                _PendingTeachersTab(schoolId: schoolId),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingStudentsTab extends ConsumerWidget {
  final String schoolId;
  const _PendingStudentsTab({required this.schoolId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingStudentsProvider(schoolId));

    return pendingAsync.when(
      data: (students) {
        if (students.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline,
                    size: 72, color: AppColors.successGreen),
                const SizedBox(height: 16),
                Text('No pending student registrations',
                    style: AppTextStyles.headlineSmall),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () =>
              ref.refresh(pendingStudentsProvider(schoolId).future),
          color: AppColors.primaryRed,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            itemBuilder: (context, index) =>
                _StudentRegistrationCard(student: students[index]),
          ),
        );
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
    );
  }
}

class _StudentRegistrationCard extends ConsumerStatefulWidget {
  final StudentModel student;
  const _StudentRegistrationCard({required this.student});

  @override
  ConsumerState<_StudentRegistrationCard> createState() =>
      _StudentRegistrationCardState();
}

class _StudentRegistrationCardState
    extends ConsumerState<_StudentRegistrationCard> {
  bool _isLoading = false;
  final _rejectReasonCtrl = TextEditingController();
  bool _showRejectForm = false;
  String? _selectedClassId;

  @override
  void dispose() {
    _rejectReasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _approve() async {
    // Show class assignment dialog
    final schoolId = ref.read(currentSchoolIdProvider);
    if (schoolId == null) return;

    final classesAsync = ref.read(classesProvider(schoolId));
    final classes = classesAsync.valueOrNull ?? [];

    if (classes.isNotEmpty) {
      final classId = await showDialog<String>(
        context: context,
        builder: (context) => _ClassAssignmentDialog(classes: classes),
      );
      if (classId == null) return; // Dialog cancelled
      setState(() => _selectedClassId = classId);
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(studentNotifierProvider.notifier).approveStudent(
            widget.student.id,
            classId: _selectedClassId,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.student.fullName} approved!'),
            backgroundColor: AppColors.successGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
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
  }

  Future<void> _reject() async {
    if (_rejectReasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please provide a rejection reason'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(studentNotifierProvider.notifier).rejectStudent(
            widget.student.id,
            _rejectReasonCtrl.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.student.fullName} rejected'),
            backgroundColor: AppColors.pendingAmber,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
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
  }

  @override
  Widget build(BuildContext context) {
    return LoadingStack(
      isLoading: _isLoading,
      child: Card(
        margin: const EdgeInsets.only(bottom: 16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  NetworkPhotoWidget(imageUrl: widget.student.photoUrl, size: 64),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.student.fullName,
                            style: AppTextStyles.headlineSmall),
                        Text(
                          '${widget.student.age} years old · DOB: ${AppDateUtils.formatDate(widget.student.dob)}',
                          style: AppTextStyles.bodySmall,
                        ),
                        if (widget.student.gender != null)
                          Text(widget.student.gender!,
                              style: AppTextStyles.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              if (widget.student.parentName != null)
                _InfoRow('Parent', widget.student.parentName!),
              if (widget.student.parentPhone != null)
                _InfoRow('Phone', widget.student.parentPhone!),
              if (widget.student.hasAllergies) ...[
                _InfoRow(
                  'Allergies',
                  widget.student.allergyNotes ?? 'Yes',
                  isWarning: true,
                ),
              ] else
                _InfoRow('Allergies', 'None'),
              _InfoRow(
                'Photo Consent',
                widget.student.photoPublishConsent ? 'Yes' : 'No',
              ),
              const Divider(height: 20),
              if (_showRejectForm) ...[
                TextField(
                  controller: _rejectReasonCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Rejection Reason *',
                    hintText:
                        'Please provide a reason visible to the parent...',
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          setState(() => _showRejectForm = !_showRejectForm),
                      icon: Icon(_showRejectForm ? Icons.close : Icons.close),
                      label: Text(_showRejectForm ? 'Cancel' : 'Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.errorRed,
                        side: const BorderSide(color: AppColors.errorRed),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _showRejectForm
                        ? FilledButton.icon(
                            onPressed: _reject,
                            icon: const Icon(Icons.send),
                            label: const Text('Confirm Reject'),
                            style: FilledButton.styleFrom(
                                backgroundColor: AppColors.errorRed),
                          )
                        : FilledButton.icon(
                            onPressed: _approve,
                            icon: const Icon(Icons.check),
                            label: const Text('Approve'),
                            style: FilledButton.styleFrom(
                                backgroundColor: AppColors.successGreen),
                          ),
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

class _ClassAssignmentDialog extends StatefulWidget {
  final List<dynamic> classes;
  const _ClassAssignmentDialog({required this.classes});

  @override
  State<_ClassAssignmentDialog> createState() => _ClassAssignmentDialogState();
}

class _ClassAssignmentDialogState extends State<_ClassAssignmentDialog> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Assign to Class'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: widget.classes.map((c) {
          return RadioListTile<String>(
            title: Text(c.name ?? c['name'] ?? 'Unknown'),
            value: c.id ?? c['id'] ?? '',
            groupValue: _selected,
            onChanged: (v) => setState(() => _selected = v),
            activeColor: AppColors.primaryRed,
          );
        }).toList(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Skip for now'),
        ),
        FilledButton(
          onPressed: _selected != null
              ? () => Navigator.pop(context, _selected)
              : null,
          child: const Text('Assign'),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isWarning;

  const _InfoRow(this.label, this.value, {this.isWarning = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: AppTextStyles.bodySmall
                    .copyWith(fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodySmall.copyWith(
                color: isWarning ? AppColors.pendingAmber : null,
                fontWeight: isWarning ? FontWeight.w600 : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingTeachersTab extends ConsumerWidget {
  final String schoolId;
  const _PendingTeachersTab({required this.schoolId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingTeachersProvider(schoolId));

    return pendingAsync.when(
      data: (teachers) {
        if (teachers.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline,
                    size: 72, color: AppColors.successGreen),
                const SizedBox(height: 16),
                Text('No pending teacher registrations',
                    style: AppTextStyles.headlineSmall),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: teachers.length,
          itemBuilder: (context, index) =>
              _TeacherRegistrationCard(teacher: teachers[index]),
        );
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
    );
  }
}

class _TeacherRegistrationCard extends ConsumerStatefulWidget {
  final UserModel teacher;
  const _TeacherRegistrationCard({required this.teacher});

  @override
  ConsumerState<_TeacherRegistrationCard> createState() =>
      _TeacherRegistrationCardState();
}

class _TeacherRegistrationCardState
    extends ConsumerState<_TeacherRegistrationCard> {
  bool _isLoading = false;
  final _rejectReasonCtrl = TextEditingController();
  bool _showRejectForm = false;

  @override
  void dispose() {
    _rejectReasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LoadingStack(
      isLoading: _isLoading,
      child: Card(
        margin: const EdgeInsets.only(bottom: 16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  NetworkPhotoWidget(
                      imageUrl: widget.teacher.profilePhotoUrl,
                      size: 64,
                      isCircle: true),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.teacher.displayName,
                            style: AppTextStyles.headlineSmall),
                        if (widget.teacher.phone != null)
                          Text(widget.teacher.phone!,
                              style: AppTextStyles.bodySmall),
                        Text(
                          'Registered: ${AppDateUtils.formatDate(widget.teacher.createdAt)}',
                          style: AppTextStyles.caption,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (widget.teacher.address != null) ...[
                const Divider(height: 16),
                _InfoRow('Address', widget.teacher.address!),
              ],
              const Divider(height: 16),
              if (_showRejectForm) ...[
                TextField(
                  controller: _rejectReasonCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Rejection Reason *',
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          setState(() => _showRejectForm = !_showRejectForm),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.errorRed,
                        side: const BorderSide(color: AppColors.errorRed),
                      ),
                      child: Text(_showRejectForm ? 'Cancel' : 'Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () async {
                        setState(() => _isLoading = true);
                        try {
                          if (_showRejectForm) {
                            await ref
                                .read(teacherNotifierProvider.notifier)
                                .rejectTeacher(widget.teacher.id,
                                    _rejectReasonCtrl.text.trim());
                          } else {
                            await ref
                                .read(teacherNotifierProvider.notifier)
                                .approveTeacher(widget.teacher.id);
                          }
                        } finally {
                          if (mounted) setState(() => _isLoading = false);
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: _showRejectForm
                            ? AppColors.errorRed
                            : AppColors.successGreen,
                      ),
                      child: Text(
                          _showRejectForm ? 'Confirm Reject' : 'Approve'),
                    ),
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
