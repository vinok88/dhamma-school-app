/// Demo entry point — no Supabase / Firebase required.
/// Run with:
///   flutter run -t lib/main_demo.dart -d chrome
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';

import 'core/theme/app_colors.dart';
import 'demo/mock_data.dart';
import 'models/announcement_model.dart';
import 'models/attendance_model.dart';
import 'models/event_model.dart';
import 'models/student_model.dart';
import 'models/user_model.dart';

void main() {
  runApp(const DemoApp());
}

// ═══════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════

class DemoApp extends StatelessWidget {
  const DemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dhamma School — Demo',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      home: const DemoLauncher(),
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primaryRed,
        primary: AppColors.primaryRed,
        secondary: AppColors.goldAmber,
        surface: AppColors.white,
        onPrimary: AppColors.white,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkNavy,
        foregroundColor: AppColors.white,
        elevation: 0,
        titleTextStyle: GoogleFonts.dmSerifDisplay(
          color: AppColors.white,
          fontSize: 20,
          fontWeight: FontWeight.w400,
        ),
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.dmSerifDisplay(
            fontSize: 28, color: AppColors.darkBrown),
        headlineMedium: GoogleFonts.dmSerifDisplay(
            fontSize: 22, color: AppColors.darkBrown),
        headlineSmall: GoogleFonts.dmSerifDisplay(
            fontSize: 18, color: AppColors.darkBrown),
        bodyLarge:
            GoogleFonts.workSans(fontSize: 16, color: AppColors.darkBrown),
        bodyMedium:
            GoogleFonts.workSans(fontSize: 14, color: AppColors.darkBrown),
        labelLarge: GoogleFonts.workSans(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.darkBrown),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryRed,
          foregroundColor: AppColors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.workSans(
              fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkBrown,
          side: const BorderSide(color: AppColors.darkBrown),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.creamYellow),
        ),
      ),
      scaffoldBackgroundColor: AppColors.creamYellow,
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.white,
        selectedItemColor: AppColors.primaryRed,
        unselectedItemColor: AppColors.darkBrown,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO LAUNCHER  (role selector)
// ═══════════════════════════════════════════════════════════════════════════

class DemoLauncher extends StatelessWidget {
  const DemoLauncher({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkNavy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 48),
              // Logo block
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.goldAmber.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.goldAmber.withOpacity(0.4), width: 2),
                ),
                child: const Icon(Icons.spa,
                    size: 40, color: AppColors.goldAmber),
              ),
              const SizedBox(height: 20),
              Text(
                'Dhamma School',
                style: GoogleFonts.dmSerifDisplay(
                    fontSize: 30, color: AppColors.white),
              ),
              Text(
                'Mahamevnawa · Melbourne',
                style: GoogleFonts.workSans(
                    fontSize: 14,
                    color: AppColors.white.withOpacity(0.6)),
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.goldAmber.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '✦  DEMO MODE  ✦',
                  style: GoogleFonts.workSans(
                      fontSize: 11,
                      color: AppColors.goldAmber,
                      letterSpacing: 2),
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'View as…',
                style: GoogleFonts.workSans(
                    fontSize: 13,
                    color: AppColors.white.withOpacity(0.5),
                    letterSpacing: 1.5),
              ),
              const SizedBox(height: 16),
              _RoleCard(
                icon: Icons.family_restroom,
                label: 'Parent',
                subtitle: 'Register children, view events & announcements',
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            const DemoParentHome())),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.school,
                label: 'Teacher',
                subtitle: 'Mark attendance, manage your class',
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            const DemoTeacherHome())),
              ),
              const SizedBox(height: 12),
              _RoleCard(
                icon: Icons.admin_panel_settings,
                label: 'Principal / Admin',
                subtitle: 'Dashboard, approvals, reports & events',
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            const DemoAdminHome())),
              ),
              const SizedBox(height: 24),
              // Login screen preview button
              TextButton.icon(
                onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const DemoLoginScreen())),
                icon: const Icon(Icons.login,
                    color: AppColors.goldAmber, size: 16),
                label: Text(
                  'Preview Login Screen',
                  style: GoogleFonts.workSans(
                      color: AppColors.goldAmber, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  const _RoleCard(
      {required this.icon,
      required this.label,
      required this.subtitle,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white.withOpacity(0.07),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: AppColors.white.withOpacity(0.15)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primaryRed.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon,
                    color: AppColors.primaryRed, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: GoogleFonts.dmSerifDisplay(
                            fontSize: 17, color: AppColors.white)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: GoogleFonts.workSans(
                            fontSize: 12,
                            color: AppColors.white.withOpacity(0.55))),
                  ],
                ),
              ),
              Icon(Icons.chevron_right,
                  color: AppColors.white.withOpacity(0.4)),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

