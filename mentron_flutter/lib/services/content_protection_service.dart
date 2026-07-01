// lib/services/content_protection_service.dart
//
// Blocks screenshots and screen recording on protected screens.
//
// Android: flutter_windowmanager FLAG_SECURE
// iOS:     MethodChannel → Swift secure overlay technique
//
// Only call enable/disable from video player and notes viewer screens.
// Do NOT apply globally.

import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_windowmanager/flutter_windowmanager.dart';
import 'package:logger/logger.dart';

import '../utils/constants.dart';

class ContentProtectionService {
  static final ContentProtectionService _instance =
      ContentProtectionService._internal();
  factory ContentProtectionService() => _instance;
  ContentProtectionService._internal();

  final _logger = Logger();
  static const _channel =
      MethodChannel(MentronConstants.kContentProtectionChannel);

  bool _isEnabled = false;
  bool get isEnabled => _isEnabled;

  // ── Enable / Disable ──────────────────────────────────────────────────────

  /// Call in initState of protected screens.
  Future<void> enableScreenProtection() async {
    if (_isEnabled) return;
    try {
      if (Platform.isAndroid) {
        await FlutterWindowManager.addFlags(FlutterWindowManager.FLAG_SECURE);
      } else if (Platform.isIOS) {
        await _channel.invokeMethod('enableProtection');
      }
      _isEnabled = true;
      _logger.i('ContentProtectionService: screen protection ENABLED');
    } catch (e) {
      _logger.w('ContentProtectionService: enableScreenProtection failed: $e');
    }
  }

  /// Call in dispose of protected screens.
  Future<void> disableScreenProtection() async {
    if (!_isEnabled) return;
    try {
      if (Platform.isAndroid) {
        await FlutterWindowManager.clearFlags(FlutterWindowManager.FLAG_SECURE);
      } else if (Platform.isIOS) {
        await _channel.invokeMethod('disableProtection');
      }
      _isEnabled = false;
      _logger.i('ContentProtectionService: screen protection DISABLED');
    } catch (e) {
      _logger.w('ContentProtectionService: disableScreenProtection failed: $e');
    }
  }

  // ── Recording Detection ───────────────────────────────────────────────────

  /// Returns true if the screen is currently being recorded / mirrored.
  /// Android: best-effort via FLAG_SECURE (system handles blocking).
  /// iOS: UIScreen.isCaptured via MethodChannel.
  Future<bool> isScreenRecording() async {
    try {
      if (Platform.isIOS) {
        final result =
            await _channel.invokeMethod<bool>('isCapturing') ?? false;
        return result;
      }
      // Android: FLAG_SECURE prevents capture at the OS level,
      // so active detection is not needed. Return false.
      return false;
    } catch (e) {
      _logger.w('ContentProtectionService: isScreenRecording failed: $e');
      return false;
    }
  }
}
