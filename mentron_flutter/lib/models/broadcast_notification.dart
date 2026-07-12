import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// BroadcastStatus — lifecycle states of an EXECOM broadcast notification
// ─────────────────────────────────────────────────────────────────────────────
enum BroadcastStatus { draft, scheduled, sent, failed, cancelled }

// ─────────────────────────────────────────────────────────────────────────────
// BroadcastNotification — immutable model for EXECOM broadcast notifications
// ─────────────────────────────────────────────────────────────────────────────
@immutable
class BroadcastNotification {
  final String id;
  final String title;
  final String body;
  final String createdBy;
  final String createdByName;
  final BroadcastStatus status;

  /// Null means the notification was sent immediately (Send Now mode).
  final DateTime? scheduledFor;
  final DateTime? sentAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const BroadcastNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdBy,
    required this.createdByName,
    required this.status,
    this.scheduledFor,
    this.sentAt,
    required this.createdAt,
    required this.updatedAt,
  });

  // ── Parsing ────────────────────────────────────────────────────────────────

  factory BroadcastNotification.fromJson(Map<String, dynamic> json) {
    return BroadcastNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      createdBy: json['created_by'] as String,
      createdByName: json['created_by_name'] as String,
      status: _parseStatus(json['status'] as String? ?? 'SCHEDULED'),
      scheduledFor: json['scheduled_for'] != null
          ? DateTime.parse(json['scheduled_for'] as String).toLocal()
          : null,
      sentAt: json['sent_at'] != null
          ? DateTime.parse(json['sent_at'] as String).toLocal()
          : null,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      updatedAt: DateTime.parse(json['updated_at'] as String).toLocal(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'created_by': createdBy,
        'created_by_name': createdByName,
        'status': status.dbValue,
        if (scheduledFor != null)
          'scheduled_for': scheduledFor!.toUtc().toIso8601String(),
        if (sentAt != null) 'sent_at': sentAt!.toUtc().toIso8601String(),
        'created_at': createdAt.toUtc().toIso8601String(),
        'updated_at': updatedAt.toUtc().toIso8601String(),
      };

  static BroadcastStatus _parseStatus(String raw) {
    switch (raw.toUpperCase()) {
      case 'DRAFT':
        return BroadcastStatus.draft;
      case 'SCHEDULED':
        return BroadcastStatus.scheduled;
      case 'SENT':
        return BroadcastStatus.sent;
      case 'FAILED':
        return BroadcastStatus.failed;
      case 'CANCELLED':
        return BroadcastStatus.cancelled;
      default:
        return BroadcastStatus.scheduled;
    }
  }

  // ── Computed properties ───────────────────────────────────────────────────

  /// Whether this notification can be edited (only while SCHEDULED)
  bool get canEdit => status == BroadcastStatus.scheduled;

  /// Whether this notification can be cancelled (only while SCHEDULED)
  bool get canCancel => status == BroadcastStatus.scheduled;

  /// Human-readable display time — shows sentAt → scheduledFor → createdAt
  DateTime get _displayDateTime => sentAt ?? scheduledFor ?? createdAt;

  String get displayTime {
    final dt = _displayDateTime;
    final hour = dt.hour == 0
        ? 12
        : dt.hour > 12
            ? dt.hour - 12
            : dt.hour;
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year}  $hour:$min $ampm';
  }

  BroadcastNotification copyWith({
    String? title,
    String? body,
    BroadcastStatus? status,
    DateTime? scheduledFor,
    DateTime? sentAt,
  }) {
    return BroadcastNotification(
      id: id,
      title: title ?? this.title,
      body: body ?? this.body,
      createdBy: createdBy,
      createdByName: createdByName,
      status: status ?? this.status,
      scheduledFor: scheduledFor ?? this.scheduledFor,
      sentAt: sentAt ?? this.sentAt,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

// ── Extension: DB values + UI colours/labels ──────────────────────────────────
extension BroadcastStatusX on BroadcastStatus {
  String get dbValue {
    switch (this) {
      case BroadcastStatus.draft:
        return 'DRAFT';
      case BroadcastStatus.scheduled:
        return 'SCHEDULED';
      case BroadcastStatus.sent:
        return 'SENT';
      case BroadcastStatus.failed:
        return 'FAILED';
      case BroadcastStatus.cancelled:
        return 'CANCELLED';
    }
  }

  String get label {
    switch (this) {
      case BroadcastStatus.draft:
        return 'DRAFT';
      case BroadcastStatus.scheduled:
        return 'SCHEDULED';
      case BroadcastStatus.sent:
        return 'SENT';
      case BroadcastStatus.failed:
        return 'FAILED';
      case BroadcastStatus.cancelled:
        return 'CANCELLED';
    }
  }

  /// Foreground color for status badge text + border
  Color get color {
    switch (this) {
      case BroadcastStatus.draft:
        return Colors.blueGrey;
      case BroadcastStatus.scheduled:
        return Colors.amber;
      case BroadcastStatus.sent:
        return Colors.greenAccent;
      case BroadcastStatus.failed:
        return Colors.redAccent;
      case BroadcastStatus.cancelled:
        return const Color(0xFF666680);
    }
  }

  /// Background fill for status badge
  Color get bgColor {
    switch (this) {
      case BroadcastStatus.draft:
        return Colors.blueGrey.withOpacity(0.12);
      case BroadcastStatus.scheduled:
        return Colors.amber.withOpacity(0.12);
      case BroadcastStatus.sent:
        return Colors.green.withOpacity(0.12);
      case BroadcastStatus.failed:
        return Colors.red.withOpacity(0.12);
      case BroadcastStatus.cancelled:
        return Colors.white.withOpacity(0.04);
    }
  }
}
