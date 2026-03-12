/// Form validation helpers for use with reactive_forms.
class AppValidators {
  AppValidators._();

  /// Australian phone number validator (basic)
  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final digits = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (!RegExp(r'^(\+61|0)[2-9]\d{8}$').hasMatch(digits)) {
      return 'Enter a valid Australian phone number';
    }
    return null;
  }

  /// Email validator
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    if (!RegExp(r'^[\w\.\-]+@[\w\-]+\.\w{2,}$').hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// Required field validator
  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return fieldName != null ? '$fieldName is required' : 'This field is required';
    }
    return null;
  }

  /// Minimum length validator
  static String? Function(String?) minLength(int min, {String? fieldName}) {
    return (String? value) {
      if (value == null || value.length < min) {
        final name = fieldName ?? 'This field';
        return '$name must be at least $min characters';
      }
      return null;
    };
  }

  /// Maximum length validator
  static String? Function(String?) maxLength(int max, {String? fieldName}) {
    return (String? value) {
      if (value != null && value.length > max) {
        final name = fieldName ?? 'This field';
        return '$name must be at most $max characters';
      }
      return null;
    };
  }

  /// Date of birth validator — must be between 3 and 18 years old for a student
  static String? studentDob(DateTime? value) {
    if (value == null) return 'Date of birth is required';
    final now = DateTime.now();
    final age = now.year - value.year -
        ((now.month < value.month ||
                (now.month == value.month && now.day < value.day))
            ? 1
            : 0);
    if (age < 3) return 'Child must be at least 3 years old';
    if (age > 18) return 'Child must be 18 years or younger';
    return null;
  }

  /// Date of birth validator for teacher/adult (must be at least 18)
  static String? adultDob(DateTime? value) {
    if (value == null) return 'Date of birth is required';
    final now = DateTime.now();
    final age = now.year - value.year -
        ((now.month < value.month ||
                (now.month == value.month && now.day < value.day))
            ? 1
            : 0);
    if (age < 18) return 'Must be at least 18 years old';
    return null;
  }

  /// Reactive Forms Map<String, dynamic> validators
  /// Returns a validator map entry for reactive_forms
  static Map<String, dynamic> requiredMap(String key) => {
        key: (value) {
          if (value == null || value.toString().trim().isEmpty) {
            return {'required': true};
          }
          return null;
        },
      };
}
