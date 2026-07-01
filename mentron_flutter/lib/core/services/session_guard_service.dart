// lib/core/services/session_guard_service.dart
//
// Manages single-device session enforcement.
//
// Strategy:
//   - On login, a unique device token is generated and stored:
//     1. Locally in flutter_secure_storage (keychain/keystore-backed).
//     2. Remotely in `profiles.session_token` for the current user.
//   - On app resume / periodic timer, the local token is compared
//     to the remote token.
//   - If they differ, someone else has logged in → force sign out.
//   - On intentional sign out, the remote token is cleared.

import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../utils/constants.dart';

class SessionGuardService {
  static final _rng = Random.secure();

  final SupabaseClient _client;
  SessionGuardService(this._client);

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Call this right after a successful signIn.
  /// Generates a fresh device token, saves it in secure storage and writes it to DB.
  Future<void> claimSession() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    final token = List.generate(32, (_) => _rng.nextInt(256))
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    await _storage.write(key: MentronConstants.kDeviceTokenKey, value: token);

    try {
      await _client
          .from('profiles')
          .update({'session_token': token}).eq('id', userId);
    } catch (_) {
      // Non-critical — if the update fails (e.g. offline), the mismatch will
      // be caught on the next validateSession() call.
    }
  }

  /// Call this on app start and app resume.
  /// Returns `true` if the session is still valid (this device owns it).
  /// Returns `false` if another device has taken over (should force sign out).
  Future<bool> validateSession() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return true; // Not logged in — nothing to validate.

    final localToken =
        await _storage.read(key: MentronConstants.kDeviceTokenKey);

    // No local token means this device never claimed a session properly.
    // This can happen if the app was reinstalled. Force them to log in again.
    if (localToken == null || localToken.isEmpty) return false;

    try {
      final response = await _client
          .from('profiles')
          .select('session_token')
          .eq('id', userId)
          .maybeSingle();

      final remoteToken = response?['session_token'] as String?;

      // If the remote token is null, it was cleared (e.g., explicit sign out
      // from another device). Treat as invalid.
      if (remoteToken == null || remoteToken.isEmpty) return false;

      return localToken == remoteToken;
    } catch (_) {
      // If we can't reach the DB, give the user the benefit of the doubt
      // and keep the session alive to avoid false logouts on poor connectivity.
      return true;
    }
  }

  /// Call this on intentional user sign out.
  /// Clears the session token from the DB so another device can log in freely.
  Future<void> clearSession() async {
    final userId = _client.auth.currentUser?.id;
    await _storage.delete(key: MentronConstants.kDeviceTokenKey);

    if (userId == null) return;
    try {
      await _client
          .from('profiles')
          .update({'session_token': null}).eq('id', userId);
    } catch (_) {}
  }
}
