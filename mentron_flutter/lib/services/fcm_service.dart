import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND MESSAGE HANDLER — must be a top-level function outside any class.
// Called by Firebase when a data-only message arrives while the app is killed
// or in the background.
// ─────────────────────────────────────────────────────────────────────────────
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is already initialised before this handler runs.
  debugPrint('[FCM] Background message received: ${message.messageId}');
  // flutter_local_notifications can be invoked here if needed for data-only
  // messages, but FCM notification payloads auto-display on Android/iOS.
}

// ─────────────────────────────────────────────────────────────────────────────
// FCMService — singleton wrapper around FirebaseMessaging +
// FlutterLocalNotifications for foreground display and topic management.
// ─────────────────────────────────────────────────────────────────────────────
class FCMService {
  FCMService._();
  static final FCMService instance = FCMService._();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Android notification channel for EXECOM broadcast announcements.
  static const AndroidNotificationChannel _broadcastsChannel =
      AndroidNotificationChannel(
    'mentron_broadcasts',
    'Mentron Broadcasts',
    description: 'General announcements from the EXECOM team',
    importance: Importance.high,
    playSound: true,
  );

  // NavigatorKey for routing after a notification tap (set from main.dart)
  static GlobalKey<NavigatorState>? navigatorKey;

  bool _initialized = false;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Call once in main() after Firebase.initializeApp().
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_broadcastsChannel);

    // Initialise local notifications plugin
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Foreground message handler — display as local notification
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Background → opened: app was backgrounded, user tapped notification
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpened);

    // Terminated → opened: app was killed, user tapped notification
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      // Small delay to let the widget tree mount first
      await Future.delayed(const Duration(milliseconds: 600));
      _handleNotificationOpened(initial);
    }

    debugPrint('[FCM] FCMService initialised');
  }

  /// Ask the user for notification permissions (iOS + Android 13+).
  Future<bool> requestPermissions() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    final granted =
        settings.authorizationStatus == AuthorizationStatus.authorized ||
            settings.authorizationStatus == AuthorizationStatus.provisional;
    debugPrint('[FCM] Permission: ${settings.authorizationStatus}');
    return granted;
  }

  /// Subscribe every signed-in user to the `all_users` topic so they receive
  /// EXECOM broadcast notifications. Idempotent — safe to call multiple times.
  Future<void> subscribeToAllUsersTopic() async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic('all_users');
      debugPrint('[FCM] Subscribed to topic: all_users');
    } catch (e) {
      debugPrint('[FCM] subscribeToAllUsersTopic error: $e');
    }
  }

  /// Unsubscribe (call on logout to stop receiving broadcasts).
  Future<void> unsubscribeFromAllUsersTopic() async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic('all_users');
      debugPrint('[FCM] Unsubscribed from topic: all_users');
    } catch (e) {
      debugPrint('[FCM] unsubscribeFromAllUsersTopic error: $e');
    }
  }

  /// Returns the device's FCM registration token (useful for debug screens).
  Future<String?> getToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      debugPrint('[FCM] Token: $token');
      return token;
    } catch (e) {
      debugPrint('[FCM] getToken error: $e');
      return null;
    }
  }

  /// Fetch the current device FCM token and persist it to profiles.fcm_token
  /// so that Cloud Functions can send targeted notifications to this user.
  /// Safe to call on every sign-in — it is a no-op if the token hasn't changed.
  Future<void> storeToken(SupabaseClient client, String userId) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      await client
          .from('profiles')
          .update({'fcm_token': token})
          .eq('id', userId);
      debugPrint('[FCM] Token stored for user $userId');
    } catch (e) {
      debugPrint('[FCM] storeToken error: $e');
    }
  }

  // ── Private handlers ──────────────────────────────────────────────────────

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    debugPrint('[FCM] Foreground message: ${notification.title}');

    _localNotifications.show(
      // Stable notification ID derived from messageId
      message.messageId?.hashCode ?? notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _broadcastsChannel.id,
          _broadcastsChannel.name,
          channelDescription: _broadcastsChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          styleInformation: BigTextStyleInformation(notification.body ?? ''),
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['notification_id'],
    );
  }

  void _handleNotificationOpened(RemoteMessage message) {
    debugPrint('[FCM] Notification opened: ${message.data}');
    _navigateToInbox();
  }

  void _onLocalNotificationTap(NotificationResponse response) {
    debugPrint('[FCM] Local notification tapped: ${response.payload}');
    _navigateToInbox();
  }

  /// Navigate to the notifications inbox screen.
  void _navigateToInbox() {
    final navigator = navigatorKey?.currentState;
    if (navigator == null) return;
    // Push inbox on top of whatever is currently showing
    navigator.pushNamed('/notifications_inbox');
  }
}
