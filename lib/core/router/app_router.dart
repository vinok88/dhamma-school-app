import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/auth/login_screen.dart';
import '../../features/auth/role_selection_screen.dart';
import '../../features/shared/splash_screen.dart';
import '../../features/parent/parent_home_screen.dart';
import '../../features/parent/register_student_screen.dart';
import '../../features/parent/student_status_screen.dart';
import '../../features/parent/calendar_screen.dart';
import '../../features/parent/announcements_screen.dart';
import '../../features/parent/parent_profile_screen.dart';
import '../../features/teacher/teacher_home_screen.dart';
import '../../features/teacher/attendance_screen.dart';
import '../../features/teacher/class_roster_screen.dart';
import '../../features/teacher/student_detail_screen.dart';
import '../../features/teacher/send_announcement_screen.dart';
import '../../features/teacher/teacher_profile_screen.dart';
import '../../features/admin/admin_dashboard_screen.dart';
import '../../features/admin/pending_registrations_screen.dart';
import '../../features/admin/student_management_screen.dart';
import '../../features/admin/teacher_management_screen.dart';
import '../../features/admin/class_management_screen.dart';
import '../../features/admin/event_management_screen.dart';
import '../../features/admin/reports_screen.dart';
import '../../features/admin/announcement_compose_screen.dart';
import '../../features/shared/notification_centre_screen.dart';
import '../../features/shared/message_thread_screen.dart';
import '../../providers/auth_provider.dart';

part 'app_router.g.dart';

/// Named route constants
class AppRoutes {
  AppRoutes._();

  static const String splash = '/splash';
  static const String login = '/login';
  static const String roleSelect = '/role-select';
  static const String parentHome = '/parent/home';
  static const String registerStudent = '/parent/register-student';
  static const String studentStatus = '/parent/student/:id/status';
  static const String parentCalendar = '/parent/calendar';
  static const String parentAnnouncements = '/parent/announcements';
  static const String parentMessages = '/parent/messages';
  static const String parentProfile = '/parent/profile';
  static const String teacherHome = '/teacher/home';
  static const String teacherAttendance = '/teacher/attendance';
  static const String teacherClass = '/teacher/class';
  static const String teacherStudentDetail = '/teacher/student/:id';
  static const String teacherAnnounce = '/teacher/announce';
  static const String teacherProfile = '/teacher/profile';
  static const String adminDashboard = '/admin/dashboard';
  static const String adminRegistrations = '/admin/registrations';
  static const String adminStudents = '/admin/students';
  static const String adminTeachers = '/admin/teachers';
  static const String adminClasses = '/admin/classes';
  static const String adminEvents = '/admin/events';
  static const String adminReports = '/admin/reports';
  static const String adminAnnounce = '/admin/announce';
  static const String notifications = '/notifications';
  static const String messageThread = '/messages/:recipientId';
}

@riverpod
GoRouter appRouter(AppRouterRef ref) {
  final authState = ref.watch(authStateProvider);
  final userProfile = ref.watch(userProfileProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull != null &&
          authState.valueOrNull?.session != null;
      final isAuthRoute = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.splash ||
          state.matchedLocation == AppRoutes.roleSelect;

      // Not authenticated: go to login (unless already on auth route)
      if (!isAuthenticated && !isAuthRoute) {
        return AppRoutes.login;
      }

      // Authenticated but no profile yet: go to role select
      if (isAuthenticated &&
          userProfile.valueOrNull == null &&
          state.matchedLocation != AppRoutes.roleSelect &&
          state.matchedLocation != AppRoutes.splash) {
        return AppRoutes.roleSelect;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.roleSelect,
        builder: (context, state) => const RoleSelectionScreen(),
      ),

      // --- Parent routes ---
      GoRoute(
        path: AppRoutes.parentHome,
        builder: (context, state) => const ParentHomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.registerStudent,
        builder: (context, state) => const RegisterStudentScreen(),
      ),
      GoRoute(
        path: AppRoutes.studentStatus,
        builder: (context, state) {
          final studentId = state.pathParameters['id']!;
          return StudentStatusScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: AppRoutes.parentCalendar,
        builder: (context, state) => const CalendarScreen(),
      ),
      GoRoute(
        path: AppRoutes.parentAnnouncements,
        builder: (context, state) => const AnnouncementsScreen(),
      ),
      GoRoute(
        path: AppRoutes.parentProfile,
        builder: (context, state) => const ParentProfileScreen(),
      ),

      // --- Teacher routes ---
      GoRoute(
        path: AppRoutes.teacherHome,
        builder: (context, state) => const TeacherHomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.teacherAttendance,
        builder: (context, state) => const AttendanceScreen(),
      ),
      GoRoute(
        path: AppRoutes.teacherClass,
        builder: (context, state) => const ClassRosterScreen(),
      ),
      GoRoute(
        path: AppRoutes.teacherStudentDetail,
        builder: (context, state) {
          final studentId = state.pathParameters['id']!;
          return StudentDetailScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: AppRoutes.teacherAnnounce,
        builder: (context, state) => const SendAnnouncementScreen(),
      ),
      GoRoute(
        path: AppRoutes.teacherProfile,
        builder: (context, state) => const TeacherProfileScreen(),
      ),

      // --- Admin routes ---
      GoRoute(
        path: AppRoutes.adminDashboard,
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminRegistrations,
        builder: (context, state) => const PendingRegistrationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminStudents,
        builder: (context, state) => const StudentManagementScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminTeachers,
        builder: (context, state) => const TeacherManagementScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminClasses,
        builder: (context, state) => const ClassManagementScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminEvents,
        builder: (context, state) => const EventManagementScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminReports,
        builder: (context, state) => const ReportsScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminAnnounce,
        builder: (context, state) => const AnnouncementComposeScreen(),
      ),

      // --- Shared routes ---
      GoRoute(
        path: AppRoutes.notifications,
        builder: (context, state) => const NotificationCentreScreen(),
      ),
      GoRoute(
        path: AppRoutes.messageThread,
        builder: (context, state) {
          final recipientId = state.pathParameters['recipientId']!;
          final recipientName = state.uri.queryParameters['name'] ?? 'User';
          return MessageThreadScreen(
            recipientId: recipientId,
            recipientName: recipientName,
          );
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Color(0xFFC0392B)),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(state.error?.message ?? 'Unknown error'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.splash),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}