class DemoLoginScreen extends StatelessWidget {
  const DemoLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkNavy,
      body: Column(
        children: [
          // Top half — dark navy with logo
          Expanded(
            child: SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: AppColors.goldAmber.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: AppColors.goldAmber.withOpacity(0.4),
                          width: 2),
                    ),
                    child: const Icon(Icons.spa,
                        size: 44, color: AppColors.goldAmber),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Dhamma School',
                    style: GoogleFonts.dmSerifDisplay(
                        fontSize: 32, color: AppColors.white),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Mahamevnawa · Melbourne',
                    style: GoogleFonts.workSans(
                        fontSize: 14,
                        color: AppColors.white.withOpacity(0.55)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'ධම්ම පාසල · මහාමේඝවන',
                    style: GoogleFonts.workSans(
                        fontSize: 13,
                        color: AppColors.goldAmber.withOpacity(0.8)),
                  ),
                ],
              ),
            ),
          ),

          // Bottom sheet — cream
          Container(
            decoration: const BoxDecoration(
              color: AppColors.creamYellow,
              borderRadius:
                  BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(28, 32, 28, 40),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.darkBrown.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Sign in to continue',
                    style: GoogleFonts.dmSerifDisplay(
                        fontSize: 22, color: AppColors.darkBrown)),
                const SizedBox(height: 24),
                _SocialButton(
                  icon: Icons.g_mobiledata,
                  label: 'Continue with Google',
                  color: const Color(0xFF4285F4),
                  onTap: () {},
                ),
                const SizedBox(height: 12),
                _SocialButton(
                  icon: Icons.apple,
                  label: 'Continue with Apple',
                  color: AppColors.darkBrown,
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                Text(
                  'By signing in you agree to our Privacy Policy.\nStudent data is protected in accordance with the Australian Privacy Act.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.workSans(
                      fontSize: 11,
                      color: AppColors.darkBrown.withOpacity(0.5)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _SocialButton(
      {required this.icon,
      required this.label,
      required this.color,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: color, size: 22),
        label: Text(label,
            style: GoogleFonts.workSans(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.darkBrown)),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: BorderSide(color: color.withOpacity(0.4)),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)),
          backgroundColor: AppColors.white,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PARENT DEMO HOME
// ═══════════════════════════════════════════════════════════════════════════

class DemoParentHome extends StatefulWidget {
  const DemoParentHome({super.key});
  @override
  State<DemoParentHome> createState() => _DemoParentHomeState();
}

class _DemoParentHomeState extends State<DemoParentHome> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      _ParentDashTab(user: mockParent, students: mockMyStudents),
      _ParentCalendarTab(events: mockEvents),
      _AnnouncementsTab(announcements: mockAnnouncements),
      _ParentProfileTab(user: mockParent),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dhamma School'),
        actions: [
          Stack(
            children: [
              IconButton(
                  icon: const Icon(Icons.notifications_none),
                  onPressed: () {}),
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                      color: AppColors.primaryRed,
                      shape: BoxShape.circle),
                ),
              ),
            ],
          ),
        ],
      ),
      body: tabs[_tab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home'),
          BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_outlined),
              activeIcon: Icon(Icons.calendar_today),
              label: 'Calendar'),
          BottomNavigationBarItem(
              icon: Icon(Icons.campaign_outlined),
              activeIcon: Icon(Icons.campaign),
              label: 'Notices'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile'),
        ],
      ),
      floatingActionButton: _tab == 0
          ? FloatingActionButton.extended(
              onPressed: () => _showRegisterSnack(context),
              backgroundColor: AppColors.primaryRed,
              icon: const Icon(Icons.add, color: Colors.white),
              label: Text('Register Child',
                  style: GoogleFonts.workSans(
                      color: Colors.white,
                      fontWeight: FontWeight.w600)),
            )
          : null,
    );
  }

  void _showRegisterSnack(BuildContext ctx) {
    ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
      content: Text('Registration form would open here in the live app.'),
      backgroundColor: AppColors.darkNavy,
    ));
  }
}

class _ParentDashTab extends StatelessWidget {
  final UserModel user;
  final List<StudentModel> students;
  const _ParentDashTab({required this.user, required this.students});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Greeting card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.darkNavy, Color(0xFF0A3880)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Good morning,',
                        style: GoogleFonts.workSans(
                            color: Colors.white60, fontSize: 13)),
                    Text(user.displayName,
                        style: GoogleFonts.dmSerifDisplay(
                            color: Colors.white, fontSize: 22)),
                    const SizedBox(height: 6),
                    Text('Sunday Session · ${DateFormat('d MMM y').format(DateTime.now())}',
                        style: GoogleFonts.workSans(
                            color: AppColors.goldAmber, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.spa, color: AppColors.goldAmber, size: 40),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text('My Children',
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        ...students.map((s) => _StudentStatusCard(student: s)),
        const SizedBox(height: 80),
      ],
    );
  }
}

