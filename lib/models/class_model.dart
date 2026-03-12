class ClassModel {
  final String id;
  final String schoolId;
  final String name;
  final String? gradeLevel;
  final String? teacherId;
  final String? teacherName;
  final int? studentCount;
  final DateTime createdAt;

  const ClassModel({
    required this.id,
    required this.schoolId,
    required this.name,
    this.gradeLevel,
    this.teacherId,
    this.teacherName,
    this.studentCount,
    required this.createdAt,
  });

  factory ClassModel.fromJson(Map<String, dynamic> json) {
    final teacherData = json['user_profiles'] as Map<String, dynamic>?;
    return ClassModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      name: json['name'] as String,
      gradeLevel: json['grade_level'] as String?,
      teacherId: json['teacher_id'] as String?,
      teacherName: teacherData?['full_name'] as String?,
      studentCount: json['student_count'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'name': name,
      'grade_level': gradeLevel,
      'teacher_id': teacherId,
      'created_at': createdAt.toIso8601String(),
    };
  }

  ClassModel copyWith({
    String? id,
    String? schoolId,
    String? name,
    String? gradeLevel,
    String? teacherId,
    String? teacherName,
    int? studentCount,
    DateTime? createdAt,
  }) {
    return ClassModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      name: name ?? this.name,
      gradeLevel: gradeLevel ?? this.gradeLevel,
      teacherId: teacherId ?? this.teacherId,
      teacherName: teacherName ?? this.teacherName,
      studentCount: studentCount ?? this.studentCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
