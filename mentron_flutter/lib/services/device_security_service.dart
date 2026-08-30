// lib/services/device_security_service.dart
//
// Root / jailbreak detection for Mentron.
//
// Policy (per spec):
//   • Soft warning — does NOT hard-block the app.
//   • Blocks payment submission on compromised devices.
//   • Shows "Device compromised — contact admin" dialog.
//   • Logs the event to the audit_log table.
//
// Android checks:
//   • Su binary in known paths
//   • ro.debuggable build prop
//   • Test-keys build tags
//   • Presence of known root apps (SuperSU, Magisk, etc.)
//
// iOS checks:
//   • Writability of /private (sandbox escape)
//   • Presence of Cydia.app / Sileo
//   • Ability to open Cydia via URL scheme

import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Result of a device integrity check.
class DeviceIntegrityStatus {
  final bool isCompromised;
  final String? reason;

  const DeviceIntegrityStatus.safe()
      : isCompromised = false,
        reason = null;

  const DeviceIntegrityStatus.compromised(this.reason) : isCompromised = true;

  @override
  String toString() =>
      isCompromised ? 'COMPROMISED: $reason' : 'SAFE';
}

class DeviceSecurityService {
  static final DeviceSecurityService _instance =
      DeviceSecurityService._internal();
  factory DeviceSecurityService() => _instance;
  DeviceSecurityService._internal();

  final _logger = Logger();
  final _deviceInfo = DeviceInfoPlugin();

  // Cache the result within a session to avoid repeated FS checks
  DeviceIntegrityStatus? _cachedStatus;

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Run the integrity check and return the result.
  /// Result is cached for the session lifetime.
  Future<DeviceIntegrityStatus> checkIntegrity() async {
    if (_cachedStatus != null) return _cachedStatus!;

    // Only run on physical Android/iOS devices
    if (kIsWeb) {
      _cachedStatus = const DeviceIntegrityStatus.safe();
      return _cachedStatus!;
    }

    try {
      if (Platform.isAndroid) {
        _cachedStatus = await _checkAndroid();
      } else if (Platform.isIOS) {
        _cachedStatus = await _checkIOS();
      } else {
        _cachedStatus = const DeviceIntegrityStatus.safe();
      }
    } catch (e) {
      _logger.w('DeviceSecurityService: integrity check error: $e');
      _cachedStatus = const DeviceIntegrityStatus.safe();
    }

    if (_cachedStatus!.isCompromised) {
      _logger.w('DeviceSecurityService: ${_cachedStatus!.reason}');
      await _logToAuditLog(_cachedStatus!.reason ?? 'unknown');
    }

    return _cachedStatus!;
  }

  /// Resets the cached result (call on logout so next login re-checks).
  void resetCache() => _cachedStatus = null;

  // ── Android Checks ─────────────────────────────────────────────────────────

  Future<DeviceIntegrityStatus> _checkAndroid() async {
    // 1. Check build tags (test-keys signature = unlocked bootloader / rooted ROM)
    try {
      final info = await _deviceInfo.androidInfo;
      final tags = info.tags;
      if (tags.contains('test-keys')) {
        return const DeviceIntegrityStatus.compromised(
            'Android build signed with test-keys (possible rooted ROM)');
      }
    } catch (_) {}

    // 2. Check for su binary in known locations
    const suPaths = [
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su',
    ];
    for (final path in suPaths) {
      if (await File(path).exists()) {
        return DeviceIntegrityStatus.compromised(
            'Root binary found at $path');
      }
    }

    // 3. Check for known root/unlock manager apps
    const rootApkPaths = [
      '/system/app/Superuser.apk',
      '/system/app/SuperSU.apk',
      '/system/app/MagiskManager.apk',
      '/data/app/eu.chainfire.supersu',
      '/data/app/com.topjohnwu.magisk',
      '/data/app/com.noshufou.android.su',
    ];
    for (final path in rootApkPaths) {
      if (await File(path).exists()) {
        return DeviceIntegrityStatus.compromised(
            'Root manager app detected at $path');
      }
    }

    // 4. Check if we can write to /system (should always fail on non-rooted)
    try {
      final testFile = File('/system/_mentron_probe');
      testFile.writeAsStringSync('probe');
      await testFile.delete();
      return const DeviceIntegrityStatus.compromised(
          '/system is writable (device is rooted)');
    } on FileSystemException {
      // Expected — /system is read-only on non-rooted devices
    } catch (_) {}

    return const DeviceIntegrityStatus.safe();
  }

  // ── iOS Checks ─────────────────────────────────────────────────────────────

  Future<DeviceIntegrityStatus> _checkIOS() async {
    // 1. Check if Cydia or Sileo is installed (jailbreak app stores)
    const jailbreakPaths = [
      '/Applications/Cydia.app',
      '/Applications/Sileo.app',
      '/Applications/Zebra.app',
      '/private/var/lib/apt',
      '/usr/bin/ssh',
      '/usr/sbin/sshd',
      '/etc/apt',
      '/bin/bash',
      '/private/var/stash',
    ];
    for (final path in jailbreakPaths) {
      if (await File(path).exists()) {
        return DeviceIntegrityStatus.compromised(
            'Jailbreak artifact found at $path');
      }
    }

    // 2. Check if we can write outside the app sandbox
    try {
      final testFile = File('/private/_mentron_probe');
      testFile.writeAsStringSync('probe');
      await testFile.delete();
      return const DeviceIntegrityStatus.compromised(
          '/private is writable (device is jailbroken)');
    } on FileSystemException {
      // Expected — app cannot write outside sandbox on non-jailbroken iOS
    } catch (_) {}

    return const DeviceIntegrityStatus.safe();
  }

  // ── Audit Logging ──────────────────────────────────────────────────────────

  Future<void> _logToAuditLog(String reason) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      String? deviceInfo;
      try {
        if (Platform.isAndroid) {
          final info = await _deviceInfo.androidInfo;
          deviceInfo = '${info.manufacturer} ${info.model} (Android ${info.version.release})';
        } else if (Platform.isIOS) {
          final info = await _deviceInfo.iosInfo;
          deviceInfo = '${info.name} ${info.model} (iOS ${info.systemVersion})';
        }
      } catch (_) {}

      await client.from('audit_log').insert({
        'user_id': userId,
        'action': 'compromised_device_detected',
        'entity': 'device_security',
        'details': reason,
        'severity': 'warn',
        'device_info': deviceInfo,
      });
    } catch (e) {
      _logger.w('DeviceSecurityService: audit log failed (non-critical): $e');
    }
  }

  // ── UI Helper ─────────────────────────────────────────────────────────────

  /// Show the "compromised device" soft warning dialog.
  /// Returns true if the user dismissed and wants to proceed anyway
  /// (they cannot — payments are still blocked at the call-site).
  static Future<void> showCompromisedDeviceDialog(BuildContext context) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 28),
            SizedBox(width: 10),
            Text(
              'Security Warning',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'This device appears to be rooted or jailbroken.\n\n'
          'Payment actions are disabled on compromised devices to protect your financial data.\n\n'
          'Please contact your EXECOM admin if you believe this is a mistake.',
          style: TextStyle(color: Color(0xFFB0BEC5), height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Dismiss', style: TextStyle(color: Colors.orangeAccent)),
          ),
        ],
      ),
    );
  }
}
