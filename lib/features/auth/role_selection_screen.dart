import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:reactive_forms/reactive_forms.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import '../../widgets/loading_overlay.dart';

class RoleSelectionScreen extends ConsumerStatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  ConsumerState<RoleSelectionScreen> createState() =>
      _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends ConsumerState<RoleSelectionScreen> {
  UserRole? _selectedRole;
  bool _showForm = false;
  bool _isLoading = false;

  late final FormGroup _parentForm = FormGroup({
    'full_name': FormControl<String>(validators: [Validators.required]),
    'phone': FormControl<String>(validators: [Validators.required]),
    'address': FormControl<String>(validators: [Validators.required]),
  });

  late final FormGroup _teacherForm = FormGroup({
    'full_name': FormControl<String>(validators: [Validators.required]),
    'phone': FormControl<String>(validators: [Validators.required]),
    'address': FormControl<String>(validators: [Validators.required]),
    'dob': FormControl<DateTime>(validators: [Validators.required]),
    'preferred_name': FormControl<String>(),
  });

  FormGroup get _activeForm =>
      _selectedRole == UserRole.teacher ? _teacherForm : _parentForm;

  void _selectRole(UserRole role) {
    setState(() {
      _selectedRole = role;
      _showForm = true;
    });
  }

  Future<void> _submit() async {
    if (!_activeForm.valid) {
      _activeForm.markAllAsTouched();
      return;
    }

    setState(() => _isLoading = true);
    try {
      final schoolId = await AuthService.instance.getDefaultSchoolId();
      final values = _activeForm.value;
      final user = AuthService.instance.currentUser;
      if (user == null) throw Exception('No authenticated user');

      final profileData = {
        'school_id': schoolId,
        'full_name': values['full_name'],
        'preferred_name': values['preferred_name'],
        'phone': values['phone'],
        'address': values['address'],
        'role': _selectedRole!.toJson(),
        'status': _selectedRole == UserRole.teacher ? 'pending' : 'active',
      };

      await AuthService.instance.upsertUserProfile(profileData);

      if (!mounted) return;

      if (_selectedRole == UserRole.parent) {
        context.go(AppRoutes.parentHome);
      } else {
        context.go(AppRoutes.teacherHome);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration failed: ${e.toString()}'),
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
    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      appBar: AppBar(
        backgroundColor: AppColors.darkNavy,
        title: Text(
          'Complete Your Profile',
          style: AppTextStyles.headlineMediumOnDark,
        ),
        leading: _showForm
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios, color: AppColors.white),
                onPressed: () =>
                    setState(() => _showForm = false),
              )
            : null,
      ),
      body: LoadingStack(
        isLoading: _isLoading,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: !_showForm ? _buildRoleSelection() : _buildRegistrationForm(),
        ),
      ),
    );
  }

  Widget _buildRoleSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 24),
        Text(
          'Welcome!',
          style: AppTextStyles.displayLarge,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'How will you be using the Dhamma School app?',
          style: AppTextStyles.bodyLarge,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 40),
        _RoleCard(
          title: 'I am a Parent',
          subtitle: 'Register and manage your children\'s enrollment',
          icon: Icons.family_restroom,
          onTap: () => _selectRole(UserRole.parent),
        ),
        const SizedBox(height: 16),
        _RoleCard(
          title: 'I am a Teacher',
          subtitle:
              'Manage your class attendance and communicate with parents',
          icon: Icons.school_outlined,
          onTap: () => _selectRole(UserRole.teacher),
        ),
        const SizedBox(height: 24),
        Text(
          'Admin accounts are created by the school administration.',
          style: AppTextStyles.caption,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildRegistrationForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text(
          _selectedRole == UserRole.parent
              ? 'Parent Registration'
              : 'Teacher Registration',
          style: AppTextStyles.headlineMedium,
        ),
        const SizedBox(height: 8),
        if (_selectedRole == UserRole.teacher) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.pendingAmber.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.pendingAmber.withAlpha(100)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline,
                    color: AppColors.pendingAmber, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Teacher registrations require approval from the Principal before gaining full access.',
                    style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.darkBrown),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        ReactiveForm(
          formGroup: _activeForm,
          child: Column(
            children: [
              ReactiveTextField<String>(
                formControlName: 'full_name',
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validationMessages: {
                  ValidationMessage.required: (_) => 'Full name is required',
                },
              ),
              const SizedBox(height: 16),
              if (_selectedRole == UserRole.teacher) ...[
                ReactiveTextField<String>(
                  formControlName: 'preferred_name',
                  decoration: const InputDecoration(
                    labelText: 'Preferred Name (optional)',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                // TODO: Add DatePicker for DOB using ReactiveDatePicker
                ReactiveTextField<String>(
                  formControlName: 'dob',
                  decoration: const InputDecoration(
                    labelText: 'Date of Birth *',
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                    hintText: 'DD/MM/YYYY',
                  ),
                ),
                const SizedBox(height: 16),
              ],
              ReactiveTextField<String>(
                formControlName: 'phone',
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number *',
                  prefixIcon: Icon(Icons.phone_outlined),
                  hintText: 'e.g. 04xx xxx xxx',
                ),
                validationMessages: {
                  ValidationMessage.required: (_) => 'Phone number is required',
                },
              ),
              const SizedBox(height: 16),
              ReactiveTextField<String>(
                formControlName: 'address',
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Address *',
                  prefixIcon: Icon(Icons.home_outlined),
                ),
                validationMessages: {
                  ValidationMessage.required: (_) => 'Address is required',
                },
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: _submit,
                child: Text(
                  _selectedRole == UserRole.teacher
                      ? 'Submit for Approval'
                      : 'Complete Registration',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.darkNavy.withAlpha(15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, size: 36, color: AppColors.darkNavy),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.headlineSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios,
                size: 18,
                color: AppColors.darkBrown,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
