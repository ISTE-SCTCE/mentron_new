// lib/utils/constants.dart
// App-wide constants for Mentron security & offline storage

class MentronConstants {
  MentronConstants._();

  // ── Storage Keys (flutter_secure_storage) ─────────────────────────────────
  static const String kJwtKey = 'mentron_jwt';
  static const String kRefreshTokenKey = 'mentron_refresh_token';
  static const String kDeviceTokenKey = 'mentron_device_token';
  static const String kPinHashKey = 'mentron_pin_hash';
  static const String kPinSaltKey = 'mentron_pin_salt';
  static const String kEncryptionKeyKey = 'mentron_enc_key';
  static const String kEncryptionIvKey = 'mentron_enc_iv';

  // ── Hive Box Names ────────────────────────────────────────────────────────
  static const String kDownloadsBox = 'mentron_downloads';

  // ── File Size Limits ─────────────────────────────────────────────────────
  static const int kMaxVideoSizeBytes = 500 * 1024 * 1024;   // 500 MB
  static const int kMaxNotesSizeBytes = 50 * 1024 * 1024;    // 50 MB
  static const int kMaxStringLength = 4096;

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  static const int kMaxRequestsPerMinute = 100;
  static const int kRateLimitWindowSeconds = 60;
  static const int kMaxRetries = 3;
  static const int kBaseBackoffMs = 500;

  // ── Token Refresh ─────────────────────────────────────────────────────────
  /// Refresh the JWT this many seconds before it expires
  static const int kTokenRefreshBufferSeconds = 300; // 5 minutes

  // ── Anomaly Detection ─────────────────────────────────────────────────────
  /// Flag a user if they download more than this many files within the window
  static const int kAnomalyDownloadThreshold = 10;
  static const int kAnomalyWindowMinutes = 60;

  // ── Offline Storage Subdirs ───────────────────────────────────────────────
  static const String kOfflineRootDir = 'mentron_offline';
  static const String kOfflineVideosDir = 'videos';
  static const String kOfflineNotesDir = 'notes';

  // ── Method Channel ────────────────────────────────────────────────────────
  static const String kContentProtectionChannel =
      'com.mentron.app/content_protection';
}
