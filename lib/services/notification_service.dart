import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'supabase_service.dart';

/// Handles Firebase Cloud Messaging (FCM) and local notifications.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background message handler — runs in a separate isolate
  // No UI operations allowed here
  debugPrint('FCM background message: ${message.messageId}');
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _messaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'dhamma_school_high_importance',
    'Dhamma School Notifications',
    description: 'Important notifications from Dhamma School',
    importance: Importance.high,
  );

  /// Initialise FCM, request permissions, configure local notification channel.
  Future<void> initialize() async {
    if (kIsWeb) return; // FCM web handled differently — TODO: configure web push

    // Set background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permissions
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('FCM: Notifications permission denied');
      return;
    }

    // Configure local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create Android notification channel
    if (!kIsWeb && Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
    }

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Set foreground notification presentation options (iOS)
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Save the FCM token to user_profiles table.
  Future<void> saveTokenForUser(String userId) async {
    if (kIsWeb) return;
    try {
      final token = await _messaging.getToken();
      if (token == null) return;
      await SupabaseService.instance.updateFcmToken(userId, token);

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) async {
        await SupabaseService.instance.updateFcmToken(userId, newToken);
      });
    } catch (e) {
      debugPrint('FCM token save error: $e');
    }
  }

  /// Display a local notification for foreground FCM messages.
  Future<void> sendLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (kIsWeb) return;
    const androidDetails = AndroidNotificationDetails(
      'dhamma_school_high_importance',
      'Dhamma School Notifications',
      channelDescription: 'Important notifications from Dhamma School',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Stream of foreground FCM messages for UI consumers.
  Stream<RemoteMessage> get onMessageReceived =>
      FirebaseMessaging.onMessage;

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification != null) {
      sendLocalNotification(
        title: notification.title ?? 'Dhamma School',
        body: notification.body ?? '',
        payload: message.data['reference_id'],
      );
    }
  }

  void _handleMessageOpenedApp(RemoteMessage message) {
    // TODO: Navigate to the relevant screen using go_router when message is tapped
    // e.g., if message.data['type'] == 'announcement', go to announcements
    debugPrint('FCM message opened app: ${message.data}');
  }

  void _onNotificationTap(NotificationResponse response) {
    // TODO: Navigate to relevant screen based on payload using go_router
    debugPrint('Local notification tapped: ${response.payload}');
  }
}
