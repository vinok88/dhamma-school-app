class MessageModel {
  final String id;
  final String schoolId;
  final String senderId;
  final String? senderName;
  final String recipientId;
  final String body;
  final DateTime? readAt;
  final DateTime createdAt;

  const MessageModel({
    required this.id,
    required this.schoolId,
    required this.senderId,
    this.senderName,
    required this.recipientId,
    required this.body,
    this.readAt,
    required this.createdAt,
  });

  bool get isRead => readAt != null;

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final senderData = json['user_profiles'] as Map<String, dynamic>?;
    return MessageModel(
      id: json['id'] as String,
      schoolId: json['school_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: senderData?['full_name'] as String?,
      recipientId: json['recipient_id'] as String,
      body: json['body'] as String,
      readAt: json['read_at'] != null
          ? DateTime.parse(json['read_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'school_id': schoolId,
      'sender_id': senderId,
      'recipient_id': recipientId,
      'body': body,
      'read_at': readAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
    };
  }

  MessageModel copyWith({
    String? id,
    String? schoolId,
    String? senderId,
    String? senderName,
    String? recipientId,
    String? body,
    DateTime? readAt,
    DateTime? createdAt,
  }) {
    return MessageModel(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      recipientId: recipientId ?? this.recipientId,
      body: body ?? this.body,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

/// Represents a conversation summary (last message per thread)
class ConversationModel {
  final String otherUserId;
  final String otherUserName;
  final String lastMessage;
  final DateTime lastMessageAt;
  final bool hasUnread;

  const ConversationModel({
    required this.otherUserId,
    required this.otherUserName,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.hasUnread,
  });
}