class _StudentStatusCard extends StatelessWidget {
  final StudentModel student;
  const _StudentStatusCard({required this.student});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            _PhotoPlaceholder(name: student.firstName, size: 52),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student.fullName,
                      style: GoogleFonts.dmSerifDisplay(fontSize: 16)),
                  Text(
                      '${student.className ?? 'Unassigned'} · Age ${student.age}',
                      style: GoogleFonts.workSans(
                          fontSize: 13,
                          color: AppColors.darkBrown.withOpacity(0.6))),
                  if (student.hasAllergies)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber,
                              size: 13, color: AppColors.pendingAmber),
                          const SizedBox(width: 4),
                          Text('Allergy noted',
                              style: GoogleFonts.workSans(
                                  fontSize: 11,
                                  color: AppColors.pendingAmber)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            _StatusBadge(status: student.status),
          ],
        ),
      ),
    );
  }
}

class _ParentCalendarTab extends StatefulWidget {
  final List<EventModel> events;
  const _ParentCalendarTab({required this.events});
  @override
  State<_ParentCalendarTab> createState() => _ParentCalendarTabState();
}

class _ParentCalendarTabState extends State<_ParentCalendarTab> {
  DateTime _focused = DateTime.now();
  DateTime _selected = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final dayEvents = widget.events
        .where((e) => isSameDay(e.startDatetime, _selected))
        .toList();

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.all(12),
          child: TableCalendar(
            firstDay: DateTime.utc(2024),
            lastDay: DateTime.utc(2027),
            focusedDay: _focused,
            selectedDayPredicate: (d) => isSameDay(d, _selected),
            onDaySelected: (sel, foc) =>
                setState(() { _selected = sel; _focused = foc; }),
            eventLoader: (day) =>
                widget.events.where((e) => isSameDay(e.startDatetime, day)).toList(),
            calendarStyle: CalendarStyle(
              selectedDecoration: const BoxDecoration(
                  color: AppColors.primaryRed, shape: BoxShape.circle),
              todayDecoration: BoxDecoration(
                  color: AppColors.goldAmber.withOpacity(0.4),
                  shape: BoxShape.circle),
              markerDecoration: const BoxDecoration(
                  color: AppColors.darkNavy, shape: BoxShape.circle),
            ),
            headerStyle: HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
              titleTextStyle: GoogleFonts.dmSerifDisplay(fontSize: 17),
            ),
          ),
        ),
        Expanded(
          child: dayEvents.isEmpty
              ? Center(
                  child: Text('No events on this day',
                      style: GoogleFonts.workSans(
                          color: AppColors.darkBrown.withOpacity(0.4))))
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: dayEvents.map((e) => _EventCard(event: e)).toList(),
                ),
        ),
      ],
    );
  }
}

class _AnnouncementsTab extends StatelessWidget {
  final List<AnnouncementModel> announcements;
  const _AnnouncementsTab({required this.announcements});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Announcements',
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        ...announcements.map((a) => _AnnouncementCard(announcement: a)),
      ],
    );
  }
}

class _ParentProfileTab extends StatelessWidget {
  final UserModel user;
  const _ParentProfileTab({required this.user});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              _PhotoPlaceholder(name: user.displayName, size: 80),
              const SizedBox(height: 12),
              Text(user.displayName,
                  style: Theme.of(context).textTheme.headlineMedium),
              Text(user.email ?? '',
                  style: GoogleFonts.workSans(
                      color: AppColors.darkBrown.withOpacity(0.5))),
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.successGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Parent · Active',
                    style: GoogleFonts.workSans(
                        color: AppColors.successGreen, fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _ProfileRow(Icons.phone, 'Phone', user.phone ?? '—'),
        _ProfileRow(Icons.location_on, 'Address', user.address ?? '—'),
        const Divider(height: 32),
        Text('Language / භාෂාව',
            style: GoogleFonts.workSans(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'en', label: Text('English')),
            ButtonSegment(value: 'si', label: Text('සිංහල')),
          ],
          selected: const {'en'},
          onSelectionChanged: (_) {},
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.logout),
          label: const Text('Sign Out'),
        ),
      ],
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _ProfileRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primaryRed),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.workSans(
                        fontSize: 11,
                        color: AppColors.darkBrown.withOpacity(0.5))),
                Text(value,
                    style: GoogleFonts.workSans(fontSize: 14)),
              ],
            ),
          ),
          Icon(Icons.edit_outlined,
              size: 16, color: AppColors.darkBrown.withOpacity(0.3)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER DEMO HOME
// ═══════════════════════════════════════════════════════════════════════════

class DemoTeacherHome extends StatefulWidget {
  const DemoTeacherHome({super.key});
  @override
  State<DemoTeacherHome> createState() => _DemoTeacherHomeState();
}

class _DemoTeacherHomeState extends State<DemoTeacherHome> {
  int _tab = 0;
  late List<AttendanceModel> _attendance;

  @override
  void initState() {
    super.initState();
    _attendance = List.from(mockAttendance);
  }

  void _toggleStatus(int index) {
    setState(() {
      final current = _attendance[index].status;
      AttendanceStatus next;
      if (current == AttendanceStatus.absent) {
        next = AttendanceStatus.checkedIn;
      } else if (current == AttendanceStatus.checkedIn) {
        next = AttendanceStatus.checkedOut;
      } else {
        next = AttendanceStatus.absent;
      }
      _attendance[index] = _attendance[index].copyWith(status: next);
    });
  }

  @override
  Widget build(BuildContext context) {
    final presentCount =
        _attendance.where((a) => a.status.isPresent).length;

    final tabs = [
      _TeacherDashTab(user: mockTeacher, attendance: _attendance),
      _TeacherAttendanceTab(
          attendance: _attendance,
          presentCount: presentCount,
          onToggle: _toggleStatus),
      _TeacherRosterTab(students: mockClassStudents),
      _TeacherProfileTab(user: mockTeacher),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seedlings Class'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_none), onPressed: () {}),
        ],
      ),
      body: tabs[_tab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home'),
          BottomNavigationBarItem(
              icon: Icon(Icons.check_circle_outline),
              activeIcon: Icon(Icons.check_circle),
              label: 'Attendance'),
          BottomNavigationBarItem(
              icon: Icon(Icons.group_outlined),
              activeIcon: Icon(Icons.group),
              label: 'Class'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile'),
        ],
      ),
    );
  }
}

