import '../core/constants/app_constants.dart';

enum EventType {
  poya,
  sermon,
  exam,
  holiday,
  special;

  static EventType fromString(String s) {
    switch (s) {
      case AppConstants.eventPoya:
        return EventType.poya;
      case AppConstants.eventSermon:
        return EventType.sermon;
      case AppConstants.eventExam:
        return EventType.exam;
      case AppConstants.eventHoliday:
        return EventType.holiday;
      default:
        return EventType.special;
    }
  }

  String toJson() {
    switch (this) {
      case EventType.poya:
        return AppConstants.eventPoya;
      case EventType.sermon:
        return AppConstants.eventSermon;
      case EventType.exam:
        return AppConstants.eventExam;
      case EventType.holiday:
        return AppConstants.eventHoliday;
      case EventType.special:
        return AppConstants.eventSpecial;
    }
  }

  String get displayLabel {
    switch (this) {
      case EventType.poya:
        return 'Poya Program';
      case EventType.sermon:
        return 'Special Sermon';
      case EventType.exam:
        return 'Dhamma Exam';
      case EventType.holiday:
        return 'Holiday';
      case EventType.special:
        return 'Special Event';
    }
  }
}

class EventModel {
  final String id;
  final String schoolId;
  final String title;
  final String? description;
  final EventType eventType;
  final DateTime startDatetime;
  final DateTime? endDatetime;
  final String? location;
  final String createdBy;
  final DateTime createdAt;

  const EventModel({
    required this.id,
    required this.schoolId,
    required this.title,
    this.description,
    required this.eventType,
    required this.startDatetime,
    this.endDatetime,
    this.location,
    required this.createdBy,
    required this.createdAt,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      eventType: EventType.fromString(
          json['event_type'] as String? ?? 'special'),
      startDatetime: DateTime.parse(json['start_datetime'] as String),
      endDatetime: json['end_datetime'] != null
          ? DateTime.parse(json['end_datetime'] as String)
          : null,
      location: json['location'] as String?,
      createdBy: json['created_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'title': title,
      'description': description,
      'event_type': eventType.toJson(),
      'start_datetime': startDatetime.toIso8601String(),
      'end_datetime': endDatetime?.toIso8601String(),
      'location': location,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
    };
  }

  EventModel copyWith({
    String? id,
    String? schoolId,
    String? title,
    String? description,
    EventType? eventType,
    DateTime? startDatetime,
    DateTime? endDatetime,
    String? location,
    String? createdBy,
    DateTime? createdAt,
  }) {
    return EventModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      title: title ?? this.title,
      description: description ?? this.description,
      eventType: eventType ?? this.eventType,
      startDatetime: startDatetime ?? this.startDatetime,
      endDatetime: endDatetime ?? this.endDatetime,
      location: location ?? this.location,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
