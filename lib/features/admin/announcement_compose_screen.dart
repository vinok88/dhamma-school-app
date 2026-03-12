import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../models/announcement_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/announcement_provider.dart';
import '../../providers/class_provider.dart';
import '../../widgets/announcement_card.dart';
import '../../widgets/loading_overlay.dart';

class AnnouncementComposeScreen extends ConsumerStatefulWidget {
  const AnnouncementComposeScreen({super.key});

  @override
  ConsumerState<AnnouncementComposeScreen> createState() =>
      _AnnouncementComposeScreenState();
}

class _AnnouncementComposeScreenState
    extends ConsumerState<AnnouncementComposeScreen> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  AnnouncementType _type = AnnouncementType.school;
  String? _selectedClassId;
  bool _showPreview = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _publish() async {
    if (_titleCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Title and message are required'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }
    if (_type == AnnouncementType.clazz && _selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a target class'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = ref.read(currentUserProvider);
      final schoolId = ref.read(currentSchoolIdProvider);
      if (user == null || schoolId == null) throw Exception('Not authenticated');

      await ref.read(announcementNotifierProvider.notifier).createAnnouncement({
        'school_id': schoolId,
        'author_id': user.id,
        'title': _titleCtrl.text.trim(),
        'body': _bodyCtrl.text.trim(),
        'type': _type.toJson(),
        'target_class_id':
            _type == AnnouncementType.clazz ? _selectedClassId : null,
      });

      if (mounted) {
        _titleCtrl.clear();
        _bodyCtrl.clear();
        setState(() {
          _type = AnnouncementType.school;
          _selectedClassId = null;
          _showPreview = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Announcement published and notifications sent!'),
            backgroundColor: AppColors.successGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${e.toString()}'),
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
    final schoolId = ref.watch(currentSchoolIdProvider);
    final classesAsync =
        schoolId != null ? ref.watch(classesProvider(schoolId)) : null;

    return LoadingStack(
      isLoading: _isLoading,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Compose Announcement',
                style: AppTextStyles.displayLarge),
            const SizedBox(height: 24),

            // Scope selector
            Text('Scope', style: AppTextStyles.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: AnnouncementType.values.map((type) {
                return ChoiceChip(
                  label: Text(type.displayLabel),
                  selected: _type == type,
                  onSelected: (_) => setState(() {
                    _type = type;
                    if (type != AnnouncementType.clazz) {
                      _selectedClassId = null;
                    }
                  }),
                  selectedColor: type == AnnouncementType.emergency
                      ? AppColors.errorRed.withAlpha(40)
                      : AppColors.primaryRed.withAlpha(30),
                  checkmarkColor: type == AnnouncementType.emergency
                      ? AppColors.errorRed
                      : AppColors.primaryRed,
                );
              }).toList(),
            ),

            // Class selector
            if (_type == AnnouncementType.clazz && classesAsync != null) ...[
              const SizedBox(height: 16),
              classesAsync.when(
                data: (classes) => DropdownButtonFormField<String>(
                  value: _selectedClassId,
                  decoration: const InputDecoration(
                    labelText: 'Target Class *',
                    prefixIcon: Icon(Icons.class_),
                  ),
                  items: classes
                      .map((c) => DropdownMenuItem(
                            value: c.id,
                            child: Text(c.name),
                          ))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _selectedClassId = v),
                ),
                loading: () => const CircularProgressIndicator(
                    color: AppColors.primaryRed),
                error: (_, __) =>
                    const Text('Could not load classes'),
              ),
            ],

            const SizedBox(height: 20),
            TextField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Title *',
                prefixIcon: Icon(Icons.title),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _bodyCtrl,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Message *',
                alignLabelWithHint: true,
                prefixIcon: Icon(Icons.text_fields),
              ),
              onChanged: (_) => setState(() {}),
            ),

            const SizedBox(height: 16),
            if (_titleCtrl.text.isNotEmpty && _bodyCtrl.text.isNotEmpty) ...[
              OutlinedButton.icon(
                onPressed: () =>
                    setState(() => _showPreview = !_showPreview),
                icon: Icon(_showPreview
                    ? Icons.visibility_off
                    : Icons.visibility),
                label:
                    Text(_showPreview ? 'Hide Preview' : 'Preview'),
              ),
              if (_showPreview) ...[
                const SizedBox(height: 12),
                AnnouncementCard(
                  announcement: AnnouncementModel(
                    id: 'preview',
                    schoolId: '',
                    authorId: '',
                    authorName: ref
                        .read(userProfileProvider)
                        .valueOrNull
                        ?.displayName,
                    title: _titleCtrl.text,
                    body: _bodyCtrl.text,
                    type: _type,
                    publishedAt: DateTime.now(),
                    createdAt: DateTime.now(),
                  ),
                ),
              ],
            ],

            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _publish,
              icon: const Icon(Icons.send),
              label: const Text('Publish & Notify'),
              style: _type == AnnouncementType.emergency
                  ? FilledButton.styleFrom(
                      backgroundColor: AppColors.errorRed)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