class _TeacherDashTab extends StatelessWidget {
  final UserModel user;
  final List<AttendanceModel> attendance;
  const _TeacherDashTab(
      {required this.user, required this.attendance});

  @override
  Widget build(BuildContext context) {
    final present = attendance.where((a) => a.status.isPresent).length;
    final total = attendance.length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [AppColors.darkNavy, Color(0xFF0A3880)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Good morning, ${user.displayName}',
                  style: GoogleFonts.dmSerifDisplay(
                      color: Colors.white, fontSize: 20)),
              const SizedBox(height: 4),
              Text('Seedlings · Ages 7–9',
                  style: GoogleFonts.workSans(
                      color: Colors.white60, fontSize: 13)),
              const SizedBox(height: 16),
              Row(
                children: [
                  _StatPill(label: 'Present', value: '$present', color: AppColors.successGreen),
                  const SizedBox(width: 8),
                  _StatPill(label: 'Total', value: '$total', color: AppColors.goldAmber),
                  const SizedBox(width: 8),
                  _StatPill(
                      label: 'Rate',
                      value: '${(present / total * 100).round()}%',
                      color: AppColors.primaryRed),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Card(
          child: ListTile(
            leading: const Icon(Icons.pending_actions,
                color: AppColors.pendingAmber),
            title: const Text('3 pending student registrations'),
            subtitle: const Text('Awaiting your review'),
            trailing: const Icon(Icons.chevron_right),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.campaign, color: AppColors.darkNavy),
            title: const Text('Send class announcement'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatPill(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(value,
              style: GoogleFonts.dmSerifDisplay(
                  color: color, fontSize: 18)),
          Text(label,
              style: GoogleFonts.workSans(
                  color: Colors.white70, fontSize: 10)),
        ],
      ),
    );
  }
}

class _TeacherAttendanceTab extends StatelessWidget {
  final List<AttendanceModel> attendance;
  final int presentCount;
  final void Function(int) onToggle;
  const _TeacherAttendanceTab(
      {required this.attendance,
      required this.presentCount,
      required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Summary bar
        Container(
          color: AppColors.darkNavy,
          padding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            children: [
              const Icon(Icons.check_circle,
                  color: AppColors.successGreen, size: 18),
              const SizedBox(width: 8),
              Text(
                '$presentCount / ${attendance.length} Present',
                style: GoogleFonts.workSans(
                    color: Colors.white,
                    fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              Text(
                DateFormat('EEE, d MMM').format(DateTime.now()),
                style: GoogleFonts.workSans(
                    color: Colors.white60, fontSize: 12),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            'Tap a student to cycle: Absent → Checked In → Checked Out',
            style: GoogleFonts.workSans(
                fontSize: 11,
                color: AppColors.darkBrown.withOpacity(0.5)),
            textAlign: TextAlign.center,
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: attendance.length,
            itemBuilder: (ctx, i) {
              final a = attendance[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  onTap: () => onToggle(i),
                  leading: _PhotoPlaceholder(
                      name: a.studentFirstName ?? '?', size: 44),
                  title: Text(a.studentFullName,
                      style: GoogleFonts.workSans(
                          fontWeight: FontWeight.w600)),
                  subtitle: a.checkinTime != null
                      ? Text(
                          'In: ${DateFormat('HH:mm').format(a.checkinTime!)}${a.checkoutTime != null ? '  Out: ${DateFormat('HH:mm').format(a.checkoutTime!)}' : ''}',
                          style: GoogleFonts.workSans(fontSize: 12))
                      : null,
                  trailing: _AttendanceBadge(status: a.status),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _AttendanceBadge extends StatelessWidget {
  final AttendanceStatus status;
  const _AttendanceBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status) {
      case AttendanceStatus.checkedIn:
        bg = AppColors.successGreen.withOpacity(0.15);
        fg = AppColors.successGreen;
        break;
      case AttendanceStatus.checkedOut:
        bg = AppColors.darkNavy.withOpacity(0.1);
        fg = AppColors.darkNavy;
        break;
      case AttendanceStatus.absent:
        bg = AppColors.errorRed.withOpacity(0.1);
        fg = AppColors.errorRed;
        break;
      default:
        bg = AppColors.goldAmber.withOpacity(0.15);
        fg = AppColors.goldAmber;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status.displayLabel,
          style:
              GoogleFonts.workSans(fontSize: 11, color: fg, fontWeight: FontWeight.w600)),
    );
  }
}

class _TeacherRosterTab extends StatelessWidget {
  final List<StudentModel> students;
  const _TeacherRosterTab({required this.students});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Class Roster — Seedlings',
            style: Theme.of(context).textTheme.headlineSmall),
        Text('${students.length} students · Ages 7–9',
            style: GoogleFonts.workSans(
                color: AppColors.darkBrown.withOpacity(0.5), fontSize: 13)),
        const SizedBox(height: 12),
        ...students.map((s) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: _PhotoPlaceholder(name: s.firstName, size: 44),
                title: Text(s.fullName,
                    style: GoogleFonts.workSans(fontWeight: FontWeight.w600)),
                subtitle: Text('Age ${s.age}${s.hasAllergies ? ' · ⚠️ Allergy' : ''}',
                    style: GoogleFonts.workSans(fontSize: 12)),
                trailing: const Icon(Icons.chevron_right,
                    color: AppColors.darkBrown),
              ),
            )),
      ],
    );
  }
}

class _TeacherProfileTab extends StatelessWidget {
  final UserModel user;
  const _TeacherProfileTab({required this.user});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              _PhotoPlaceholder(name: user.displayName, size: 80),
              const SizedBox(height: 12),
              Text(user.displayName,
                  style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.darkNavy.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Teacher · Seedlings Class',
                    style: GoogleFonts.workSans(
                        color: AppColors.darkNavy, fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _ProfileRow(Icons.phone, 'Phone', user.phone ?? '—'),
        _ProfileRow(Icons.email, 'Email', user.email ?? '—'),
        _ProfileRow(Icons.location_on, 'Address', user.address ?? '—'),
        const Divider(height: 32),
        OutlinedButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.logout),
          label: const Text('Sign Out'),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DEMO HOME
// ═══════════════════════════════════════════════════════════════════════════

class DemoAdminHome extends StatefulWidget {
  const DemoAdminHome({super.key});
  @override
  State<DemoAdminHome> createState() => _DemoAdminHomeState();
}

class _DemoAdminHomeState extends State<DemoAdminHome> {
  int _navIndex = 0;

  final _navItems = const [
    NavigationRailDestination(
        icon: Icon(Icons.dashboard_outlined),
        selectedIcon: Icon(Icons.dashboard),
        label: Text('Dashboard')),
    NavigationRailDestination(
        icon: Icon(Icons.pending_outlined),
        selectedIcon: Icon(Icons.pending),
        label: Text('Approvals')),
    NavigationRailDestination(
        icon: Icon(Icons.group_outlined),
        selectedIcon: Icon(Icons.group),
        label: Text('Students')),
    NavigationRailDestination(
        icon: Icon(Icons.calendar_month_outlined),
        selectedIcon: Icon(Icons.calendar_month),
        label: Text('Events')),
    NavigationRailDestination(
        icon: Icon(Icons.bar_chart_outlined),
        selectedIcon: Icon(Icons.bar_chart),
        label: Text('Reports')),
  ];

  Widget _body() {
    switch (_navIndex) {
      case 0:
        return const _AdminDashboard();
      case 1:
        return _AdminApprovals(students: mockPendingStudents);
      case 2:
        return _AdminStudents(students: mockAllStudents);
      case 3:
        return _AdminEvents(events: mockEvents);
      case 4:
        return const _AdminReports();
      default:
        return const _AdminDashboard();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width >= 700;

    if (isWide) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin Portal — Dhamma School')),
        body: Row(
          children: [
            NavigationRail(
              backgroundColor: AppColors.white,
              selectedIndex: _navIndex,
              onDestinationSelected: (i) => setState(() => _navIndex = i),
              labelType: NavigationRailLabelType.all,
              selectedIconTheme:
                  const IconThemeData(color: AppColors.primaryRed),
              selectedLabelTextStyle:
                  GoogleFonts.workSans(color: AppColors.primaryRed),
              destinations: _navItems,
            ),
            const VerticalDivider(width: 1),
            Expanded(child: _body()),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Portal')),
      drawer: Drawer(
        child: Column(
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: AppColors.darkNavy),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.spa, color: AppColors.goldAmber, size: 32),
                  const SizedBox(height: 8),
                  Text('Dhamma School',
                      style: GoogleFonts.dmSerifDisplay(
                          color: Colors.white, fontSize: 18)),
                  Text('Admin Portal',
                      style: GoogleFonts.workSans(
                          color: Colors.white54, fontSize: 13)),
                ],
              ),
            ),
            ...List.generate(
              _navItems.length,
              (i) => ListTile(
                leading: i == _navIndex
                    ? _navItems[i].selectedIcon as Widget
                    : _navItems[i].icon as Widget,
                title: _navItems[i].label as Widget,
                selected: i == _navIndex,
                selectedTileColor: AppColors.primaryRed.withOpacity(0.08),
                onTap: () {
                  setState(() => _navIndex = i);
                  Navigator.pop(context);
                },
              ),
            ),
          ],
        ),
      ),
      body: _body(),
    );
  }
}

class _AdminDashboard extends StatelessWidget {
  const _AdminDashboard();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Dashboard', style: Theme.of(context).textTheme.headlineMedium),
        Text(DateFormat('EEEE, d MMMM y').format(DateTime.now()),
            style: GoogleFonts.workSans(
                color: AppColors.darkBrown.withOpacity(0.5))),
        const SizedBox(height: 16),
        // KPI cards
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _KpiCard(
                label: 'Total Students',
                value: '${adminStats['totalStudents']}',
                icon: Icons.child_care,
                color: AppColors.darkNavy),
            _KpiCard(
                label: 'Total Teachers',
                value: '${adminStats['totalTeachers']}',
                icon: Icons.school,
                color: AppColors.primaryRed),
            _KpiCard(
                label: 'Pending Approvals',
                value: '${adminStats['pendingRegistrations']}',
                icon: Icons.pending,
                color: AppColors.pendingAmber),
            _KpiCard(
                label: "Today's Attendance",
                value: '${adminStats['attendanceRateToday']}%',
                icon: Icons.check_circle,
                color: AppColors.successGreen),
          ],
        ),
        const SizedBox(height: 20),
        Text('Attendance Trend (Last 8 Sessions)',
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 20, 20, 12),
            child: SizedBox(
              height: 180,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: FlTitlesData(
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 1,
                        getTitlesWidget: (v, _) {
                          final weeks = ['W1','W2','W3','W4','W5','W6','W7','W8'];
                          final i = v.toInt();
                          if (i < 0 || i >= weeks.length) return const SizedBox();
                          return Text(weeks[i],
                              style: GoogleFonts.workSans(fontSize: 10));
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 20,
                        getTitlesWidget: (v, _) => Text('${v.toInt()}%',
                            style: GoogleFonts.workSans(fontSize: 10)),
                        reservedSize: 36,
                      ),
                    ),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  minY: 0,
                  maxY: 100,
                  lineBarsData: [
                    LineChartBarData(
                      spots: weeklyAttendance
                          .asMap()
                          .entries
                          .map((e) => FlSpot(e.key.toDouble(), e.value))
                          .toList(),
                      isCurved: true,
                      color: AppColors.primaryRed,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.primaryRed.withOpacity(0.08),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text('Classes Overview',
            style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        ...mockClasses.map((c) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.darkNavy,
                  child: Text(c.name[0],
                      style: GoogleFonts.dmSerifDisplay(
                          color: Colors.white)),
                ),
                title: Text(c.name,
                    style:
                        GoogleFonts.workSans(fontWeight: FontWeight.w600)),
                subtitle: Text('${c.gradeLevel} · ${c.teacherName}',
                    style: GoogleFonts.workSans(fontSize: 12)),
                trailing: Chip(
                  label: Text('${c.studentCount} students',
                      style: GoogleFonts.workSans(fontSize: 11)),
                  backgroundColor: AppColors.creamYellow,
                ),
              ),
            )),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _KpiCard(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const Spacer(),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                      color: color, shape: BoxShape.circle),
                ),
              ],
            ),
            const Spacer(),
            Text(value,
                style: GoogleFonts.dmSerifDisplay(
                    fontSize: 26, color: color)),
            Text(label,
                style: GoogleFonts.workSans(
                    fontSize: 11,
                    color: AppColors.darkBrown.withOpacity(0.55))),
          ],
        ),
      ),
    );
  }
}

