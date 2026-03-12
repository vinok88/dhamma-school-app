import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../services/storage_service.dart';
import '../../widgets/photo_placeholder.dart';
import '../../widgets/loading_overlay.dart';

class ParentProfileScreen extends ConsumerStatefulWidget {
  const ParentProfileScreen({super.key});

  @override
  ConsumerState<ParentProfileScreen> createState() =>
      _ParentProfileScreenState();
}

class _ParentProfileScreenState extends ConsumerState<ParentProfileScreen> {
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
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
    );
    if (picked != null) {
      setState(() => _newPhoto = File(picked.path));
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);
    try {
      String? photoUrl;
      final profile = ref.read(userProfileProvider).valueOrNull;

      if (_newPhoto != null && profile != null) {
        photoUrl = await StorageService.instance.uploadProfilePhoto(
          _newPhoto!,
          profile.id,
        );
      }

      final updates = {
        'full_name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        if (photoUrl != null) 'profile_photo_url': photoUrl,
      };

      await ref.read(authNotifierProvider.notifier).updateProfile(updates);

      if (mounted) {
        setState(() => _isEditing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: AppColors.successGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
                backgroundColor: AppColors.errorRed),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(authNotifierProvider.notifier).signOut();
      if (mounted) context.go(AppRoutes.login);
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
                // Profile Photo
                Center(
                  child: GestureDetector(
                    onTap: _isEditing ? _pickPhoto : null,
                    child: Stack(
                      children: [
                        _newPhoto != null
                            ? ClipOval(
                                child: Image.file(
                                  _newPhoto!,
                                  width: 100,
                                  height: 100,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : NetworkPhotoWidget(
                                imageUrl: user.profilePhotoUrl,
                                size: 100,
                                isCircle: true,
                              ),
                        if (_isEditing)
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: AppColors.primaryRed,
                                shape: BoxShape.circle,
                              ),
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
                Text(user.email ?? '', style: AppTextStyles.bodySmall),
                const SizedBox(height: 24),

                // Language Toggle
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.language),
                    title: const Text('Language'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _LangChip(label: 'EN', isSelected: true),
                        const SizedBox(width: 8),
                        _LangChip(label: 'සිං', isSelected: false),
                      ],
                    ),
                    // TODO: Implement locale switching using flutter_localizations
                  ),
                ),
                const SizedBox(height: 16),

                // Profile Fields
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text('My Information',
                                style: AppTextStyles.headlineSmall),
                            const Spacer(),
                            TextButton(
                              onPressed: () =>
                                  setState(() => _isEditing = !_isEditing),
                              child: Text(_isEditing ? 'Cancel' : 'Edit'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
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
                          controller: TextEditingController(
                              text: user.email ?? ''),
                          enabled: false,
                          decoration: const InputDecoration(
                            labelText: 'Email (managed via sign-in provider)',
                            prefixIcon: Icon(Icons.email_outlined),
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
                          const SizedBox(height: 20),
                          FilledButton(
                            onPressed: _saveProfile,
                            child: const Text('Save Changes'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: _signOut,
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.errorRed,
                    side: const BorderSide(color: AppColors.errorRed),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (_, __) => const Center(child: Text('Error loading profile')),
    );
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  const _LangChip({required this.label, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      // TODO: Implement locale switching via Riverpod locale provider
      onTap: () {},
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.darkNavy : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.darkNavy),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.white : AppColors.darkNavy,
          ),
        ),
      ),
    );
  }
}
