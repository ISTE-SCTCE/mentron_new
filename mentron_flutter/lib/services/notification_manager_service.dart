import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/broadcast_notification.dart';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationManagerService
//
// All Supabase interactions for broadcast_notifications.
// Firebase Cloud Function URL for "Send Now" is configured here —
// replace <PROJECT_ID> with your Firebase project ID after setup.
// ─────────────────────────────────────────────────────────────────────────────
class NotificationManagerService {
  final SupabaseClient _supabase;

  /// Firebase HTTP callable function endpoint for instant broadcast.
  /// Deploy firebase/functions/index.js first, then update this URL.
  static const String _sendNowFunctionUrl =
      'https://us-central1-mentron-e664c.cloudfunctions.net/sendBroadcastNow';

  NotificationManagerService(this._supabase);

  // ── EXECOM write operations ───────────────────────────────────────────────

  /// Create a notification record with status SENT and immediately trigger
  /// the Firebase Cloud Function to broadcast via FCM.
  Future<BroadcastNotification?> sendNow({
    required String title,
    required String body,
    required String userId,
    required String userName,
  }) async {
    // 1. Insert record
    final Map<String, dynamic> row;
    try {
      row = await _supabase
          .from('broadcast_notifications')
          .insert({
            'title': title,
            'body': body,
            'created_by': userId,
            'created_by_name': userName,
            'status': 'SENT',
            'scheduled_for': null,
            'sent_at': DateTime.now().toUtc().toIso8601String(),
          })
          .select()
          .single();
    } catch (e) {
      debugPrint('[NotificationManager] Insert error: $e');
      rethrow;
    }

    final notification = BroadcastNotification.fromJson(row);

    // 2. Trigger FCM via Firebase Cloud Function (fire-and-forget)
    _callSendNowFunction(
      notificationId: notification.id,
      title: title,
      body: body,
    ).catchError((e) {
      debugPrint('[NotificationManager] FCM trigger error (non-fatal): $e');
    });

    // 3. Audit log
    await _writeAuditLog('BROADCAST_SENT_NOW', notification.id);

    return notification;
  }

  /// Create a SCHEDULED notification; the Cloud Function will pick it up
  /// when scheduled_for <= now() (runs every 1 minute).
  Future<BroadcastNotification?> scheduleNotification({
    required String title,
    required String body,
    required DateTime scheduledFor,
    required String userId,
    required String userName,
  }) async {
    final Map<String, dynamic> row;
    try {
      row = await _supabase
          .from('broadcast_notifications')
          .insert({
            'title': title,
            'body': body,
            'created_by': userId,
            'created_by_name': userName,
            'status': 'SCHEDULED',
            'scheduled_for': scheduledFor.toUtc().toIso8601String(),
          })
          .select()
          .single();
    } catch (e) {
      debugPrint('[NotificationManager] Schedule error: $e');
      rethrow;
    }

    final notification = BroadcastNotification.fromJson(row);
    await _writeAuditLog('BROADCAST_SCHEDULED', notification.id, extra: {
      'scheduled_for': scheduledFor.toIso8601String(),
    });

    return notification;
  }

  /// Cancel a SCHEDULED notification (sets status → CANCELLED).
  /// Returns true on success. Guard in SQL: only updates if status = 'SCHEDULED'.
  Future<bool> cancelScheduledNotification(String id) async {
    try {
      await _supabase
          .from('broadcast_notifications')
          .update({
            'status': 'CANCELLED',
            'updated_at': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', id)
          .eq('status', 'SCHEDULED');

      await _writeAuditLog('BROADCAST_CANCELLED', id);
      return true;
    } catch (e) {
      debugPrint('[NotificationManager] Cancel error: $e');
      return false;
    }
  }

  /// Edit title/body/time of a SCHEDULED notification.
  /// Only succeeds if status is still SCHEDULED.
  Future<bool> editScheduledNotification({
    required String id,
    required String title,
    required String body,
    required DateTime scheduledFor,
  }) async {
    try {
      await _supabase
          .from('broadcast_notifications')
          .update({
            'title': title,
            'body': body,
            'scheduled_for': scheduledFor.toUtc().toIso8601String(),
            'updated_at': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', id)
          .eq('status', 'SCHEDULED');

      await _writeAuditLog('BROADCAST_EDITED', id, extra: {
        'new_scheduled_for': scheduledFor.toIso8601String(),
      });
      return true;
    } catch (e) {
      debugPrint('[NotificationManager] Edit error: $e');
      return false;
    }
  }

  // ── Read operations (EXECOM) ───────────────────────────────────────────────

  /// Full history for the History tab (all statuses, newest first).
  Future<List<BroadcastNotification>> getNotificationHistory() async {
    try {
      final response = await _supabase
          .from('broadcast_notifications')
          .select()
          .order('created_at', ascending: false);

      return (response as List)
          .map((j) => BroadcastNotification.fromJson(j as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[NotificationManager] getHistory error: $e');
      return [];
    }
  }

  // ── Read operations (Regular users — Notification Inbox) ──────────────────

  /// Returns all SENT broadcasts for the user-facing inbox (RLS enforced).
  Future<List<BroadcastNotification>> getSentNotificationsForInbox() async {
    try {
      final response = await _supabase
          .from('broadcast_notifications')
          .select()
          .eq('status', 'SENT')
          .order('sent_at', ascending: false);

      return (response as List)
          .map((j) => BroadcastNotification.fromJson(j as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[NotificationManager] getInbox error: $e');
      return [];
    }
  }

  /// Count of SENT notifications sent after [since] — used for bell badge.
  Future<int> countNewSince(DateTime since) async {
    try {
      final count = await _supabase
          .from('broadcast_notifications')
          .count()
          .eq('status', 'SENT')
          .gte('sent_at', since.toUtc().toIso8601String());
      return count;
    } catch (e) {
      return 0;
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /// Calls the Firebase Cloud Function for instant FCM broadcast.
  /// Uses the Supabase session token for auth verification in the function.
  Future<void> _callSendNowFunction({
    required String notificationId,
    required String title,
    required String body,
  }) async {
    final session = _supabase.auth.currentSession;
    if (session == null) {
      debugPrint('[NotificationManager] No session — skipping FCM call');
      return;
    }

    final response = await http.post(
      Uri.parse(_sendNowFunctionUrl),
      headers: {
        'Content-Type': 'application/json',
        // Firebase callable functions expect this wrapper format
      },
      body: jsonEncode({
        'data': {
          'notificationId': notificationId,
          'title': title,
          'body': body,
          // Pass Supabase token so the Cloud Function can verify the caller
          'supabaseToken': session.accessToken,
        },
      }),
    );

    if (response.statusCode != 200) {
      debugPrint('[NotificationManager] FCM function returned ${response.statusCode}: ${response.body}');
    } else {
      debugPrint('[NotificationManager] FCM send triggered successfully');
    }
  }

  Future<void> _writeAuditLog(
    String action,
    String targetId, {
    Map<String, dynamic>? extra,
  }) async {
    try {
      await _supabase.from('audit_log').insert({
        'actor_id': _supabase.auth.currentUser?.id,
        'action': action,
        'target_table': 'broadcast_notifications',
        'target_id': targetId,
        'metadata': extra ?? {},
      });
    } catch (e) {
      // Audit log is best-effort — never block the main operation
      debugPrint('[NotificationManager] Audit log error: $e');
    }
  }
}