class _AdminApprovals extends StatefulWidget {
  final List<StudentModel> students;
  const _AdminApprovals({required this.students});
  @override
  State<_AdminApprovals> createState() => _AdminApprovalsState();
}

class _AdminApprovalsState extends State<_AdminApprovals> {
  late List<StudentModel> _pending;

  @override
  void initState() {
    super.initState();
    _pending = List.from(widget.students);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Pending Registrations',
            style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 4),
        Text('${_pending.length} awaiting approval',
            style: GoogleFonts.workSans(
                color: AppColors.darkBrown.withOpacity(0.5))),
        const SizedBox(height: 16),
        if (_pending.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  const Icon(Icons.check_circle_outline,
                      size: 60, color: AppColors.successGreen),
                  const SizedBox(height: 12),
                  Text('All caught up!',
                      style: Theme.of(context).textTheme.headlineSmall),
                ],
              ),
            ),
          )
        else
          ..._pending.asMap().entries.map((e) => _PendingCard(
                student: e.value,
                onApprove: () => setState(() => _pending.removeAt(e.key)),
                onReject: () => setState(() => _pending.removeAt(e.key)),
              )),
      ],
    );
  }
}

class _PendingCard extends StatelessWidget {
  final StudentModel student;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  const _PendingCard(
      {required this.student,
      required this.onApprove,
      required this.onReject});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _PhotoPlaceholder(name: student.firstName, size: 52),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(student.fullName,
                          style: GoogleFonts.dmSerifDisplay(fontSize: 17)),
                      Text(
                          'Age ${student.age} · ${student.className ?? 'Unassigned'}',
                          style: GoogleFonts.workSans(fontSize: 13)),
                    ],
                  ),
                ),
                _StatusBadge(status: student.status),
              ],
            ),
            const Divider(height: 20),
            _InfoRow('Parent', student.parentName ?? '—'),
            _InfoRow('Phone', student.parentPhone ?? '—'),
            _InfoRow('Address', student.parentAddress ?? '—'),
            if (student.hasAllergies)
              _InfoRow('Allergies', student.allergyNotes ?? 'Yes'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onReject,
                    icon: const Icon(Icons.close,
                        color: AppColors.errorRed, size: 16),
                    label: const Text('Reject',
                        style: TextStyle(color: AppColors.errorRed)),
                    style: OutlinedButton.styleFrom(
                        side: const BorderSide(
                            color: AppColors.errorRed)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onApprove,
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Approve'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 70,
            child: Text(label,
                style: GoogleFonts.workSans(
                    fontSize: 12,
                    color: AppColors.darkBrown.withOpacity(0.5))),
          ),
          Text(value,
              style: GoogleFonts.workSans(fontSize: 13)),
        ],
      ),
    );
  }
}

