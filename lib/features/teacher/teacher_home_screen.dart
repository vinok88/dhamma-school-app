import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/announcement_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/announcement_card.dart';
import '../teacher/attendance_screen.dart';
import '../teacher/class_roster_screen.dart';
import '../teacher/send_announcement_screen.dart';
import '../teacher/teacher_profile_screen.dart';

class TeacherHomeScreen extends ConsumerStatefulWidget {
  const TeacherHomeScreen({super.key});

  @override
  ConsumerState<TeacherHomeScreen> createState() => _TeacherHomeScreenState();
}

class _TeacherHomeScreenState extends ConsumerState<TeacherHomeScreen> {
  int _currentIndex = 0;

  static const List<String> _titles = [
    'Home',
    'Attendance',
    'My Class',
    'Announce',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    final tabs = [
      const _TeacherHomeTab(),
      const AttendanceScreen(),
      const ClassRosterScreen(),
      const SendAnnouncementScreen(),
      const TeacherProfileScreen(),
    ];

    return Scaffold(
      appBar: DhammaAppBar(
        title: _titles[_currentIndex],
        showNotifications: _currentIndex != 4,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home'),
          BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_outlined),
              activeIcon: Icon(Icons.fact_check),
              label: 'Attendance'),
          BottomNavigationBarItem(
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups),
              label: 'Class'),
          BottomNavigationBarItem(
              icon: Icon(Icons.campaign_outlined),
              activeIcon: Icon(Icons.campaign),
              label: 'Announce'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outlined),
              activeIcon: Icon(Icons.person),
              label: 'Profile'),
        ],
      ),
    );
  }
}

class _TeacherHomeTab extends ConsumerWidget {
  const _TeacherHomeTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(userProfileProvider);
    final myClass = ref.watch(myClassProvider);
    final schoolId = ref.watch(currentSchoolIdProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(myClassProvider);
      },
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
              color: AppColors.darkNavy,
              child: profile.when(
                data: (user) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppDateUtils.formatDayOfWeek(DateTime.now()),
                      style: AppTextStyles.bodyMediumOnDark
                          .copyWith(color: AppColors.goldAmber),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Welcome, ${user?.displayName ?? 'Teacher'}',
                      style: AppTextStyles.displayLargeOnDark,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      AppDateUtils.formatDate(DateTime.now()),
                      style: AppTextStyles.bodyMediumOnDark,
                    ),
                  ],
                ),
                loading: () =>
                    const CircularProgressIndicator(color: AppColors.goldAmber),
                error: (_, __) => Text('Welcome',
                    style: AppTextStyles.displayLargeOnDark),
              ),
            ),

            const SizedBox(height: 16),

            // Class info card
            myClass.when(
              data: (classData) {
                if (classData == null) {
                  return Padding(
                    padding: const EdgeInsets.all(16),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const Icon(Icons.hourglass_empty,
                                size: 48,
                                color: AppColors.pendingAmber),
                            const SizedBox(height: 12),
                            Text('Awaiting Class Assignment',
                                style: AppTextStyles.headlineSmall,
                                textAlign: TextAlign.center),
                            const SizedBox(height: 8),
                            Text(
                              'The Principal will assign you to a class soon.',
                              style: AppTextStyles.bodySmall,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }

                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Card(
                    child: ListTile(
                      leading: const Icon(Icons.school,
                          color: AppColors.darkNavy, size: 36),
                      title: Text(classData['name'] as String? ?? 'My Class',
                          style: AppTextStyles.headlineSmall),
                      subtitle: Text(
                          '${classData['grade_level'] ?? 'Dhamma Class'}',
                          style: AppTextStyles.bodySmall),
                      trailing: FilledButton(
                        onPressed: () => context.push(AppRoutes.teacherAttendance),
                        child: const Text('Take Attendance'),
                      ),
                    ),
                  ),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                    child: CircularProgressIndicator(
                        color: AppColors.primaryRed)),
              ),
              error: (_, __) => const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Error loading class data'),
              ),
            ),

            const SizedBox(height: 16),

            // Recent Announcements
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('Recent Announcements',
                  style: AppTextStyles.headlineSmall),
            ),
            const SizedBox(height: 8),
            if (schoolId != null)
              ref.watch(announcementsProvider(schoolId)).when(
                    data: (announcements) => Column(
                      children: announcements
                          .take(3)
                          .map((a) => AnnouncementCard(announcement: a))
                          .toList(),
                    ),
                    loading: () => const Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(
                          color: AppColors.primaryRed),
                    ),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}
