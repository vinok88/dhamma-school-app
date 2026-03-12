import '../core/constants/app_constants.dart';

enum AttendanceStatus {
  present,
  checkedIn,
  checkedOut,
  absent;

  static AttendanceStatus fromString(String s) {
    switch (s) {
      case AppConstants.statusCheckedIn:
        return AttendanceStatus.checkedIn;
      case AppConstants.statusCheckedOut:
        return AttendanceStatus.checkedOut;
      case AppConstants.statusAbsent:
        return AttendanceStatus.absent;
      default:
        return AttendanceStatus.present;
    }
  }

  String toJson() {
    switch (this) {
      case AttendanceStatus.present:
        return AppConstants.statusPresent;
      case AttendanceStatus.checkedIn:
        return AppConstants.statusCheckedIn;
      case AttendanceStatus.checkedOut:
        return AppConstants.statusCheckedOut;
      case AttendanceStatus.absent:
        return AppConstants.statusAbsent;
    }
  }

  String get displayLabel {
    switch (this) {
      case AttendanceStatus.present:
        return 'Present';
      case AttendanceStatus.checkedIn:
        return 'Checked In';
      case AttendanceStatus.checkedOut:
        return 'Checked Out';
      case AttendanceStatus.absent:
        return 'Absent';
    }
  }

  bool get isPresent =>
      this == AttendanceStatus.present ||
      this == AttendanceStatus.checkedIn ||
      this == AttendanceStatus.checkedOut;
}

class AttendanceModel {
  final String id;
  final String schoolId;
  final String studentId;
  final String teacherId;
  final String classId;
  final DateTime sessionDate;
  final DateTime? checkinTime;
  final DateTime? checkoutTime;
  final AttendanceStatus status;
  final DateTime createdAt;

  // Joined student data
  final String? studentFirstName;
  final String? studentLastName;
  final String? studentPhotoUrl;

  const AttendanceModel({
    required this.id,
    required this.schoolId,
    required this.studentId,
    required this.teacherId,
    required this.classId,
    required this.sessionDate,
    this.checkinTime,
    this.checkoutTime,
    required this.status,
    required this.createdAt,
    this.studentFirstName,
    this.studentLastName,
    this.studentPhotoUrl,
  });

  String get studentFullName =>
      '${studentFirstName ?? ''} ${studentLastName ?? ''}'.trim();

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    final studentData = json['students'] as Map<String, dynamic>?;
    return AttendanceModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      studentId: json['student_id'] as String,
      teacherId: json['teacher_id'] as String,
      classId: json['class_id'] as String,
      sessionDate: DateTime.parse(json['session_date'] as String),
      checkinTime: json['checkin_time'] != null
          ? DateTime.parse(json['checkin_time'] as String)
          : null,
      checkoutTime: json['checkout_time'] != null
          ? DateTime.parse(json['checkout_time'] as String)
          : null,
      status: AttendanceStatus.fromString(
          json['status'] as String? ?? 'absent'),
      createdAt: DateTime.parse(json['created_at'] as String),
      studentFirstName: studentData?['first_name'] as String?,
      studentLastName: studentData?['last_name'] as String?,
      studentPhotoUrl: studentData?['photo_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'student_id': studentId,
      'teacher_id': teacherId,
      'class_id': classId,
      'session_date': sessionDate.toIso8601String().split('T').first,
      'checkin_time': checkinTime?.toIso8601String(),
      'checkout_time': checkoutTime?.toIso8601String(),
      'status': status.toJson(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  AttendanceModel copyWith({
    String? id,
    String? schoolId,
    String? studentId,
    String? teacherId,
    String? classId,
    DateTime? sessionDate,
    DateTime? checkinTime,
    DateTime? checkoutTime,
    AttendanceStatus? status,
    DateTime? createdAt,
    String? studentFirstName,
    String? studentLastName,
    String? studentPhotoUrl,
  }) {
    return AttendanceModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      studentId: studentId ?? this.studentId,
      teacherId: teacherId ?? this.teacherId,
      classId: classId ?? this.classId,
      sessionDate: sessionDate ?? this.sessionDate,
      checkinTime: checkinTime ?? this.checkinTime,
      checkoutTime: checkoutTime ?? this.checkoutTime,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      studentFirstName: studentFirstName ?? this.studentFirstName,
      studentLastName: studentLastName ?? this.studentLastName,
      studentPhotoUrl: studentPhotoUrl ?? this.studentPhotoUrl,
    );
  }
}