class _AdminStudents extends StatelessWidget {
  final List<StudentModel> students;
  const _AdminStudents({required this.students});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('All Students',
            style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        TextField(
          decoration: InputDecoration(
            hintText: 'Search students…',
            prefixIcon: const Icon(Icons.search),
            filled: true,
            fillColor: AppColors.white,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        ...students.map((s) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: _PhotoPlaceholder(name: s.firstName, size: 44),
                title: Text(s.fullName,
                    style:
                        GoogleFonts.workSans(fontWeight: FontWeight.w600)),
                subtitle: Text(
                    '${s.className ?? 'Unassigned'} · Age ${s.age}',
                    style: GoogleFonts.workSans(fontSize: 12)),
                trailing: _StatusBadge(status: s.status),
              ),
            )),
      ],
    );
  }
}

class _AdminEvents extends StatelessWidget {
  final List<EventModel> events;
  const _AdminEvents({required this.events});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Event Calendar',
                  style: Theme.of(context).textTheme.headlineMedium),
            ),
            FilledButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Event creation form would open here.'),
                      backgroundColor: AppColors.darkNavy),
                );
              },
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Event'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...events.map((e) => _EventCard(event: e, showActions: true)),
      ],
    );
  }
}

class _AdminReports extends StatelessWidget {
  const _AdminReports();

