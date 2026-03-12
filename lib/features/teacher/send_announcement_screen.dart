import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../providers/teacher_provider.dart';
import '../../providers/announcement_provider.dart';
import '../../widgets/loading_overlay.dart';
import '../../widgets/announcement_card.dart';
import '../../models/announcement_model.dart';

class SendAnnouncementScreen extends ConsumerStatefulWidget {
  const SendAnnouncementScreen({super.key});

  @override
  ConsumerState<SendAnnouncementScreen> createState() =>
      _SendAnnouncementScreenState();
}

class _SendAnnouncementScreenState
    extends ConsumerState<SendAnnouncementScreen> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  bool _isLoading = false;
  bool _showPreview = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_titleCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Title and message are required'),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = ref.read(currentUserProvider);
      final schoolId = ref.read(currentSchoolIdProvider);
      final classData = ref.read(myClassProvider).valueOrNull;

      if (user == null || schoolId == null) {
        throw Exception('Not authenticated');
      }

      await ref.read(announcementNotifierProvider.notifier).createAnnouncement({
        'school_id': schoolId,
        'author_id': user.id,
        'title': _titleCtrl.text.trim(),
        'body': _bodyCtrl.text.trim(),
        'type': 'class',
        'target_class_id': classData?['id'],
      });

      if (mounted) {
        _titleCtrl.clear();
        _bodyCtrl.clear();
        setState(() => _showPreview = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Announcement published!'),
            backgroundColor: AppColors.successGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send: ${e.toString()}'),
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
    final myClass = ref.watch(myClassProvider).valueOrNull;

    return LoadingStack(
      isLoading: _isLoading,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scope indicator (teachers can only send to their own class)
            Card(
              color: AppColors.darkNavy.withAlpha(15),
              child: ListTile(
                leading: const Icon(Icons.groups,
                    color: AppColors.darkNavy),
                title: Text(
                  myClass != null
                      ? 'Sending to: ${myClass['name']}'
                      : 'No class assigned',
                  style: AppTextStyles.bodyMedium
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                subtitle: const Text(
                  'Teachers can only send to their assigned class',
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
            ),
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
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: 'Message *',
                prefixIcon: Icon(Icons.text_fields),
                alignLabelWithHint: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),

            // Preview toggle
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
                const SizedBox(height: 16),
                Text('Preview:', style: AppTextStyles.labelLarge),
                const SizedBox(height: 8),
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
                    type: AnnouncementType.clazz,
                    publishedAt: DateTime.now(),
                    createdAt: DateTime.now(),
                  ),
                ),
              ],
            ],

            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: myClass != null ? _send : null,
              icon: const Icon(Icons.send),
              label: const Text('Publish & Notify'),
            ),
          ],
        ),
      ),
    );
  }
}
