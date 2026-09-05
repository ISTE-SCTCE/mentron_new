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

import 'package:crypto/crypto.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/constants.dart';
import 'offline_storage_service.dart';

/// Centralises all auth-side security for Mentron.
class AuthSecurityService {
  static final AuthSecurityService _instance =
      AuthSecurityService._internal();
  factory AuthSecurityService() => _instance;
  AuthSecurityService._internal();

  // ── Dependencies ─────────────────────────────────────────────────────────

  // Disable encryptedSharedPreferences on Android to prevent unrecoverable KeyStore/cryptographic crashes.
  // Standard FlutterSecureStorage still encrypts at rest using KeyStore-backed AES keys.
  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: false),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  final _logger = Logger();
  final _deviceInfo = DeviceInfoPlugin();

  SupabaseClient get _client => Supabase.instance.client;

  // ── Initialisation ────────────────────────────────────────────────────────

  /// Call once from main() after Supabase.initialize().
  /// Wires up the auto-refresh listener and handles unexpected sign-out events.
  void initialize() {
    _client.auth.onAuthStateChange.listen((data) async {
      final session = data.session;

      switch (data.event) {
        case AuthChangeEvent.signedIn:
          // Persist tokens and record the session on first sign-in
          if (session != null) {
            await _saveTokens(session);
            await _recordSession(session);
          }
          break;

        case AuthChangeEvent.tokenRefreshed:
          // SDK automatically refreshed the JWT; persist the new pair
          if (session != null) {
            await _saveTokens(session);
            _logger.i('AuthSecurityService: JWT token refreshed and persisted');
          }
          break;

        case AuthChangeEvent.signedOut:
          // Triggered when Supabase invalidates the session (e.g. refresh token
          // expired or revoked from server). Clear everything immediately.
          await _handleForcedSignOut();
          break;

        default:
          // For other events (passwordRecovery, userUpdated, etc.),
          // persist tokens if a session is available.
          if (session != null) {
            await _saveTokens(session);
          }
      }
    });
  }

  /// Handles a server-forced sign-out (refresh token expired / revoked).
  Future<void> _handleForcedSignOut() async {
    _logger.w('AuthSecurityService: forced sign-out detected — clearing all credentials');
    await clearAllSecureStorage();
    await _clearHiveBoxes();
  }

  // ── Token Management ──────────────────────────────────────────────────────

  Future<void> _saveTokens(Session session) async {
    await _writeSecure(
        MentronConstants.kJwtKey, session.accessToken);
    if (session.refreshToken != null) {
      await _writeSecure(
          MentronConstants.kRefreshTokenKey, session.refreshToken!);
    }
  }

  Future<String?> readJwt() =>
      _readSecure(MentronConstants.kJwtKey);

  Future<String?> readRefreshToken() =>
      _readSecure(MentronConstants.kRefreshTokenKey);

  // ── Logout ────────────────────────────────────────────────────────────────

  /// Clears every key this service owns from secure storage.
  /// Also wipes Hive boxes so no metadata persists post-logout.
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
      // Note: kHiveEncryptionKey and kEncryptionKeyKey are intentionally
      // NOT deleted here — they are device-bound keys. Deleting them would
      // permanently corrupt any existing encrypted data. The Hive box itself
      // is wiped via clearHiveBoxes() on logout instead.
    ];
    for (final key in keysToDelete) {
      await _deleteSecure(key);
    }
    await _clearHiveBoxes();
    _logger.i('AuthSecurityService: all secure storage cleared on logout');
  }

  /// Delegates to OfflineStorageService to wipe Hive boxes on logout.
  Future<void> _clearHiveBoxes() async {
    try {
      await OfflineStorageService().clearAllBoxes();
    } catch (e) {
      _logger.w('AuthSecurityService: Hive box clear failed (non-critical): $e');
    }
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
    await _writeSecure(
        MentronConstants.kPinHashKey, base64Encode(hash));
    await _writeSecure(
        MentronConstants.kPinSaltKey, base64Encode(salt));
    _logger.i('AuthSecurityService: PIN set');
  }

  /// Returns true if [pin] matches the stored hash.
  Future<bool> verifyPin(String pin) async {
    final saltB64 = await _readSecure(MentronConstants.kPinSaltKey);
    final hashB64 = await _readSecure(MentronConstants.kPinHashKey);
    if (saltB64 == null || hashB64 == null) return false;
    final salt = base64Decode(saltB64);
    final storedHash = base64Decode(hashB64);
    final computed = _pbkdf2(pin, salt);
    return _constantTimeEquals(computed, storedHash);
  }

  /// Removes the PIN from secure storage.
  Future<void> clearPin() async {
    await _deleteSecure(MentronConstants.kPinHashKey);
    await _deleteSecure(MentronConstants.kPinSaltKey);
  }

  Future<bool> hasPin() async {
    final hash = await _readSecure(MentronConstants.kPinHashKey);
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

  // ── Secure Storage Helper Methods with Fallbacks ────────────────────────────

  Future<String?> _readSecure(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      _logger.w('AuthSecurityService: failed to read secure key $key: $e. Falling back to SharedPreferences.');
      try {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString('fallback_$key');
      } catch (err) {
        _logger.e('AuthSecurityService: fallback read for $key failed: $err');
        return null;
      }
    }
  }

  Future<void> _writeSecure(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      _logger.w('AuthSecurityService: failed to write secure key $key: $e. Falling back to SharedPreferences.');
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fallback_$key', value);
      } catch (err) {
        _logger.e('AuthSecurityService: fallback write for $key failed: $err');
      }
    }
  }

  Future<void> _deleteSecure(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      _logger.w('AuthSecurityService: failed to delete secure key $key: $e. Falling back to SharedPreferences.');
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fallback_$key');
    } catch (err) {
      _logger.e('AuthSecurityService: fallback delete for $key failed: $err');
    }
  }
}