  @override
  Widget build(BuildContext context) {
    const headers = ['Student', 'Class', 'Sessions', 'Present', 'Rate'];
    final rows = [
      ['Ashan Fernando', 'Seedlings', '8', '7', '88%'],
      ['Binara Jayawardena', 'Blossoms', '8', '6', '75%'],
      ['Kavindu Perera', 'Seedlings', '8', '8', '100%'],
      ['Lasith Malinga', 'Blossoms', '8', '5', '63%'],
      ['Malsha Gunasekara', 'Blossoms', '8', '7', '88%'],
      ['Naveen Rathnayake', 'Juniors', '8', '6', '75%'],
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Attendance Reports',
            style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        // Period selector
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'day', label: Text('Daily')),
            ButtonSegment(value: 'week', label: Text('Weekly')),
            ButtonSegment(value: 'month', label: Text('Monthly')),
          ],
          selected: const {'week'},
          onSelectionChanged: (_) {},
        ),
        const SizedBox(height: 16),
        Card(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(
                  AppColors.darkNavy.withOpacity(0.05)),
              columns: headers
                  .map((h) => DataColumn(
                        label: Text(h,
                            style: GoogleFonts.workSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 12)),
                      ))
                  .toList(),
              rows: rows
                  .map((r) => DataRow(
                        cells: r.asMap().entries.map((e) {
                          final isRate = e.key == 4;
                          double? rate;
                          if (isRate) {
                            rate = double.tryParse(
                                r[4].replaceAll('%', ''));
                          }
                          Color? rateColor;
                          if (rate != null) {
                            rateColor = rate >= 80
                                ? AppColors.successGreen
                                : rate >= 60
                                    ? AppColors.pendingAmber
                                    : AppColors.errorRed;
                          }
                          return DataCell(Text(
                            e.value,
                            style: GoogleFonts.workSans(
                                fontSize: 13,
                                color: rateColor,
                                fontWeight: isRate
                                    ? FontWeight.w700
                                    : FontWeight.w400),
                          ));
                        }).toList(),
                      ))
                  .toList(),
            ),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('CSV export would download here.'),
                  backgroundColor: AppColors.darkNavy),
            );
          },
          icon: const Icon(Icons.download),
          label: const Text('Export CSV'),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

class _PhotoPlaceholder extends StatelessWidget {
  final String name;
  final double size;
  const _PhotoPlaceholder({required this.name, required this.size});

