// lib/services/audit_logging_service.dart
//
// Query and anomaly layer on top of the access_logs Supabase table.
// Writes happen in OfflineStorageService (downloads/deletes) and
// NoteViewerScreen (views). This service is for querying and admin use.

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/audit_log.dart';
import '../utils/constants.dart';

class AuditLoggingService {
  static final AuditLoggingService _instance =
      AuditLoggingService._internal();
  factory AuditLoggingService() => _instance;
  AuditLoggingService._internal();

  final _logger = Logger();
  final _deviceInfo = DeviceInfoPlugin();

  SupabaseClient get _client => Supabase.instance.client;

  // ── Write ─────────────────────────────────────────────────────────────────

  /// Log a content access event to Supabase.
  /// [action] should be 'viewed', 'downloaded', or 'deleted'.
  Future<void> logAction({
    required String contentId,
    required String action,
  }) async {
    try {
      final userId = _client.auth.currentUser?.id;
      final deviceInfo = await _getDeviceInfo();

      await _client.from('access_logs').insert({
        'user_id': userId,
        'content_id': contentId,
        'action': action,
        'timestamp': DateTime.now().toIso8601String(),
        'device_info': deviceInfo,
        // ip_address intentionally left to server — client doesn't reliably know its public IP
      });
    } catch (e) {
      _logger.w('AuditLoggingService: logAction failed (non-critical): $e');
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  /// Returns all audit log entries for a specific content item.
  Future<List<AuditLog>> getLogsForContent(String contentId) async {
    try {
      final data = await _client
          .from('access_logs')
          .select()
          .eq('content_id', contentId)
          .order('timestamp', ascending: false)
          .limit(500);
      return (data as List)
          .map((e) => AuditLog.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _logger.e('AuditLoggingService: getLogsForContent failed: $e');
      return [];
    }
  }

  /// Returns all audit log entries for a specific user, optionally filtered
  /// by [from] and [to] date range.
  Future<List<AuditLog>> getLogsForUser(
    String userId, {
    DateTime? from,
    DateTime? to,
  }) async {
    try {
      var query = _client
          .from('access_logs')
          .select()
          .eq('user_id', userId);

      if (from != null) {
        query = query.gte('timestamp', from.toIso8601String());
      }
      if (to != null) {
        query = query.lte('timestamp', to.toIso8601String());
      }

      final data = await query
          .order('timestamp', ascending: false)
          .limit(1000);
      return (data as List)
          .map((e) => AuditLog.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _logger.e('AuditLoggingService: getLogsForUser failed: $e');
      return [];
    }
  }

  // ── Anomaly Detection ─────────────────────────────────────────────────────

  /// Returns a list of [AnomalyReport]s for users who downloaded more than
  /// [MentronConstants.kAnomalyDownloadThreshold] items within
  /// [MentronConstants.kAnomalyWindowMinutes] minutes.
  ///
  /// Does NOT auto-lock accounts — just surfaces for admin review.
  Future<List<AnomalyReport>> flagAnomalies() async {
    try {
      final since = DateTime.now().subtract(
          Duration(minutes: MentronConstants.kAnomalyWindowMinutes));

      final data = await _client
          .from('access_logs')
          .select('user_id, content_id, timestamp')
          .eq('action', 'downloaded')
          .gte('timestamp', since.toIso8601String());

      // Group by user
      final Map<String, List<Map<String, dynamic>>> byUser = {};
      for (final row in data as List) {
        final uid = row['user_id'] as String? ?? 'unknown';
        byUser.putIfAbsent(uid, () => []).add(row as Map<String, dynamic>);
      }

      final reports = <AnomalyReport>[];
      for (final entry in byUser.entries) {
        if (entry.value.length > MentronConstants.kAnomalyDownloadThreshold) {
          reports.add(AnomalyReport(
            userId: entry.key,
            downloadCount: entry.value.length,
            withinMinutes: MentronConstants.kAnomalyWindowMinutes,
            threshold: MentronConstants.kAnomalyDownloadThreshold,
            firstSeen: DateTime.parse(entry.value.last['timestamp'] as String),
            lastSeen:
                DateTime.parse(entry.value.first['timestamp'] as String),
          ));
        }
      }

      if (reports.isNotEmpty) {
        _logger.w(
            'AuditLoggingService: ${reports.length} anomalous user(s) detected');
      }
      return reports;
    } catch (e) {
      _logger.e('AuditLoggingService: flagAnomalies failed: $e');
      return [];
    }
  }

  // ── Admin Queries ─────────────────────────────────────────────────────────

  /// Returns the top [limit] most-downloaded content IDs with their counts.
  Future<List<ContentDownloadStat>> getMostDownloaded({int limit = 10}) async {
    try {
      // Supabase doesn't support GROUP BY directly in the client SDK,
      // so we fetch recent download logs and aggregate client-side.
      final data = await _client
          .from('access_logs')
          .select('content_id')
          .eq('action', 'downloaded')
          .limit(5000);

      final Map<String, int> counts = {};
      for (final row in data as List) {
        final cid = row['content_id'] as String? ?? 'unknown';
        counts[cid] = (counts[cid] ?? 0) + 1;
      }

      final sorted = counts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      return sorted
          .take(limit)
          .map((e) => ContentDownloadStat(
              contentId: e.key, downloadCount: e.value))
          .toList();
    } catch (e) {
      _logger.e('AuditLoggingService: getMostDownloaded failed: $e');
      return [];
    }
  }

  // ── Device Info ────────────────────────────────────────────────────────────

  Future<String> _getDeviceInfo() async {
    try {
      if (defaultTargetPlatform == TargetPlatform.android) {
        final info = await _deviceInfo.androidInfo;
        return '${info.manufacturer} ${info.model} (Android ${info.version.release})';
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final info = await _deviceInfo.iosInfo;
        return '${info.name} ${info.model} (iOS ${info.systemVersion})';
      }
    } catch (_) {}
    return 'Unknown Device';
  }
}

// ── Data classes ──────────────────────────────────────────────────────────────

class AnomalyReport {
  final String userId;
  final int downloadCount;
  final int withinMinutes;
  final int threshold;
  final DateTime firstSeen;
  final DateTime lastSeen;

  const AnomalyReport({
    required this.userId,
    required this.downloadCount,
    required this.withinMinutes,
    required this.threshold,
    required this.firstSeen,
    required this.lastSeen,
  });

  @override
  String toString() =>
      'AnomalyReport(user=$userId, downloads=$downloadCount in ${withinMinutes}min)';
}

class ContentDownloadStat {
  final String contentId;
  final int downloadCount;
  const ContentDownloadStat(
      {required this.contentId, required this.downloadCount});
}
