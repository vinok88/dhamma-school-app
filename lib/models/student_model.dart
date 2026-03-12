import '../core/constants/app_constants.dart';

enum StudentStatus {
  pending,
  underReview,
  approved,
  rejected,
  active,
  inactive,
  dropped;

  static StudentStatus fromString(String s) {
    switch (s) {
      case AppConstants.studentUnderReview:
        return StudentStatus.underReview;
      case AppConstants.studentApproved:
        return StudentStatus.approved;
      case AppConstants.studentRejected:
        return StudentStatus.rejected;
      case AppConstants.studentActive:
        return StudentStatus.active;
      case AppConstants.studentInactive:
        return StudentStatus.inactive;
      case AppConstants.studentDropped:
        return StudentStatus.dropped;
      default:
        return StudentStatus.pending;
    }
  }

  String toJson() {
    switch (this) {
      case StudentStatus.pending:
        return AppConstants.studentPending;
      case StudentStatus.underReview:
        return AppConstants.studentUnderReview;
      case StudentStatus.approved:
        return AppConstants.studentApproved;
      case StudentStatus.rejected:
        return AppConstants.studentRejected;
      case StudentStatus.active:
        return AppConstants.studentActive;
      case StudentStatus.inactive:
        return AppConstants.studentInactive;
      case StudentStatus.dropped:
        return AppConstants.studentDropped;
    }
  }

  String get displayLabel {
    switch (this) {
      case StudentStatus.pending:
        return 'Pending';
      case StudentStatus.underReview:
        return 'Under Review';
      case StudentStatus.approved:
        return 'Approved';
      case StudentStatus.rejected:
        return 'Rejected';
      case StudentStatus.active:
        return 'Active';
      case StudentStatus.inactive:
        return 'Inactive';
      case StudentStatus.dropped:
        return 'Dropped';
    }
  }

  bool get isEditable =>
      this == StudentStatus.pending || this == StudentStatus.rejected;
}

class StudentModel {
  final String id;
  final String schoolId;
  final String firstName;
  final String lastName;
  final String? preferredName;
  final DateTime dob;
  final String? gender;
  final bool hasAllergies;
  final String? allergyNotes;
  final String? photoUrl;
  final bool photoPublishConsent;
  final String parentId;
  final String? classId;
  final String? className;
  final StudentStatus status;
  final String? statusNote;
  final DateTime createdAt;
  final DateTime updatedAt;

  // From joined parent profile
  final String? parentName;
  final String? parentPhone;
  final String? parentAddress;

  const StudentModel({
    required this.id,
    required this.schoolId,
    required this.firstName,
    required this.lastName,
    this.preferredName,
    required this.dob,
    this.gender,
    required this.hasAllergies,
    this.allergyNotes,
    this.photoUrl,
    required this.photoPublishConsent,
    required this.parentId,
    this.classId,
    this.className,
    required this.status,
    this.statusNote,
    required this.createdAt,
    required this.updatedAt,
    this.parentName,
    this.parentPhone,
    this.parentAddress,
  });

  String get fullName => '$firstName $lastName';
  String get displayName => preferredName ?? firstName;

  /// Computed age from DOB
  int get age {
    final today = DateTime.now();
    int age = today.year - dob.year;
    if (today.month < dob.month ||
        (today.month == dob.month && today.day < dob.day)) {
      age--;
    }
    return age;
  }

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    final classData = json['classes'] as Map<String, dynamic>?;
    final parentData = json['user_profiles'] as Map<String, dynamic>?;

    return StudentModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      preferredName: json['preferred_name'] as String?,
      dob: DateTime.parse(json['dob'] as String),
      gender: json['gender'] as String?,
      hasAllergies: json['has_allergies'] as bool? ?? false,
      allergyNotes: json['allergy_notes'] as String?,
      photoUrl: json['photo_url'] as String?,
      photoPublishConsent: json['photo_publish_consent'] as bool? ?? false,
      parentId: json['parent_id'] as String,
      classId: json['class_id'] as String?,
      className: classData?['name'] as String?,
      status: StudentStatus.fromString(json['status'] as String? ?? 'pending'),
      statusNote: json['status_note'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(
          json['updated_at'] as String? ?? json['created_at'] as String),
      parentName: parentData?['full_name'] as String?,
      parentPhone: parentData?['phone'] as String?,
      parentAddress: parentData?['address'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'first_name': firstName,
      'last_name': lastName,
      'preferred_name': preferredName,
      'dob': dob.toIso8601String().split('T').first,
      'gender': gender,
      'has_allergies': hasAllergies,
      'allergy_notes': allergyNotes,
      'photo_url': photoUrl,
      'photo_publish_consent': photoPublishConsent,
      'parent_id': parentId,
      'class_id': classId,
      'status': status.toJson(),
      'status_note': statusNote,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  StudentModel copyWith({
    String? id,
    String? schoolId,
    String? firstName,
    String? lastName,
    String? preferredName,
    DateTime? dob,
    String? gender,
    bool? hasAllergies,
    String? allergyNotes,
    String? photoUrl,
    bool? photoPublishConsent,
    String? parentId,
    String? classId,
    String? className,
    StudentStatus? status,
    String? statusNote,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? parentName,
    String? parentPhone,
    String? parentAddress,
  }) {
    return StudentModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      preferredName: preferredName ?? this.preferredName,
      dob: dob ?? this.dob,
      gender: gender ?? this.gender,
      hasAllergies: hasAllergies ?? this.hasAllergies,
      allergyNotes: allergyNotes ?? this.allergyNotes,
      photoUrl: photoUrl ?? this.photoUrl,
      photoPublishConsent: photoPublishConsent ?? this.photoPublishConsent,
      parentId: parentId ?? this.parentId,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      status: status ?? this.status,
      statusNote: statusNote ?? this.statusNote,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      parentName: parentName ?? this.parentName,
      parentPhone: parentPhone ?? this.parentPhone,
      parentAddress: parentAddress ?? this.parentAddress,
    );
  }
}
