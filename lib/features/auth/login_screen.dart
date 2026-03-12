import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';
import '../../widgets/loading_overlay.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isLoading = false;

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final result = await AuthService.instance.signInWithGoogle();
      if (!mounted) return;

      // Web: result is null (redirect-based), mobile: result has session
      if (result?.session != null) {
        _navigateAfterLogin();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Google sign-in failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signInWithApple() async {
    setState(() => _isLoading = true);
    try {
      final result = await AuthService.instance.signInWithApple();
      if (!mounted) return;

      if (result?.session != null) {
        _navigateAfterLogin();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Apple sign-in failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _navigateAfterLogin() async {
    // Reload user profile to check if they need role selection
    final profile = await ref.read(userProfileProvider.future);
    if (!mounted) return;

    if (profile == null) {
      context.go(AppRoutes.roleSelect);
    } else {
      switch (profile.role) {
        case UserRole.parent:
          context.go(AppRoutes.parentHome);
          break;
        case UserRole.teacher:
          context.go(AppRoutes.teacherHome);
          break;
        case UserRole.admin:
          context.go(AppRoutes.adminDashboard);
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: LoadingStack(
        isLoading: _isLoading,
        child: Column(
          children: [
            // Top half — darkNavy with monastery name
            Expanded(
              flex: 5,
              child: Container(
                width: double.infinity,
                color: AppColors.darkNavy,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // TODO: Replace with monastery lotus SVG logo
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.goldAmber.withAlpha(30),
                            border: Border.all(
                              color: AppColors.goldAmber.withAlpha(100),
                              width: 2,
                            ),
                          ),
                          child: const Icon(
                            Icons.local_florist_outlined,
                            size: 52,
                            color: AppColors.goldAmber,
                          ),
                        ),
                        const SizedBox(height: 28),
                        Text(
                          'Mahamevnawa',
                          style: AppTextStyles.displayLargeOnDark,
                          textAlign: TextAlign.center,
                        ),
                        Text(
                          'Dhamma School',
                          style: AppTextStyles.headlineMediumOnDark,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Melbourne – Southbank',
                          style: AppTextStyles.bodyMediumOnDark.copyWith(
                            color: AppColors.goldAmber,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        // Sinhala subtitle
                        // TODO: Have a native Sinhala speaker review this translation
                        Text(
                          'ශ්‍රී සද්ධර්ම ධර්ම පාසල',
                          style: AppTextStyles.bodyMediumOnDark.copyWith(
                            color: AppColors.white.withAlpha(180),
                            fontSize: 13,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom — cream sheet with sign-in buttons
            Expanded(
              flex: 4,
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: AppColors.creamYellow,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Sign in to continue',
                      style: AppTextStyles.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Use your Google or Apple account',
                      style: AppTextStyles.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),

                    // Google Sign-In button
                    OutlinedButton.icon(
                      onPressed: _isLoading ? null : _signInWithGoogle,
                      icon: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          border: Border.all(
                              color: Colors.grey.shade300, width: 0.5),
                        ),
                        child: const Icon(
                          Icons.g_mobiledata_rounded,
                          size: 18,
                          color: Color(0xFF4285F4),
                        ),
                      ),
                      label: const Text('Sign in with Google'),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF444444),
                        side: BorderSide(color: Colors.grey.shade300),
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 15,
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Apple Sign-In button
                    ElevatedButton.icon(
                      onPressed: _isLoading ? null : _signInWithApple,
                      icon: const Icon(Icons.apple, size: 20),
                      label: const Text('Sign in with Apple'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        textStyle: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 15,
                        ),
                      ),
                    ),

                    // TODO: Add Facebook login button when FB app credentials are available

                    const SizedBox(height: 24),
                    Text(
                      'By signing in, you agree to our privacy policy\nand terms of service.',
                      style: AppTextStyles.caption,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
