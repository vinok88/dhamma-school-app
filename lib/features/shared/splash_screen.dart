import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    Future.delayed(
      const Duration(milliseconds: AppConstants.splashDelayMs),
      _navigate,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _navigate() {
    if (!mounted) return;

    final authState = ref.read(authStateProvider);
    final isAuthenticated = authState.valueOrNull?.session != null;

    if (!isAuthenticated) {
      context.go(AppRoutes.login);
      return;
    }

    final profile = ref.read(userProfileProvider);
    profile.when(
      data: (user) {
        if (user == null) {
          context.go(AppRoutes.roleSelect);
        } else {
          switch (user.role) {
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
      },
      loading: () => context.go(AppRoutes.login),
      error: (_, __) => context.go(AppRoutes.login),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkNavy,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // TODO: Replace with lotus_splash.svg once assets/images/lotus_splash.svg is added
                      Container(
                        width: 120,
                        height: 120,
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
                          size: 64,
                          color: AppColors.goldAmber,
                        ),
                      ),
                      const SizedBox(height: 32),
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
                      const SizedBox(height: 64),
                      const CircularProgressIndicator(
                        color: AppColors.goldAmber,
                        strokeWidth: 2,
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
