import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../models/event_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
import '../../widgets/event_card.dart';
import '../../widgets/loading_overlay.dart';

class EventManagementScreen extends ConsumerStatefulWidget {
  const EventManagementScreen({super.key});

  @override
  ConsumerState<EventManagementScreen> createState() =>
      _EventManagementScreenState();
}

class _EventManagementScreenState extends ConsumerState<EventManagementScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
  }

  @override
  Widget build(BuildContext context) {
    final schoolId = ref.watch(currentSchoolIdProvider);
    if (schoolId == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed));
    }

    final eventsAsync = ref.watch(eventsProvider(schoolId));

    return Scaffold(
      backgroundColor: AppColors.creamYellow,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEventDialog(context, ref, schoolId),
        icon: const Icon(Icons.add),
        label: const Text('Add Event'),
      ),
      body: eventsAsync.when(
        data: (events) => _buildContent(context, ref, events, schoolId),
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryRed)),
        error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
      ),
    );
  }

  Map<DateTime, List<EventModel>> _groupEvents(List<EventModel> events) {
    final Map<DateTime, List<EventModel>> grouped = {};
    for (final event in events) {
      final day = AppDateUtils.startOfDay(event.startDatetime);
      grouped[day] = [...(grouped[day] ?? []), event];
    }
    return grouped;
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    List<EventModel> events,
    String schoolId,
  ) {
    final grouped = _groupEvents(events);
    final selectedEvents = _getEventsForDay(_selectedDay ?? _focusedDay, grouped);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 700;

        if (isWide) {
          return Row(
            children: [
              SizedBox(
                width: 360,
                child: _buildCalendar(grouped),
              ),
              const VerticalDivider(width: 1),
              Expanded(
                child: _buildEventList(
                    context, ref, selectedEvents, schoolId),
              ),
            ],
          );
        } else {
          return Column(
            children: [
              _buildCalendar(grouped),
              const Divider(height: 1),
              Expanded(
                child: _buildEventList(
                    context, ref, selectedEvents, schoolId),
              ),
            ],
          );
        }
      },
    );
  }

  Widget _buildCalendar(Map<DateTime, List<EventModel>> grouped) {
    return TableCalendar<EventModel>(
      firstDay: DateTime.now().subtract(const Duration(days: 365)),
      lastDay: DateTime.now().add(const Duration(days: 365 * 2)),
      focusedDay: _focusedDay,
      selectedDayPredicate: (day) => isSameDay(day, _selectedDay),
      eventLoader: (day) => _getEventsForDay(day, grouped),
      calendarStyle: const CalendarStyle(
        selectedDecoration:
            BoxDecoration(color: AppColors.primaryRed, shape: BoxShape.circle),
        todayDecoration: BoxDecoration(
          color: AppColors.darkNavy,
          shape: BoxShape.circle,
        ),
        markerDecoration: BoxDecoration(
          color: AppColors.goldAmber,
          shape: BoxShape.circle,
        ),
      ),
      headerStyle: HeaderStyle(
        formatButtonVisible: false,
        titleTextStyle: AppTextStyles.headlineSmall,
      ),
      onDaySelected: (selected, focused) {
        setState(() {
          _selectedDay = selected;
          _focusedDay = focused;
        });
      },
    );
  }

  Widget _buildEventList(
    BuildContext context,
    WidgetRef ref,
    List<EventModel> events,
    String schoolId,
  ) {
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.event_available_outlined,
                size: 52, color: AppColors.darkBrown),
            const SizedBox(height: 12),
            Text('No events on this day', style: AppTextStyles.bodyMedium),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: events.length,
      itemBuilder: (context, index) => EventCard(
        event: events[index],
        showActions: true,
        onEdit: () => _showEditEventDialog(
            context, ref, events[index], schoolId),
        onDelete: () => _confirmDelete(context, ref, events[index].id),
      ),
    );
  }

  List<EventModel> _getEventsForDay(
      DateTime day, Map<DateTime, List<EventModel>> grouped) {
    return grouped[AppDateUtils.startOfDay(day)] ?? [];
  }

  void _showAddEventDialog(
      BuildContext context, WidgetRef ref, String schoolId) {
    showDialog(
      context: context,
      builder: (context) => _EventDialog(
        schoolId: schoolId,
        initialDate: _selectedDay ?? DateTime.now(),
      ),
    );
  }

  void _showEditEventDialog(
      BuildContext context, WidgetRef ref, EventModel event, String schoolId) {
    showDialog(
      context: context,
      builder: (context) => _EventDialog(
        schoolId: schoolId,
        existingEvent: event,
        initialDate: event.startDatetime,
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, String eventId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Event'),
        content: const Text('Are you sure you want to delete this event?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref
                    .read(eventNotifierProvider.notifier)
                    .deleteEvent(eventId);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: ${e.toString()}'),
                      backgroundColor: AppColors.errorRed,
                    ),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.errorRed),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _EventDialog extends ConsumerStatefulWidget {
  final String schoolId;
  final EventModel? existingEvent;
  final DateTime initialDate;

  const _EventDialog({
    required this.schoolId,
    this.existingEvent,
    required this.initialDate,
  });

  @override
  ConsumerState<_EventDialog> createState() => _EventDialogState();
}

class _EventDialogState extends ConsumerState<_EventDialog> {
  late TextEditingController _titleCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _locationCtrl;
  EventType _eventType = EventType.special;
  late DateTime _startDatetime;
  DateTime? _endDatetime;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existingEvent;
    _titleCtrl = TextEditingController(text: e?.title ?? '');
    _descCtrl = TextEditingController(text: e?.description ?? '');
    _locationCtrl = TextEditingController(text: e?.location ?? '');
    _eventType = e?.eventType ?? EventType.special;
    _startDatetime = e?.startDatetime ?? widget.initialDate;
    _endDatetime = e?.endDatetime;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingEvent != null;

    return AlertDialog(
      title: Text(isEditing ? 'Edit Event' : 'Add Event'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Event Title *'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descCtrl,
              maxLines: 3,
              decoration:
                  const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<EventType>(
              value: _eventType,
              decoration:
                  const InputDecoration(labelText: 'Event Type'),
              items: EventType.values
                  .map((t) => DropdownMenuItem(
                        value: t,
                        child: Text(t.displayLabel),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _eventType = v!),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final picked = await showDateTimePicker(context, _startDatetime);
                if (picked != null) setState(() => _startDatetime = picked);
              },
              icon: const Icon(Icons.calendar_today_outlined),
              label: Text(
                  'Start: ${AppDateUtils.formatDateTime(_startDatetime)}'),
              style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  alignment: Alignment.centerLeft),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () async {
                final picked = await showDateTimePicker(
                    context, _endDatetime ?? _startDatetime);
                if (picked != null) setState(() => _endDatetime = picked);
              },
              icon: const Icon(Icons.schedule_outlined),
              label: Text(_endDatetime == null
                  ? 'End: (optional)'
                  : 'End: ${AppDateUtils.formatDateTime(_endDatetime!)}'),
              style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  alignment: Alignment.centerLeft),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _locationCtrl,
              decoration: const InputDecoration(labelText: 'Location'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isLoading ? null : _save,
          child: Text(_isLoading ? 'Saving...' : 'Save'),
        ),
      ],
    );
  }

  Future<DateTime?> showDateTimePicker(
      BuildContext context, DateTime initial) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date == null || !context.mounted) return null;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return null;

    return DateTime(
        date.year, date.month, date.day, time.hour, time.minute);
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) throw Exception('Not authenticated');

      final data = {
        'school_id': widget.schoolId,
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim().isEmpty
            ? null
            : _descCtrl.text.trim(),
        'event_type': _eventType.toJson(),
        'start_datetime': _startDatetime.toIso8601String(),
        'end_datetime': _endDatetime?.toIso8601String(),
        'location': _locationCtrl.text.trim().isEmpty
            ? null
            : _locationCtrl.text.trim(),
        'created_by': user.id,
      };

      if (widget.existingEvent != null) {
        await ref
            .read(eventNotifierProvider.notifier)
            .updateEvent(widget.existingEvent!.id, data);
      } else {
        await ref
            .read(eventNotifierProvider.notifier)
            .createEvent(data);
      }

      if (context.mounted) Navigator.pop(context);
    } catch (e) {
      if (context.mounted) {
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
}
