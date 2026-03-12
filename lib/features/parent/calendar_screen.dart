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

class CalendarScreen extends ConsumerStatefulWidget {
  final bool embedded;

  const CalendarScreen({super.key, this.embedded = false});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
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
        child: CircularProgressIndicator(color: AppColors.primaryRed),
      );
    }

    final eventsAsync = ref.watch(eventsProvider(schoolId));

    return eventsAsync.when(
      data: (events) => _buildCalendar(events),
      loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (error, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Failed to load events', style: AppTextStyles.bodyMedium),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () =>
                  ref.refresh(eventsProvider(schoolId)),
              child: const Text('Retry'),
            ),
          ],
        ),
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

  List<EventModel> _getEventsForDay(
    DateTime day,
    Map<DateTime, List<EventModel>> grouped,
  ) {
    return grouped[AppDateUtils.startOfDay(day)] ?? [];
  }

  Widget _buildCalendar(List<EventModel> allEvents) {
    final grouped = _groupEvents(allEvents);
    final selectedEvents = _getEventsForDay(_selectedDay ?? _focusedDay, grouped);

    return Column(
      children: [
        TableCalendar<EventModel>(
          firstDay: DateTime.now().subtract(const Duration(days: 365)),
          lastDay: DateTime.now().add(const Duration(days: 365)),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(day, _selectedDay),
          eventLoader: (day) => _getEventsForDay(day, grouped),
          calendarStyle: CalendarStyle(
            selectedDecoration: const BoxDecoration(
              color: AppColors.primaryRed,
              shape: BoxShape.circle,
            ),
            todayDecoration: BoxDecoration(
              color: AppColors.darkNavy.withAlpha(40),
              shape: BoxShape.circle,
            ),
            markerDecoration: const BoxDecoration(
              color: AppColors.goldAmber,
              shape: BoxShape.circle,
            ),
            defaultTextStyle: AppTextStyles.bodyMedium,
            weekendTextStyle: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.primaryRed.withAlpha(180),
            ),
            selectedTextStyle: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.white,
              fontWeight: FontWeight.w600,
            ),
            todayTextStyle: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.darkNavy,
              fontWeight: FontWeight.w600,
            ),
          ),
          headerStyle: HeaderStyle(
            formatButtonVisible: false,
            titleTextStyle: AppTextStyles.headlineSmall,
            leftChevronIcon: const Icon(Icons.chevron_left,
                color: AppColors.darkNavy),
            rightChevronIcon: const Icon(Icons.chevron_right,
                color: AppColors.darkNavy),
            headerPadding:
                const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          ),
          onDaySelected: (selected, focused) {
            setState(() {
              _selectedDay = selected;
              _focusedDay = focused;
            });
          },
          onPageChanged: (focused) {
            _focusedDay = focused;
          },
        ),
        const Divider(height: 1),
        Expanded(
          child: selectedEvents.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.event_available_outlined,
                        size: 52,
                        color: AppColors.darkBrown.withAlpha(80),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No events on this day',
                        style: AppTextStyles.bodyMedium,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: selectedEvents.length,
                  itemBuilder: (context, index) =>
                      EventCard(event: selectedEvents[index]),
                ),
        ),
      ],
    );
  }
}