  Color get _bg {
    final colors = [
      AppColors.darkNavy,
      AppColors.primaryRed,
      const Color(0xFF2E7D32),
      const Color(0xFF6A1B9A),
      const Color(0xFF00695C),
    ];
    return colors[name.codeUnitAt(0) % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: _bg, shape: BoxShape.circle),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: GoogleFonts.dmSerifDisplay(
              color: Colors.white, fontSize: size * 0.4),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final StudentStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status) {
      case StudentStatus.active:
        bg = AppColors.successGreen.withOpacity(0.12);
        fg = AppColors.successGreen;
        break;
      case StudentStatus.approved:
        bg = AppColors.successGreen.withOpacity(0.12);
        fg = AppColors.successGreen;
        break;
      case StudentStatus.pending:
        bg = AppColors.pendingAmber.withOpacity(0.15);
        fg = AppColors.pendingAmber;
        break;
      case StudentStatus.underReview:
        bg = AppColors.darkNavy.withOpacity(0.1);
        fg = AppColors.darkNavy;
        break;
      case StudentStatus.rejected:
        bg = AppColors.errorRed.withOpacity(0.1);
        fg = AppColors.errorRed;
        break;
      default:
        bg = AppColors.darkBrown.withOpacity(0.1);
        fg = AppColors.darkBrown;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status.displayLabel,
          style: GoogleFonts.workSans(
              fontSize: 11, color: fg, fontWeight: FontWeight.w600)),
    );
  }
}

class _EventCard extends StatelessWidget {
  final EventModel event;
  final bool showActions;
  const _EventCard({required this.event, this.showActions = false});

  Color get _typeColor {
    switch (event.eventType) {
      case EventType.poya:
        return AppColors.goldAmber;
      case EventType.holiday:
        return AppColors.errorRed;
      case EventType.exam:
        return AppColors.darkNavy;
      default:
        return AppColors.primaryRed;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 40,
                  decoration: BoxDecoration(
                      color: _typeColor,
                      borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(event.title,
                          style: GoogleFonts.dmSerifDisplay(fontSize: 16)),
                      Text(
                          DateFormat('EEE, d MMM y · h:mm a')
                              .format(event.startDatetime),
                          style: GoogleFonts.workSans(
                              fontSize: 12,
                              color: AppColors.darkBrown.withOpacity(0.6))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _typeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(event.eventType.displayLabel,
                      style: GoogleFonts.workSans(
                          fontSize: 10,
                          color: _typeColor,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            if (event.description != null) ...[
              const SizedBox(height: 8),
              Text(event.description!,
                  style: GoogleFonts.workSans(fontSize: 13),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
            if (event.location != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 13,
                      color: AppColors.primaryRed),
                  const SizedBox(width: 4),
                  Text(event.location!,
                      style: GoogleFonts.workSans(
                          fontSize: 12,
                          color: AppColors.darkBrown.withOpacity(0.6))),
                ],
              ),
            ],
            if (showActions) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.edit_outlined, size: 14),
                    label: const Text('Edit'),
                  ),
                  TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.delete_outline,
                        size: 14, color: AppColors.errorRed),
                    label: const Text('Delete',
                        style: TextStyle(color: AppColors.errorRed)),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AnnouncementCard extends StatefulWidget {
  final AnnouncementModel announcement;
  const _AnnouncementCard({required this.announcement});
  @override
  State<_AnnouncementCard> createState() => _AnnouncementCardState();
}

class _AnnouncementCardState extends State<_AnnouncementCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final a = widget.announcement;
    final isEmergency = a.type.isEmergency;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isEmergency
            ? const BorderSide(color: AppColors.errorRed, width: 2)
            : const BorderSide(color: AppColors.creamYellow),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(a.title,
                        style: GoogleFonts.dmSerifDisplay(fontSize: 15)),
                  ),
                  _AnnouncementTypeBadge(type: a.type),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                  '${a.authorName ?? 'Admin'} · ${_timeAgo(a.publishedAt)}',
                  style: GoogleFonts.workSans(
                      fontSize: 11,
                      color: AppColors.darkBrown.withOpacity(0.5))),
              const SizedBox(height: 8),
              Text(
                a.body,
                style: GoogleFonts.workSans(fontSize: 13),
                maxLines: _expanded ? null : 2,
                overflow: _expanded ? null : TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                _expanded ? 'Show less' : 'Read more',
                style: GoogleFonts.workSans(
                    fontSize: 12,
                    color: AppColors.primaryRed,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    return '${diff.inMinutes}m ago';
  }
}

class _AnnouncementTypeBadge extends StatelessWidget {
  final AnnouncementType type;
  const _AnnouncementTypeBadge({required this.type});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (type) {
      case AnnouncementType.emergency:
        color = AppColors.errorRed;
        break;
      case AnnouncementType.clazz:
        color = AppColors.darkNavy;
        break;
      case AnnouncementType.eventReminder:
        color = AppColors.goldAmber;
        break;
      default:
        color = AppColors.primaryRed;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(type.displayLabel,
          style: GoogleFonts.workSans(
              fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
