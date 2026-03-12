import '../core/constants/app_constants.dart';

enum UserRole {
  parent,
  teacher,
  admin;

  static UserRole fromString(String s) {
    switch (s) {
      case AppConstants.roleTeacher:
        return UserRole.teacher;
      case AppConstants.roleAdmin:
        return UserRole.admin;
      default:
        return UserRole.parent;
    }
  }

  String toJson() {
    switch (this) {
      case UserRole.parent:
        return AppConstants.roleParent;
      case UserRole.teacher:
        return AppConstants.roleTeacher;
      case UserRole.admin:
        return AppConstants.roleAdmin;
    }
  }
}

enum UserStatus {
  active,
  inactive,
  pending;

  static UserStatus fromString(String s) {
    switch (s) {
      case 'active':
        return UserStatus.active;
      case 'inactive':
        return UserStatus.inactive;
      default:
        return UserStatus.pending;
    }
  }

  String toJson() {
    switch (this) {
      case UserStatus.active:
        return 'active';
      case UserStatus.inactive:
        return 'inactive';
      case UserStatus.pending:
        return 'pending';
    }
  }
}

class UserModel {
  final String id;
  final String? schoolId;
  final String? fullName;
  final String? preferredName;
  final String? phone;
  final String? address;
  final UserRole role;
  final UserStatus status;
  final String? profilePhotoUrl;
  final String? fcmToken;
  final DateTime createdAt;
  final DateTime updatedAt;

  // From joined auth.users (not stored in user_profiles directly)
  final String? email;

  const UserModel({
    required this.id,
    this.schoolId,
    this.fullName,
    this.preferredName,
    this.phone,
    this.address,
    required this.role,
    required this.status,
    this.profilePhotoUrl,
    this.fcmToken,
    required this.createdAt,
    required this.updatedAt,
    this.email,
  });

  String get displayName =>
      preferredName ?? fullName ?? email ?? 'Unknown User';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String?,
      fullName: json['full_name'] as String?,
      preferredName: json['preferred_name'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      role: UserRole.fromString(json['role'] as String? ?? 'parent'),
      status: UserStatus.fromString(json['status'] as String? ?? 'pending'),
      profilePhotoUrl: json['profile_photo_url'] as String?,
      fcmToken: json['fcm_token'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(
          json['updated_at'] as String? ?? json['created_at'] as String),
      email: json['email'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'full_name': fullName,
      'preferred_name': preferredName,
      'phone': phone,
      'address': address,
      'role': role.toJson(),
      'status': status.toJson(),
      'profile_photo_url': profilePhotoUrl,
      'fcm_token': fcmToken,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? id,
    String? schoolId,
    String? fullName,
    String? preferredName,
    String? phone,
    String? address,
    UserRole? role,
    UserStatus? status,
    String? profilePhotoUrl,
    String? fcmToken,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? email,
  }) {
    return UserModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      fullName: fullName ?? this.fullName,
      preferredName: preferredName ?? this.preferredName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      role: role ?? this.role,
      status: status ?? this.status,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      fcmToken: fcmToken ?? this.fcmToken,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      email: email ?? this.email,
    );
  }
}
