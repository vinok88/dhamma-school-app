import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/announcement_provider.dart';
import '../../widgets/announcement_card.dart';
import 'pending_registrations_screen.dart';
import 'student_management_screen.dart';
import 'teacher_management_screen.dart';
import 'class_management_screen.dart';
import 'event_management_screen.dart';
import 'reports_screen.dart';
import 'announcement_compose_screen.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  int _selectedIndex = 0;

  static const List<_NavItem> _navItems = [
    _NavItem(Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
    _NavItem(Icons.pending_actions_outlined, Icons.pending_actions,
        'Registrations'),
    _NavItem(Icons.people_outline, Icons.people, 'Students'),
    _NavItem(Icons.school_outlined, Icons.school, 'Teachers'),
    _NavItem(Icons.class_outlined, Icons.class_, 'Classes'),
    _NavItem(Icons.event_outlined, Icons.event, 'Events'),
    _NavItem(Icons.bar_chart_outlined, Icons.bar_chart, 'Reports'),
    _NavItem(Icons.campaign_outlined, Icons.campaign, 'Announce'),
  ];

  Widget get _currentScreen {
    switch (_selectedIndex) {
      case 0:
        return const _DashboardTab();
      case 1:
        return const PendingRegistrationsScreen();
      case 2:
        return const StudentManagementScreen();
      case 3:
        return const TeacherManagementScreen();
      case 4:
        return const ClassManagementScreen();
      case 5:
        return const EventManagementScreen();
      case 6:
        return const ReportsScreen();
      case 7:
        return const AnnouncementComposeScreen();
      default:
        return const _DashboardTab();
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 800;

        if (isWide) {
          return Scaffold(
            body: Row(
              children: [
                // Persistent NavigationRail
                NavigationRail(
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: (i) =>
                      setState(() => _selectedIndex = i),
                  labelType: NavigationRailLabelType.all,
                  backgroundColor: AppColors.darkNavy,
                  selectedIconTheme:
                      const IconThemeData(color: AppColors.goldAmber),
                  unselectedIconTheme:
                      const IconThemeData(color: AppColors.white),
                  selectedLabelTextStyle: AppTextStyles.labelMedium.copyWith(
                    color: AppColors.goldAmber,
                  ),
                  unselectedLabelTextStyle:
                      AppTextStyles.labelMedium.copyWith(color: AppColors.white),
                  leading: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Column(
                      children: [
                        const Icon(Icons.local_florist_outlined,
                            color: AppColors.goldAmber, size: 32),
                        const SizedBox(height: 4),
                        Text(
                          'Dhamma\nSchool',
                          style: AppTextStyles.labelMedium.copyWith(
                            color: AppColors.white,
                            fontSize: 10,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  destinations: _navItems
                      .map((item) => NavigationRailDestination(
                            icon: Icon(item.icon),
                            selectedIcon: Icon(item.activeIcon),
                            label: Text(item.label),
                          ))
                      .toList(),
                ),
                const VerticalDivider(width: 1),
                // Main content
                Expanded(child: _currentScreen),
              ],
            ),
          );
        } else {
          // Narrow: use Drawer
          return Scaffold(
            appBar: AppBar(
              backgroundColor: AppColors.darkNavy,
              title: Text(
                _navItems[_selectedIndex].label,
                style: AppTextStyles.headlineMediumOnDark,
              ),
              foregroundColor: AppColors.white,
            ),
            drawer: Drawer(
              backgroundColor: AppColors.darkNavy,
              child: ListView(
                children: [
                  DrawerHeader(
                    decoration:
                        const BoxDecoration(color: AppColors.darkNavy),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.local_florist_outlined,
                            color: AppColors.goldAmber, size: 48),
                        const SizedBox(height: 8),
                        Text('Dhamma School Admin',
                            style: AppTextStyles.headlineMediumOnDark,
                            textAlign: TextAlign.center),
                      ],
                    ),
                  ),
                  ..._navItems.asMap().entries.map((entry) {
                    final i = entry.key;
                    final item = entry.value;
                    return ListTile(
                      selected: _selectedIndex == i,
                      selectedTileColor: AppColors.goldAmber.withAlpha(30),
                      leading: Icon(
                        _selectedIndex == i ? item.activeIcon : item.icon,
                        color: _selectedIndex == i
                            ? AppColors.goldAmber
                            : AppColors.white,
                      ),
                      title: Text(
                        item.label,
                        style: TextStyle(
                          color: _selectedIndex == i
                              ? AppColors.goldAmber
                              : AppColors.white,
                        ),
                      ),
                      onTap: () {
                        setState(() => _selectedIndex = i);
                        Navigator.pop(context);
                      },
                    );
                  }),
                ],
              ),
            ),
            body: _currentScreen,
          );
        }
      },
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(this.icon, this.activeIcon, this.label);
}

class _DashboardTab extends ConsumerWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolId = ref.watch(currentSchoolIdProvider);

    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    final studentsAsync = ref.watch(studentsProvider(schoolId));
    final teachersAsync = ref.watch(teachersProvider(schoolId));
    final pendingStudentsAsync =
        ref.watch(pendingStudentsProvider(schoolId));
    final announcementsAsync = ref.watch(announcementsProvider(schoolId));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dashboard', style: AppTextStyles.displayLarge),
          const SizedBox(height: 4),
          Text(
            'Overview for ${AppDateUtils.formatDate(DateTime.now())}',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 24),

          // Summary cards row
          LayoutBuilder(
            builder: (context, constraints) {
              final cardWidth = (constraints.maxWidth - 48) / 2;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  _SummaryCard(
                    width: cardWidth,
                    title: 'Total Students',
                    value: studentsAsync.when(
                      data: (s) => s
                          .where((st) =>
                              st.status.name == 'active' ||
                              st.status.name == 'approved')
                          .length
                          .toString(),
                      loading: () => '...',
                      error: (_, __) => 'N/A',
                    ),
                    icon: Icons.people,
                    color: AppColors.darkNavy,
                    onTap: () {},
                  ),
                  _SummaryCard(
                    width: cardWidth,
                    title: 'Total Teachers',
                    value: teachersAsync.when(
                      data: (t) => t
                          .where((tc) => tc.status.name == 'active')
                          .length
                          .toString(),
                      loading: () => '...',
                      error: (_, __) => 'N/A',
                    ),
                    icon: Icons.school,
                    color: AppColors.darkBrown,
                    onTap: () {},
                  ),
                  _SummaryCard(
                    width: cardWidth,
                    title: 'Pending Approvals',
                    value: pendingStudentsAsync.when(
                      data: (p) => p.length.toString(),
                      loading: () => '...',
                      error: (_, __) => 'N/A',
                    ),
                    icon: Icons.pending_actions,
                    color: AppColors.pendingAmber,
                    onTap: () {},
                    badge: true,
                  ),
                  _SummaryCard(
                    width: cardWidth,
                    title: "Today's Attendance",
                    value: 'N/A',
                    // TODO: Calculate today's attendance rate across all classes
                    icon: Icons.fact_check,
                    color: AppColors.successGreen,
                    onTap: () {},
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 32),

          // Attendance trend chart
          Text('Attendance Trend (Last 8 Sundays)',
              style: AppTextStyles.headlineSmall),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    // TODO: Load real attendance data from attendance_records
                    gridData: const FlGridData(show: true),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 40,
                          getTitlesWidget: (v, _) => Text(
                            '${v.toInt()}%',
                            style: AppTextStyles.caption,
                          ),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (v, meta) {
                            final sundays = AppDateUtils.lastNSundays(8)
                                .reversed
                                .toList();
                            final i = v.toInt();
                            if (i < 0 || i >= sundays.length) {
                              return const SizedBox.shrink();
                            }
                            return Text(
                              AppDateUtils.formatDateShort(sundays[i]),
                              style: AppTextStyles.caption,
                            );
                          },
                        ),
                      ),
                      rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    lineBarsData: [
                      LineChartBarData(
                        // TODO: Replace with real data from attendance_records aggregated by session_date
                        spots: const [
                          FlSpot(0, 72),
                          FlSpot(1, 85),
                          FlSpot(2, 78),
                          FlSpot(3, 90),
                          FlSpot(4, 65),
                          FlSpot(5, 88),
                          FlSpot(6, 82),
                          FlSpot(7, 91),
                        ],
                        isCurved: true,
                        color: AppColors.primaryRed,
                        barWidth: 3,
                        dotData: const FlDotData(show: true),
                        belowBarData: BarAreaData(
                          show: true,
                          color: AppColors.primaryRed.withAlpha(30),
                        ),
                      ),
                    ],
                    minY: 0,
                    maxY: 100,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Recent Announcements
          Row(
            children: [
              Text('Recent Announcements',
                  style: AppTextStyles.headlineSmall),
              const Spacer(),
              TextButton(
                onPressed: () {},
                child: const Text('View All'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          announcementsAsync.when(
            data: (announcements) => Column(
              children: announcements
                  .take(5)
                  .map((a) => AnnouncementCard(announcement: a))
                  .toList(),
            ),
            loading: () => const CircularProgressIndicator(
                color: AppColors.primaryRed),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final double width;
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool badge;

  const _SummaryCard({
    required this.width,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
    this.badge = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: color.withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    if (badge && value != '0' && value != '...' && value != 'N/A') ...[
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.errorRed,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.priority_high,
                            size: 12, color: Colors.white),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  value,
                  style: AppTextStyles.displayLarge.copyWith(color: color),
                ),
                const SizedBox(height: 4),
                Text(title, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
