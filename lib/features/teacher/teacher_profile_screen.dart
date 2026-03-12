import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/storage_service.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/loading_overlay.dart';

class TeacherProfileScreen extends ConsumerStatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  ConsumerState<TeacherProfileScreen> createState() =>
      _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends ConsumerState<TeacherProfileScreen> {
  bool _isEditing = false;
  bool _isLoading = false;
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _addressCtrl;
  File? _newPhoto;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController();
    _phoneCtrl = TextEditingController();
    _addressCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
        source: ImageSource.gallery, maxWidth: 800, maxHeight: 800);
    if (picked != null) setState(() => _newPhoto = File(picked.path));
  }

  Future<void> _save() async {
    setState(() => _isLoading = true);
    try {
      final profile = ref.read(userProfileProvider).valueOrNull;
      String? photoUrl;

      if (_newPhoto != null && profile != null) {
        photoUrl = await StorageService.instance
            .uploadProfilePhoto(_newPhoto!, profile.id);
      }

      await ref.read(authNotifierProvider.notifier).updateProfile({
        'full_name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        if (photoUrl != null) 'profile_photo_url': photoUrl,
      });

      if (mounted) {
        setState(() => _isEditing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated'),
            backgroundColor: AppColors.successGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
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
    final profile = ref.watch(userProfileProvider);
    return profile.when(
      data: (user) {
        if (user == null) return const SizedBox.shrink();
        if (!_isEditing) {
          _nameCtrl.text = user.fullName ?? '';
          _phoneCtrl.text = user.phone ?? '';
          _addressCtrl.text = user.address ?? '';
        }
        return LoadingStack(
          isLoading: _isLoading,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Status banner for pending teachers
                if (user.status == UserStatus.pending)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.pendingAmber.withAlpha(30),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.pendingAmber.withAlpha(80)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.hourglass_empty,
                            color: AppColors.pendingAmber),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Your teacher registration is pending approval by the Principal.',
                            style: AppTextStyles.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Profile photo
                Center(
                  child: GestureDetector(
                    onTap: _isEditing ? _pickPhoto : null,
                    child: Stack(
                      children: [
                        _newPhoto != null
                            ? ClipOval(
                                child: Image.file(_newPhoto!,
                                    width: 100,
                                    height: 100,
                                    fit: BoxFit.cover))
                            : NetworkPhotoWidget(
                                imageUrl: user.profilePhotoUrl,
                                size: 100,
                                isCircle: true),
                        if (_isEditing)
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                  color: AppColors.primaryRed,
                                  shape: BoxShape.circle),
                              child: const Icon(Icons.edit,
                                  size: 14, color: Colors.white),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(user.displayName, style: AppTextStyles.headlineSmall),
                Text('Teacher', style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.darkNavy, fontWeight: FontWeight.w600)),
                const SizedBox(height: 24),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Text('My Information',
                                style: AppTextStyles.headlineSmall),
                            const Spacer(),
                            TextButton(
                              onPressed: () =>
                                  setState(() => _isEditing = !_isEditing),
                              child:
                                  Text(_isEditing ? 'Cancel' : 'Edit'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _nameCtrl,
                          enabled: _isEditing,
                          decoration: const InputDecoration(
                            labelText: 'Full Name',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _phoneCtrl,
                          enabled: _isEditing,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Phone Number',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _addressCtrl,
                          enabled: _isEditing,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            labelText: 'Address',
                            prefixIcon: Icon(Icons.home_outlined),
                          ),
                        ),
                        if (_isEditing) ...[
                          const SizedBox(height: 16),
                          FilledButton(
                              onPressed: _save,
                              child: const Text('Save')),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () async {
                    await ref.read(authNotifierProvider.notifier).signOut();
                    if (context.mounted) context.go(AppRoutes.login);
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.errorRed,
                    side: const BorderSide(color: AppColors.errorRed),
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () =>
          const Center(child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (_, __) => const Center(child: Text('Error')),
    );
  }
}
