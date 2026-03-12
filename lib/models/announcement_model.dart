import '../core/constants/app_constants.dart';

enum AnnouncementType {
  school,
  clazz,
  emergency,
  eventReminder;

  static AnnouncementType fromString(String s) {
    switch (s) {
      case AppConstants.announcementClass:
        return AnnouncementType.clazz;
      case AppConstants.announcementEmergency:
        return AnnouncementType.emergency;
      case AppConstants.announcementEventReminder:
        return AnnouncementType.eventReminder;
      default:
        return AnnouncementType.school;
    }
  }

  String toJson() {
    switch (this) {
      case AnnouncementType.school:
        return AppConstants.announcementSchool;
      case AnnouncementType.clazz:
        return AppConstants.announcementClass;
      case AnnouncementType.emergency:
        return AppConstants.announcementEmergency;
      case AnnouncementType.eventReminder:
        return AppConstants.announcementEventReminder;
    }
  }

  String get displayLabel {
    switch (this) {
      case AnnouncementType.school:
        return 'School';
      case AnnouncementType.clazz:
        return 'Class';
      case AnnouncementType.emergency:
        return 'Emergency';
      case AnnouncementType.eventReminder:
        return 'Event Reminder';
    }
  }

  bool get isEmergency => this == AnnouncementType.emergency;
}

class AnnouncementModel {
  final String id;
  final String schoolId;
  final String authorId;
  final String? authorName;
  final String title;
  final String body;
  final AnnouncementType type;
  final String? targetClassId;
  final DateTime publishedAt;
  final DateTime createdAt;

  const AnnouncementModel({
    required this.id,
    required this.schoolId,
    required this.authorId,
    this.authorName,
    required this.title,
    required this.body,
    required this.type,
    this.targetClassId,
    required this.publishedAt,
    required this.createdAt,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    final authorData = json['user_profiles'] as Map<String, dynamic>?;
    return AnnouncementModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      authorId: json['author_id'] as String,
      authorName: authorData?['full_name'] as String?,
      title: json['title'] as String,
      body: json['body'] as String,
      type: AnnouncementType.fromString(
          json['type'] as String? ?? 'school'),
      targetClassId: json['target_class_id'] as String?,
      publishedAt: DateTime.parse(
          json['published_at'] as String? ?? json['created_at'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'author_id': authorId,
      'title': title,
      'body': body,
      'type': type.toJson(),
      'target_class_id': targetClassId,
      'published_at': publishedAt.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  AnnouncementModel copyWith({
    String? id,
    String? schoolId,
    String? authorId,
    String? authorName,
    String? title,
    String? body,
    AnnouncementType? type,
    String? targetClassId,
    DateTime? publishedAt,
    DateTime? createdAt,
  }) {
    return AnnouncementModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      title: title ?? this.title,
      body: body ?? this.body,
      type: type ?? this.type,
      targetClassId: targetClassId ?? this.targetClassId,
      publishedAt: publishedAt ?? this.publishedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
