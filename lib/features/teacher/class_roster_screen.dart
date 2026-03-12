import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/student_card.dart';

class ClassRosterScreen extends ConsumerStatefulWidget {
  const ClassRosterScreen({super.key});

  @override
  ConsumerState<ClassRosterScreen> createState() => _ClassRosterScreenState();
}

class _ClassRosterScreenState extends ConsumerState<ClassRosterScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final myClassAsync = ref.watch(myClassProvider);

    return myClassAsync.when(
      data: (classData) {
        if (classData == null) {
          return Center(
            child: Text('No class assigned', style: AppTextStyles.bodyMedium),
          );
        }
        final classId = classData['id'] as String;
        return _RosterBody(classId: classId, searchQuery: _searchQuery,
            onSearchChanged: (q) => setState(() => _searchQuery = q));
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
    );
  }
}

class _RosterBody extends ConsumerWidget {
  final String classId;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;

  const _RosterBody({
    required this.classId,
    required this.searchQuery,
    required this.onSearchChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(classStudentsProvider(classId));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            onChanged: onSearchChanged,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Search students...',
            ),
          ),
        ),
        Expanded(
          child: studentsAsync.when(
            data: (students) {
              final filtered = searchQuery.isEmpty
                  ? students
                  : students
                      .where((s) => s.fullName
                          .toLowerCase()
                          .contains(searchQuery.toLowerCase()))
                      .toList();

              if (filtered.isEmpty) {
                return Center(
                  child: Text(
                    searchQuery.isEmpty
                        ? 'No students in this class'
                        : 'No students matching "$searchQuery"',
                    style: AppTextStyles.bodyMedium,
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () =>
                    ref.refresh(classStudentsProvider(classId).future),
                color: AppColors.primaryRed,
                child: ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (context, index) => StudentCard(
                    student: filtered[index],
                    showStatus: false,
                    onTap: () => context.push(
                        '/teacher/student/${filtered[index].id}'),
                  ),
                ),
              );
            },
            loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primaryRed)),
            error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
          ),
        ),
      ],
    );
  }
}
