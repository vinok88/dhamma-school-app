import 'package:intl/intl.dart';

/// Date formatting and age calculation helpers.
class AppDateUtils {
  AppDateUtils._();

  static final DateFormat _displayDate = DateFormat('dd MMM yyyy');
  static final DateFormat _displayDateShort = DateFormat('dd MMM');
  static final DateFormat _displayDateTime = DateFormat('dd MMM yyyy, h:mm a');
  static final DateFormat _displayTime = DateFormat('h:mm a');
  static final DateFormat _isoDate = DateFormat('yyyy-MM-dd');
  static final DateFormat _displayMonthYear = DateFormat('MMMM yyyy');
  static final DateFormat _dayOfWeek = DateFormat('EEEE');

  /// Returns age in years from a date of birth.
  static int calculateAge(DateTime dob) {
    final today = DateTime.now();
    int age = today.year - dob.year;
    if (today.month < dob.month ||
        (today.month == dob.month && today.day < dob.day)) {
      age--;
    }
    return age;
  }

  /// Returns "5 years old" or "5" depending on [includeUnit].
  static String formatAge(DateTime dob, {bool includeUnit = true}) {
    final age = calculateAge(dob);
    return includeUnit ? '$age years old' : '$age';
  }

  /// Formats a date as "12 Mar 2026"
  static String formatDate(DateTime date) => _displayDate.format(date);

  /// Formats a date as "12 Mar"
  static String formatDateShort(DateTime date) =>
      _displayDateShort.format(date);

  /// Formats a datetime as "12 Mar 2026, 9:30 AM"
  static String formatDateTime(DateTime dateTime) =>
      _displayDateTime.format(dateTime);

  /// Formats a time as "9:30 AM"
  static String formatTime(DateTime dateTime) => _displayTime.format(dateTime);

  /// Formats a date as "yyyy-MM-dd" for Supabase / API use
  static String toIsoDate(DateTime date) => _isoDate.format(date);

  /// Parses a "yyyy-MM-dd" string to DateTime
  static DateTime parseIsoDate(String s) => _isoDate.parse(s);

  /// Formats as "March 2026"
  static String formatMonthYear(DateTime date) =>
      _displayMonthYear.format(date);

  /// Formats as "Sunday"
  static String formatDayOfWeek(DateTime date) => _dayOfWeek.format(date);

  /// Returns a relative time string: "Just now", "5m ago", "2h ago", "Yesterday", or full date
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return formatDate(dateTime);
  }

  /// Returns true if [date] is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  /// Returns the start of the day (midnight)
  static DateTime startOfDay(DateTime date) =>
      DateTime(date.year, date.month, date.day);

  /// Returns the end of the day (23:59:59)
  static DateTime endOfDay(DateTime date) =>
      DateTime(date.year, date.month, date.day, 23, 59, 59);

  /// Returns the most recent Sunday on or before [date]
  static DateTime lastSunday(DateTime date) {
    final daysFromSunday = date.weekday % 7;
    return startOfDay(date.subtract(Duration(days: daysFromSunday)));
  }

  /// Returns a list of the last [count] Sundays (most recent first)
  static List<DateTime> lastNSundays(int count) {
    final sundays = <DateTime>[];
    var current = lastSunday(DateTime.now());
    for (int i = 0; i < count; i++) {
      sundays.add(current);
      current = current.subtract(const Duration(days: 7));
    }
    return sundays;
  }
}
