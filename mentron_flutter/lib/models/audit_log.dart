// lib/models/audit_log.dart
// Dart model mirroring the `access_logs` Supabase table.

class AuditLog {
  final String id;
  final String? userId;
  final String? contentId;
  final String action; // 'viewed' | 'downloaded' | 'deleted'
  final DateTime timestamp;
  final String? deviceInfo;
  final String? ipAddress;

  const AuditLog({
    required this.id,
    this.userId,
    this.contentId,
    required this.action,
    required this.timestamp,
    this.deviceInfo,
    this.ipAddress,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) => AuditLog(
        id: json['id'] as String,
        userId: json['user_id'] as String?,
        contentId: json['content_id'] as String?,
        action: json['action'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        deviceInfo: json['device_info'] as String?,
        ipAddress: json['ip_address'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'content_id': contentId,
        'action': action,
        'device_info': deviceInfo,
        'ip_address': ipAddress,
      };

  @override
  String toString() => 'AuditLog($id, $action, $timestamp)';
}
