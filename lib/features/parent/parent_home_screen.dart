import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/student_card.dart';
import '../../widgets/loading_overlay.dart';
import '../parent/calendar_screen.dart';
import '../parent/announcements_screen.dart';
import '../parent/parent_profile_screen.dart';
import '../../features/shared/message_thread_screen.dart';

class ParentHomeScreen extends ConsumerStatefulWidget {
  const ParentHomeScreen({super.key});

  @override
  ConsumerState<ParentHomeScreen> createState() => _ParentHomeScreenState();
}

class _ParentHomeScreenState extends ConsumerState<ParentHomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    _HomeTab(),
    CalendarScreen(embedded: true),
    AnnouncementsScreen(embedded: true),
    _MessagesTab(),
    ParentProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: DhammaAppBar(
        title: _appBarTitles[_currentIndex],
        showNotifications: _currentIndex != 4,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push(AppRoutes.registerStudent),
              icon: const Icon(Icons.add),
              label: const Text('Register Child'),
              backgroundColor: AppColors.primaryRed,
              foregroundColor: AppColors.white,
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month_outlined),
            activeIcon: Icon(Icons.calendar_month),
            label: 'Calendar',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.campaign_outlined),
            activeIcon: Icon(Icons.campaign),
            label: 'Notices',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.message_outlined),
            activeIcon: Icon(Icons.message),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outlined),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  static const List<String> _appBarTitles = [
    'Home',
    'Calendar',
    'Announcements',
    'Messages',
    'My Profile',
  ];
}

class _HomeTab extends ConsumerWidget {
  const _HomeTab();

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(userProfileProvider);
    final students = ref.watch(myStudentsProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(myStudentsProvider.future),
      color: AppColors.primaryRed,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.darkNavy,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _greeting(),
                    style: AppTextStyles.bodyMediumOnDark.copyWith(
                      color: AppColors.goldAmber,
                    ),
                  ),
                  const SizedBox(height: 4),
                  profile.when(
                    data: (user) => Text(
                      user?.displayName ?? 'Welcome',
                      style: AppTextStyles.displayLargeOnDark,
                    ),
                    loading: () => const CircularProgressIndicator(
                        color: AppColors.goldAmber),
                    error: (_, __) => Text(
                      'Welcome',
                      style: AppTextStyles.displayLargeOnDark,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // My Children section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text('My Children', style: AppTextStyles.headlineSmall),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () =>
                        context.push(AppRoutes.registerStudent),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryRed,
                    ),
                  ),
                ],
              ),
            ),

            students.when(
              data: (studentList) {
                if (studentList.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(
                          Icons.child_care_outlined,
                          size: 72,
                          color: AppColors.darkBrown.withAlpha(80),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No children registered yet',
                          style: AppTextStyles.headlineSmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Register your child to get started',
                          style: AppTextStyles.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: () =>
                              context.push(AppRoutes.registerStudent),
                          icon: const Icon(Icons.add),
                          label: const Text('Register Your Child'),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  children: studentList
                      .map((student) => StudentCard(
                            student: student,
                            onTap: () => context.push(
                              '/parent/student/${student.id}/status',
                            ),
                          ))
                      .toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                    child: CircularProgressIndicator(
                        color: AppColors.primaryRed)),
              ),
              error: (error, _) => Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  children: [
                    Text('Failed to load children',
                        style: AppTextStyles.bodyMedium),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () =>
                          ref.refresh(myStudentsProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

class _MessagesTab extends ConsumerWidget {
  const _MessagesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Load actual conversation list from conversationsProvider
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.message_outlined,
            size: 72,
            color: AppColors.darkBrown.withAlpha(80),
          ),
          const SizedBox(height: 16),
          Text('No messages yet', style: AppTextStyles.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Messages from teachers will appear here',
            style: AppTextStyles.bodyMedium,
          ),
        ],
      ),
    );
  }
}
