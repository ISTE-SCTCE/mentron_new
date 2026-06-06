import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

class VersionCheckResult {
  final bool isUpdateRequired;
  final bool isUpdateAvailable;
  final bool forceUpdate;

  VersionCheckResult({
    required this.isUpdateRequired,
    required this.isUpdateAvailable,
    required this.forceUpdate,
  });
}

class VersionService {
  final SupabaseClient _supabaseClient;

  VersionService(SupabaseService supabaseService)
      : _supabaseClient = supabaseService.client;

  /// Compares two semantic version strings (e.g., '1.0.0' and '1.1.0').
  /// Returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
  int compareVersions(String v1, String v2) {
    List<int> v1Parts = v1.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    List<int> v2Parts = v2.split('.').map((e) => int.tryParse(e) ?? 0).toList();

    for (int i = 0; i < 3; i++) {
      int p1 = i < v1Parts.length ? v1Parts[i] : 0;
      int p2 = i < v2Parts.length ? v2Parts[i] : 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  /// Checks the current app version against Supabase app_config.
  Future<VersionCheckResult> checkVersion() async {
    try {
      final configRes = await _supabaseClient
          .from('app_config')
          .select()
          .order('updated_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (configRes == null) {
        // No config found, allow access by default
        return VersionCheckResult(
          isUpdateRequired: false,
          isUpdateAvailable: false,
          forceUpdate: false,
        );
      }

      final latestVersion = configRes['latest_version'] as String;
      final minimumVersion = configRes['minimum_version'] as String;
      final forceUpdateDb = configRes['force_update'] as bool? ?? false;

      final packageInfo = await PackageInfo.fromPlatform();
      final installedVersion = packageInfo.version;

      // Case 3: Installed Version < Minimum Version (Block access)
      if (compareVersions(installedVersion, minimumVersion) < 0) {
        return VersionCheckResult(
          isUpdateRequired: true,
          isUpdateAvailable: true,
          forceUpdate: true,
        );
      }

      // Case 4: Installed Version < Latest Version (Optional update)
      if (compareVersions(installedVersion, latestVersion) < 0) {
        return VersionCheckResult(
          isUpdateRequired: forceUpdateDb,
          isUpdateAvailable: true,
          forceUpdate: forceUpdateDb,
        );
      }

      // Case 1 & 2: Version is up to date or at least minimum
      return VersionCheckResult(
        isUpdateRequired: false,
        isUpdateAvailable: false,
        forceUpdate: false,
      );
    } catch (e) {
      debugPrint('Error checking version: $e');
      // On error, default to allowing access to avoid blocking users due to network issues
      return VersionCheckResult(
        isUpdateRequired: false,
        isUpdateAvailable: false,
        forceUpdate: false,
      );
    }
  }
}
