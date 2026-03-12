import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/student_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/loading_overlay.dart';

class StudentManagementScreen extends ConsumerStatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  ConsumerState<StudentManagementScreen> createState() =>
      _StudentManagementScreenState();
}

class _StudentManagementScreenState
    extends ConsumerState<StudentManagementScreen> {
  String _searchQuery = '';
  StudentStatus? _statusFilter;
  bool _isExporting = false;

  Future<void> _exportCsv(List<StudentModel> students) async {
    setState(() => _isExporting = true);
    try {
      final rows = [
        [
          'First Name',
          'Last Name',
          'Preferred Name',
          'DOB',
          'Age',
          'Gender',
          'Class',
          'Status',
          'Has Allergies',
          'Allergy Notes',
          'Photo Consent',
          'Parent Name',
          'Parent Phone',
          'Registered'
        ],
        ...students.map((s) => [
              s.firstName,
              s.lastName,
              s.preferredName ?? '',
              AppDateUtils.toIsoDate(s.dob),
              s.age.toString(),
              s.gender ?? '',
              s.className ?? '',
              s.status.displayLabel,
              s.hasAllergies ? 'Yes' : 'No',
              s.allergyNotes ?? '',
              s.photoPublishConsent ? 'Yes' : 'No',
              s.parentName ?? '',
              s.parentPhone ?? '',
              AppDateUtils.formatDate(s.createdAt),
            ]),
      ];

      final csv = const ListToCsvConverter().convert(rows);
      final dir = await getTemporaryDirectory();
      final file = File(
          '${dir.path}/students_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(csv);

      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'Dhamma School Students Export',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    final studentsAsync = ref.watch(studentsProvider(schoolId));

    return LoadingStack(
      isLoading: _isExporting,
      message: 'Preparing CSV...',
      child: Column(
        children: [
          // Filter bar
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.white,
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() => _searchQuery = v),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search students by name...',
                  ),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All',
                        isSelected: _statusFilter == null,
                        onSelected: () =>
                            setState(() => _statusFilter = null),
                      ),
                      ...StudentStatus.values.map((s) => _FilterChip(
                            label: s.displayLabel,
                            isSelected: _statusFilter == s,
                            onSelected: () =>
                                setState(() => _statusFilter = s),
                          )),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: studentsAsync.when(
              data: (students) {
                var filtered = students;
                if (_searchQuery.isNotEmpty) {
                  filtered = filtered
                      .where((s) => s.fullName
                          .toLowerCase()
                          .contains(_searchQuery.toLowerCase()))
                      .toList();
                }
                if (_statusFilter != null) {
                  filtered = filtered
                      .where((s) => s.status == _statusFilter)
                      .toList();
                }

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          Text(
                            '${filtered.length} student${filtered.length != 1 ? 's' : ''}',
                            style: AppTextStyles.bodySmall,
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: () => _exportCsv(filtered),
                            icon: const Icon(Icons.download, size: 16),
                            label: const Text('Export CSV'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.darkNavy,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () =>
                            ref.refresh(studentsProvider(schoolId).future),
                        color: AppColors.primaryRed,
                        child: ListView.builder(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final student = filtered[index];
                            return Card(
                              margin:
                                  const EdgeInsets.symmetric(vertical: 4),
                              child: ListTile(
                                title: Text(student.fullName,
                                    style: AppTextStyles.bodyMedium.copyWith(
                                        fontWeight: FontWeight.w600)),
                                subtitle: Text(
                                  '${student.age} yrs · ${student.className ?? 'No class'}',
                                  style: AppTextStyles.bodySmall,
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    StatusBadge(
                                        status: student.status,
                                        compact: true),
                                    const SizedBox(width: 8),
                                    PopupMenuButton<String>(
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(
                                            value: 'active',
                                            child: Text('Set Active')),
                                        const PopupMenuItem(
                                            value: 'inactive',
                                            child: Text('Set Inactive')),
                                        const PopupMenuItem(
                                            value: 'dropped',
                                            child: Text('Set Dropped')),
                                      ],
                                      onSelected: (status) async {
                                        try {
                                          await ref
                                              .read(studentNotifierProvider
                                                  .notifier)
                                              .updateStatus(
                                                  student.id,
                                                  StudentStatus.fromString(
                                                      status));
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                    '${student.firstName} status updated'),
                                                backgroundColor:
                                                    AppColors.successGreen,
                                              ),
                                            );
                                          }
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                    'Error: ${e.toString()}'),
                                                backgroundColor:
                                                    AppColors.errorRed,
                                              ),
                                            );
                                          }
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                );
              },
              loading: () => const Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primaryRed)),
              error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onSelected(),
        selectedColor: AppColors.primaryRed.withAlpha(30),
        checkmarkColor: AppColors.primaryRed,
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primaryRed : AppColors.darkBrown,
          fontWeight:
              isSelected ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
    );
  }
}
