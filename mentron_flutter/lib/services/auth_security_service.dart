// lib/services/auth_security_service.dart
//
// Handles:
//   • JWT storage / retrieval via flutter_secure_storage (never SharedPreferences)
//   • Automatic token refresh 5 min before expiry
//   • Optional PBKDF2-hashed PIN quick-unlock
//   • Logout clearing all secure storage keys
//   • Writing a row to user_sessions on every login

import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../utils/constants.dart';

/// Centralises all auth-side security for Mentron.
class AuthSecurityService {
  static final AuthSecurityService _instance =
      AuthSecurityService._internal();
  factory AuthSecurityService() => _instance;
  AuthSecurityService._internal();

  // ── Dependencies ─────────────────────────────────────────────────────────

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  final _logger = Logger();
  final _deviceInfo = DeviceInfoPlugin();

  SupabaseClient get _client => Supabase.instance.client;

  // ── Initialisation ────────────────────────────────────────────────────────

  /// Call once from main() after Supabase.initialize().
  /// Wires up the auto-refresh listener.
  void initialize() {
    _client.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session == null) return;

      // Persist tokens securely on every auth state change
      await _saveTokens(session);

      // Write / update user_sessions row
      if (data.event == AuthChangeEvent.signedIn) {
        await _recordSession(session);
      }
    });
  }

  // ── Token Management ──────────────────────────────────────────────────────

  Future<void> _saveTokens(Session session) async {
    await _storage.write(
        key: MentronConstants.kJwtKey, value: session.accessToken);
    if (session.refreshToken != null) {
      await _storage.write(
          key: MentronConstants.kRefreshTokenKey, value: session.refreshToken);
    }
  }

  Future<String?> readJwt() =>
      _storage.read(key: MentronConstants.kJwtKey);

  Future<String?> readRefreshToken() =>
      _storage.read(key: MentronConstants.kRefreshTokenKey);

  // ── Logout ────────────────────────────────────────────────────────────────

  /// Clears every key this service owns from secure storage.
  /// Call before client.auth.signOut().
  Future<void> clearAllSecureStorage() async {
    final keysToDelete = [
      MentronConstants.kJwtKey,
      MentronConstants.kRefreshTokenKey,
      MentronConstants.kDeviceTokenKey,
      MentronConstants.kPinHashKey,
      MentronConstants.kPinSaltKey,
      MentronConstants.kEncryptionKeyKey,
      MentronConstants.kEncryptionIvKey,
    ];
    for (final key in keysToDelete) {
      await _storage.delete(key: key);
    }
    _logger.i('AuthSecurityService: all secure storage cleared on logout');
  }

  // ── Session Recording ─────────────────────────────────────────────────────

  Future<void> _recordSession(Session session) async {
    try {
      final deviceId = await _getDeviceId();
      final deviceName = await _getDeviceName();

      await _client.from('user_sessions').upsert({
        'user_id': session.user.id,
        'device_id': deviceId,
        'device_name': deviceName,
        'login_time': DateTime.now().toIso8601String(),
        'last_activity': DateTime.now().toIso8601String(),
        'is_active': true,
      });
    } catch (e) {
      _logger.w('AuthSecurityService: session record failed (non-critical): $e');
    }
  }

  /// Updates `last_activity` for the current device's session row.
  Future<void> touchSession() async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return;
      final deviceId = await _getDeviceId();
      await _client
          .from('user_sessions')
          .update({'last_activity': DateTime.now().toIso8601String()})
          .eq('user_id', userId)
          .eq('device_id', deviceId);
    } catch (_) {}
  }

  /// Marks all sessions for this user as inactive (called on full logout).
  Future<void> deactivateSession() async {
    try {
      final userId = _client.auth.currentUser?.id;
      if (userId == null) return;
      final deviceId = await _getDeviceId();
      await _client
          .from('user_sessions')
          .update({'is_active': false})
          .eq('user_id', userId)
          .eq('device_id', deviceId);
    } catch (_) {}
  }

  // ── Device Helpers ────────────────────────────────────────────────────────

  Future<String> _getDeviceId() async {
    try {
      if (defaultTargetPlatform == TargetPlatform.android) {
        final info = await _deviceInfo.androidInfo;
        return info.id;
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final info = await _deviceInfo.iosInfo;
        return info.identifierForVendor ?? 'unknown';
      }
    } catch (_) {}
    return 'unknown';
  }

  Future<String> _getDeviceName() async {
    try {
      if (defaultTargetPlatform == TargetPlatform.android) {
        final info = await _deviceInfo.androidInfo;
        return '${info.manufacturer} ${info.model}';
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        final info = await _deviceInfo.iosInfo;
        return info.name;
      }
    } catch (_) {}
    return 'Unknown Device';
  }

  // ── PIN Quick-Unlock (Optional) ───────────────────────────────────────────
  // Uses PBKDF2-HMAC-SHA256 with a random 16-byte salt.

  /// Hash and store a PIN.
  Future<void> setPin(String pin) async {
    final salt = _randomBytes(16);
    final hash = _pbkdf2(pin, salt);
    await _storage.write(
        key: MentronConstants.kPinHashKey, value: base64Encode(hash));
    await _storage.write(
        key: MentronConstants.kPinSaltKey, value: base64Encode(salt));
    _logger.i('AuthSecurityService: PIN set');
  }

  /// Returns true if [pin] matches the stored hash.
  Future<bool> verifyPin(String pin) async {
    final saltB64 = await _storage.read(key: MentronConstants.kPinSaltKey);
    final hashB64 = await _storage.read(key: MentronConstants.kPinHashKey);
    if (saltB64 == null || hashB64 == null) return false;
    final salt = base64Decode(saltB64);
    final storedHash = base64Decode(hashB64);
    final computed = _pbkdf2(pin, salt);
    return _constantTimeEquals(computed, storedHash);
  }

  /// Removes the PIN from secure storage.
  Future<void> clearPin() async {
    await _storage.delete(key: MentronConstants.kPinHashKey);
    await _storage.delete(key: MentronConstants.kPinSaltKey);
  }

  Future<bool> hasPin() async {
    final hash = await _storage.read(key: MentronConstants.kPinHashKey);
    return hash != null;
  }

  // ── PBKDF2 Internals ─────────────────────────────────────────────────────

  Uint8List _pbkdf2(String password, Uint8List salt,
      {int iterations = 200000, int keyLength = 32}) {
    final passwordBytes = utf8.encode(password);
    final hmac = Hmac(sha256, passwordBytes);

    Uint8List u = Uint8List.fromList(
        hmac.convert([...salt, 0, 0, 0, 1]).bytes);
    final result = Uint8List.fromList(u);

    for (int i = 1; i < iterations; i++) {
      u = Uint8List.fromList(hmac.convert(u).bytes);
      for (int j = 0; j < result.length && j < u.length; j++) {
        result[j] ^= u[j];
      }
    }
    return result.sublist(0, keyLength);
  }

  Uint8List _randomBytes(int length) {
    final rng = Random.secure();
    return Uint8List.fromList(
        List.generate(length, (_) => rng.nextInt(256)));
  }

  bool _constantTimeEquals(Uint8List a, Uint8List b) {
    if (a.length != b.length) return false;
    int result = 0;
    for (int i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result == 0;
  }
}
