import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../providers/student_provider.dart';
import '../../services/auth_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/loading_overlay.dart';
import '../../core/utils/date_utils.dart';

class RegisterStudentScreen extends ConsumerStatefulWidget {
  const RegisterStudentScreen({super.key});

  @override
  ConsumerState<RegisterStudentScreen> createState() =>
      _RegisterStudentScreenState();
}

class _RegisterStudentScreenState
    extends ConsumerState<RegisterStudentScreen> {
  int _step = 0;
  bool _isLoading = false;

  // Step 1 fields
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _preferredNameCtrl = TextEditingController();
  DateTime? _dob;
  String? _gender;

  // Step 2 fields
  bool _hasAllergies = false;
  final _allergyCtrl = TextEditingController();
  bool _photoConsent = false;

  // Step 3
  File? _photoFile;
  bool _submitted = false;

  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _preferredNameCtrl.dispose();
    _allergyCtrl.dispose();
    super.dispose();
  }

  bool _validateStep1() {
    if (_firstNameCtrl.text.trim().isEmpty) {
      _showError('First name is required');
      return false;
    }
    if (_lastNameCtrl.text.trim().isEmpty) {
      _showError('Last name is required');
      return false;
    }
    if (_dob == null) {
      _showError('Date of birth is required');
      return false;
    }
    final age = AppDateUtils.calculateAge(_dob!);
    if (age < 3 || age > 18) {
      _showError('Child must be between 3 and 18 years old');
      return false;
    }
    return true;
  }

  bool _validateStep2() {
    if (_hasAllergies && _allergyCtrl.text.trim().isEmpty) {
      _showError('Please describe the allergies');
      return false;
    }
    return true;
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.errorRed,
      ),
    );
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
    );
    if (picked == null) return;

    final cropped = await ImageCropper().cropImage(
      sourcePath: picked.path,
      aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Crop Photo',
          toolbarColor: AppColors.darkNavy,
          toolbarWidgetColor: Colors.white,
          activeControlsWidgetColor: AppColors.primaryRed,
        ),
        IOSUiSettings(title: 'Crop Photo'),
      ],
    );

    if (cropped != null) {
      setState(() => _photoFile = File(cropped.path));
    }
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      final user = AuthService.instance.currentUser;
      if (user == null) throw Exception('Not authenticated');

      final profile = ref.read(userProfileProvider).valueOrNull;
      final schoolId = profile?.schoolId;
      if (schoolId == null) throw Exception('No school ID found');

      String? photoUrl;
      if (_photoFile != null) {
        final path = await StorageService.instance.uploadStudentPhoto(
          _photoFile!,
          '${user.id}_${DateTime.now().millisecondsSinceEpoch}',
        );
        photoUrl = path;
      }

      await ref.read(studentNotifierProvider.notifier).createStudent({
        'school_id': schoolId,
        'parent_id': user.id,
        'first_name': _firstNameCtrl.text.trim(),
        'last_name': _lastNameCtrl.text.trim(),
        'preferred_name': _preferredNameCtrl.text.trim().isEmpty
            ? null
            : _preferredNameCtrl.text.trim(),
        'dob': AppDateUtils.toIsoDate(_dob!),
        'gender': _gender,
        'has_allergies': _hasAllergies,
        'allergy_notes':
            _hasAllergies ? _allergyCtrl.text.trim() : null,
        'photo_publish_consent': _photoConsent,
        'photo_url': photoUrl,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      });

      setState(() => _submitted = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit: ${e.toString()}'),
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
          'Register Child',
          style: AppTextStyles.headlineMediumOnDark,
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: LoadingStack(
        isLoading: _isLoading,
        child: _submitted ? _buildSuccessView() : _buildFormView(),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.successGreen.withAlpha(30),
              ),
              child: const Icon(
                Icons.check_circle_outline,
                size: 64,
                color: AppColors.successGreen,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Registration Submitted!',
              style: AppTextStyles.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Your child\'s registration is now pending approval. '
              'You will be notified via push notification once the '
              'Principal reviews the submission.',
              style: AppTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: () => context.go(AppRoutes.parentHome),
              child: const Text('Back to Home'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormView() {
    return Column(
      children: [
        // Progress indicator
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          color: AppColors.white,
          child: Column(
            children: [
              Row(
                children: [
                  _StepIndicator(
                      step: 1,
                      label: 'Details',
                      isActive: _step >= 0,
                      isDone: _step > 0),
                  const Expanded(
                      child: Divider(color: AppColors.darkBrown)),
                  _StepIndicator(
                      step: 2,
                      label: 'Health',
                      isActive: _step >= 1,
                      isDone: _step > 1),
                  const Expanded(
                      child: Divider(color: AppColors.darkBrown)),
                  _StepIndicator(
                      step: 3,
                      label: 'Photo',
                      isActive: _step >= 2,
                      isDone: false),
                ],
              ),
            ],
          ),
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: [
              _buildStep1(),
              _buildStep2(),
              _buildStep3(),
            ][_step],
          ),
        ),

        // Navigation buttons
        Container(
          padding: const EdgeInsets.all(20),
          color: AppColors.white,
          child: Row(
            children: [
              if (_step > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () =>
                        setState(() => _step--),
                    child: const Text('Back'),
                  ),
                ),
              if (_step > 0) const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _step < 2
                      ? () {
                          final valid = _step == 0
                              ? _validateStep1()
                              : _validateStep2();
                          if (valid) setState(() => _step++);
                        }
                      : _submit,
                  child: Text(_step < 2 ? 'Next' : 'Submit Registration'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Child Details', style: AppTextStyles.headlineMedium),
        const SizedBox(height: 24),
        TextField(
          controller: _firstNameCtrl,
          decoration: const InputDecoration(
            labelText: 'First Name *',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _lastNameCtrl,
          decoration: const InputDecoration(
            labelText: 'Last Name *',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _preferredNameCtrl,
          decoration: const InputDecoration(
            labelText: 'Preferred Name (optional)',
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime(DateTime.now().year - 8),
              firstDate: DateTime(DateTime.now().year - 18),
              lastDate: DateTime(DateTime.now().year - 3),
              helpText: 'Select Date of Birth',
              builder: (context, child) => Theme(
                data: Theme.of(context).copyWith(
                  colorScheme: const ColorScheme.light(
                    primary: AppColors.primaryRed,
                  ),
                ),
                child: child!,
              ),
            );
            if (picked != null) setState(() => _dob = picked);
          },
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(
            _dob == null
                ? 'Select Date of Birth *'
                : AppDateUtils.formatDate(_dob!),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
            alignment: Alignment.centerLeft,
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _gender,
          decoration: const InputDecoration(
            labelText: 'Gender (optional)',
            prefixIcon: Icon(Icons.wc_outlined),
          ),
          items: const [
            DropdownMenuItem(value: 'Male', child: Text('Male')),
            DropdownMenuItem(value: 'Female', child: Text('Female')),
            DropdownMenuItem(value: 'Other', child: Text('Other')),
          ],
          onChanged: (v) => setState(() => _gender = v),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Health & Consent', style: AppTextStyles.headlineMedium),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Does your child have food allergies?'),
                  value: _hasAllergies,
                  onChanged: (v) => setState(() => _hasAllergies = v),
                  activeColor: AppColors.primaryRed,
                  contentPadding: EdgeInsets.zero,
                ),
                if (_hasAllergies) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _allergyCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Please describe the allergies *',
                      hintText: 'e.g. Peanuts, dairy, gluten...',
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Photo Consent', style: AppTextStyles.headlineSmall),
                const SizedBox(height: 8),
                Text(
                  'The Dhamma School may wish to use student photos in '
                  'school newsletters, social media, and other materials. '
                  'Please indicate whether you consent to your child\'s '
                  'photo being published.',
                  style: AppTextStyles.bodySmall,
                ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  title: const Text(
                      'I consent to my child\'s photo being published'),
                  value: _photoConsent,
                  onChanged: (v) =>
                      setState(() => _photoConsent = v ?? false),
                  activeColor: AppColors.primaryRed,
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Student Photo', style: AppTextStyles.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'Upload a recent photo of your child. '
          'This is used by teachers for identification.',
          style: AppTextStyles.bodyMedium,
        ),
        const SizedBox(height: 32),
        Center(
          child: GestureDetector(
            onTap: _pickPhoto,
            child: _photoFile == null
                ? Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      color: AppColors.creamYellow,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.darkBrown.withAlpha(80),
                        width: 2,
                        strokeAlign: BorderSide.strokeAlignOutside,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.add_a_photo_outlined,
                          size: 48,
                          color: AppColors.darkBrown,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to upload photo',
                          style: AppTextStyles.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(
                      _photoFile!,
                      width: 160,
                      height: 160,
                      fit: BoxFit.cover,
                    ),
                  ),
          ),
        ),
        if (_photoFile != null) ...[
          const SizedBox(height: 16),
          Center(
            child: TextButton.icon(
              onPressed: _pickPhoto,
              icon: const Icon(Icons.edit),
              label: const Text('Change Photo'),
              style: TextButton.styleFrom(
                  foregroundColor: AppColors.primaryRed),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.darkNavy.withAlpha(15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline,
                  size: 16, color: AppColors.darkNavy),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Photo upload is optional but recommended. '
                  'Teachers use photos to identify students during sessions.',
                  style: AppTextStyles.bodySmall,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int step;
  final String label;
  final bool isActive;
  final bool isDone;

  const _StepIndicator({
    required this.step,
    required this.label,
    required this.isActive,
    required this.isDone,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.primaryRed : AppColors.darkBrown.withAlpha(80);

    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? AppColors.primaryRed : Colors.transparent,
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : Text(
                    step.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isActive ? Colors.white : color,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: color,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ],
    );
  }
}
