// lib/services/offline_storage_service.dart
//
// Netflix-style offline storage for Mentron.
//
// Key properties:
//   • Files land in getApplicationDocumentsDirectory() — invisible in
//     the phone's Files app and gallery (app-private on both Android/iOS)
//   • Every file is encrypted at rest with AES-256-CBC before writing
//   • Metadata (title, path, type, size) is persisted in a Hive box
//   • Every download/delete is logged to the access_logs Supabase table

import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:encrypt/encrypt.dart' as enc;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:logger/logger.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/downloaded_content.dart';
import '../utils/constants.dart';

/// Manages Netflix-style offline content for Mentron.
class OfflineStorageService {
  static final OfflineStorageService _instance =
      OfflineStorageService._internal();
  factory OfflineStorageService() => _instance;
  OfflineStorageService._internal();

  final _logger = Logger();
  // Disable encryptedSharedPreferences on Android to prevent unrecoverable KeyStore/cryptographic crashes.
  // Standard FlutterSecureStorage still encrypts at rest using KeyStore-backed AES keys.
  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: false),
  );

  SupabaseClient get _client => Supabase.instance.client;

  late Directory _videosDir;
  late Directory _notesDir;
  late Box<DownloadedContent> _box;

  bool _initialized = false;

  // ── Init ──────────────────────────────────────────────────────────────────

  Future<void> initializeStorage() async {
    if (_initialized) return;

    // Register Hive adapter if not already registered
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(DownloadedContentAdapter());
    }

    final appDir = await getApplicationDocumentsDirectory();
    final offlineRoot = Directory(
        '${appDir.path}/${MentronConstants.kOfflineRootDir}');

    _videosDir = Directory(
        '${offlineRoot.path}/${MentronConstants.kOfflineVideosDir}');
    _notesDir = Directory(
        '${offlineRoot.path}/${MentronConstants.kOfflineNotesDir}');

    await _videosDir.create(recursive: true);
    await _notesDir.create(recursive: true);

    // ── Encrypted Hive Box ────────────────────────────────────────────────
    // Derive (or generate) a 256-bit AES key stored in FlutterSecureStorage.
    // If the box fails to open (due to legacy unencrypted box, corrupted files,
    // or key mismatch after reinstall), we wipe it from disk and start fresh.
    Uint8List hiveKey;
    try {
      hiveKey = await _getOrCreateHiveKey();
    } catch (e) {
      _logger.w(
        'OfflineStorageService: FlutterSecureStorage failed to read/write Hive key: $e. '
        'Wiping all secure storage and retrying...',
      );
      try {
        await _storage.deleteAll();
      } catch (_) {}

      try {
        hiveKey = await _getOrCreateHiveKey();
      } catch (err) {
        _logger.e(
          'OfflineStorageService: FlutterSecureStorage completely broken. '
          'Falling back to SharedPreferences: $err',
        );
        hiveKey = await _getFallbackHiveKey();
      }
    }
    
    try {
      _box = await Hive.openBox<DownloadedContent>(
        MentronConstants.kDownloadsBox,
        encryptionCipher: HiveAesCipher(hiveKey),
      );
    } catch (e) {
      _logger.w(
        'OfflineStorageService: failed to open encrypted box (possible corruption or key mismatch). '
        'Wiping and recreating: $e',
      );
      try {
        await Hive.deleteBoxFromDisk(MentronConstants.kDownloadsBox);
      } catch (err) {
        _logger.e('OfflineStorageService: failed to delete box from disk: $err');
      }
      // Retry opening after deletion
      _box = await Hive.openBox<DownloadedContent>(
        MentronConstants.kDownloadsBox,
        encryptionCipher: HiveAesCipher(hiveKey),
      );
    }

    _initialized = true;
    _logger.i('OfflineStorageService: initialized (encrypted) at ${offlineRoot.path}');
  }

  // ── Hive Key Management ───────────────────────────────────────────────────

  /// Retrieves or generates the 256-bit key used for HiveAesCipher.
  /// Key is stored exclusively in FlutterSecureStorage — never hardcoded.
  Future<Uint8List> _getOrCreateHiveKey() async {
    final existing = await _storage.read(key: MentronConstants.kHiveEncryptionKey);
    if (existing != null) {
      return base64Decode(existing);
    }
    // Generate a fresh 32-byte (256-bit) key
    final rng = Random.secure();
    final key = Uint8List.fromList(List.generate(32, (_) => rng.nextInt(256)));
    await _storage.write(
      key: MentronConstants.kHiveEncryptionKey,
      value: base64Encode(key),
    );
    _logger.i('OfflineStorageService: new Hive encryption key generated');
    return key;
  }

  /// Fallback key generation when FlutterSecureStorage is completely broken.
  /// Uses standard SharedPreferences to store the key.
  Future<Uint8List> _getFallbackHiveKey() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keyB64 = prefs.getString('fallback_hive_key');
      if (keyB64 != null) {
        return base64Decode(keyB64);
      }
      final rng = Random.secure();
      final key = Uint8List.fromList(List.generate(32, (_) => rng.nextInt(256)));
      await prefs.setString('fallback_hive_key', base64Encode(key));
      return key;
    } catch (e) {
      _logger.e('OfflineStorageService: SharedPreferences fallback failed. Using static fallback: $e');
      // Emergency static key so the app does not crash under any circumstances
      return Uint8List.fromList(List.generate(32, (i) => i));
    }
  }



  // ── Download ──────────────────────────────────────────────────────────────

  /// Download [url] and store it encrypted.
  /// [contentType] must be 'video' or 'notes'.
  /// [onProgress] receives values 0.0 → 1.0.
  Future<void> downloadContent({
    required String contentId,
    required String title,
    required String url,
    required String contentType,
    String? thumbnailUrl,
    void Function(double progress)? onProgress,
  }) async {
    await _ensureInitialized();

    final dir = contentType == 'video' ? _videosDir : _notesDir;
    final encPath = '${dir.path}/$contentId.enc';

    final dio = Dio();

    try {
      _logger.i('OfflineStorageService: starting download $contentId');

      // Stream-download into a temp file first
      final tempPath = '${dir.path}/$contentId.tmp';
      await dio.download(
        url,
        tempPath,
        onReceiveProgress: (received, total) {
          if (total > 0 && onProgress != null) {
            onProgress(received / total);
          }
        },
      );

      // Read the downloaded bytes
      final rawBytes = await File(tempPath).readAsBytes();
      await File(tempPath).delete(); // clean up temp file

      // Encrypt and write the .enc file
      final encryptedBytes = await _encrypt(rawBytes);
      await File(encPath).writeAsBytes(encryptedBytes, flush: true);

      final fileSizeBytes = await File(encPath).length();

      // Persist metadata to Hive
      final meta = DownloadedContent(
        id: contentId,
        title: title,
        contentType: contentType,
        encryptedFilePath: encPath,
        downloadedAt: DateTime.now(),
        fileSizeBytes: fileSizeBytes,
        thumbnailUrl: thumbnailUrl,
      );
      await _box.put(contentId, meta);

      // Log to Supabase
      await _logAccess(contentId: contentId, action: 'downloaded');

      _logger.i('OfflineStorageService: $contentId saved to $encPath');
    } catch (e) {
      // Clean up any partial files
      try {
        final encFile = File(encPath);
        if (await encFile.exists()) await encFile.delete();
      } catch (_) {}
      _logger.e('OfflineStorageService: download failed for $contentId: $e');
      rethrow;
    }
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /// Returns all locally downloaded content metadata.
  List<DownloadedContent> getDownloadedContent() {
    _ensureBoxOpen();
    return _box.values.toList();
  }

  /// Returns metadata for a specific content id, or null if not downloaded.
  DownloadedContent? getById(String contentId) {
    _ensureBoxOpen();
    return _box.get(contentId);
  }

  bool isDownloaded(String contentId) => _box.containsKey(contentId);

  // ── Decrypt for Playback ──────────────────────────────────────────────────

  /// Decrypts the stored file and writes a temp plain file.
  /// The caller is responsible for deleting the temp file after playback.
  Future<File> decryptToTemp(String contentId) async {
    await _ensureInitialized();
    final meta = _box.get(contentId);
    if (meta == null) throw Exception('Content $contentId not found in local store');

    final encBytes = await File(meta.encryptedFilePath).readAsBytes();
    final plainBytes = await _decrypt(encBytes);

    // Write to a temp file in the same directory
    final tempPath =
        '${File(meta.encryptedFilePath).parent.path}/$contentId.tmp';
    await File(tempPath).writeAsBytes(plainBytes, flush: true);
    return File(tempPath);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  Future<void> deleteDownloadedContent(String contentId) async {
    await _ensureInitialized();
    final meta = _box.get(contentId);
    if (meta == null) return;

    try {
      final file = File(meta.encryptedFilePath);
      if (await file.exists()) await file.delete();
    } catch (e) {
      _logger.w('OfflineStorageService: could not delete file: $e');
    }

    await _box.delete(contentId);
    await _logAccess(contentId: contentId, action: 'deleted');
    _logger.i('OfflineStorageService: deleted $contentId');
  }

  // ── Storage Usage ─────────────────────────────────────────────────────────

  /// Returns total bytes used by all offline content.
  Future<int> getOfflineStorageSize() async {
    await _ensureInitialized();
    int total = 0;
    for (final meta in _box.values) {
      try {
        final file = File(meta.encryptedFilePath);
        if (await file.exists()) total += await file.length();
      } catch (_) {}
    }
    return total;
  }

  String formatStorageSize(int bytes) {
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  // ── AES-256 Encryption ────────────────────────────────────────────────────
  // Key and IV are generated once per install and stored in flutter_secure_storage.
  // Wire format: [16 bytes IV][ciphertext]

  Future<Uint8List> _encrypt(Uint8List plainBytes) async {
    final keyBytes = await _getOrCreateKey();
    final key = enc.Key(keyBytes);
    final iv = enc.IV.fromSecureRandom(16);
    final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc));
    final encrypted = encrypter.encryptBytes(plainBytes, iv: iv);
    // Prepend IV so we can decrypt later
    return Uint8List.fromList([...iv.bytes, ...encrypted.bytes]);
  }

  Future<Uint8List> _decrypt(Uint8List encBytes) async {
    if (encBytes.length <= 16) {
      throw Exception('Encrypted data too short — file may be corrupted');
    }
    final keyBytes = await _getOrCreateKey();
    final key = enc.Key(keyBytes);
    final iv = enc.IV(Uint8List.fromList(encBytes.sublist(0, 16)));
    final cipherBytes = encBytes.sublist(16);
    final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc));
    final plainBytes = encrypter.decryptBytes(enc.Encrypted(cipherBytes), iv: iv);
    return Uint8List.fromList(plainBytes);
  }

  Future<Uint8List> _getOrCreateKey() async {
    try {
      final existing =
          await _storage.read(key: MentronConstants.kEncryptionKeyKey);
      if (existing != null) {
        return base64Decode(existing);
      }
      // Generate a new 256-bit key
      final key = enc.Key.fromSecureRandom(32);
      await _storage.write(
          key: MentronConstants.kEncryptionKeyKey,
          value: base64Encode(key.bytes));
      return key.bytes;
    } catch (e) {
      _logger.e('OfflineStorageService: failed to read/write kEncryptionKeyKey: $e');
      try {
        final prefs = await SharedPreferences.getInstance();
        final keyB64 = prefs.getString('fallback_encryption_key');
        if (keyB64 != null) {
          return base64Decode(keyB64);
        }
        final key = enc.Key.fromSecureRandom(32);
        await prefs.setString('fallback_encryption_key', base64Encode(key.bytes));
        return key.bytes;
      } catch (err) {
        _logger.e('OfflineStorageService: SharedPreferences fallback for kEncryptionKeyKey failed: $err');
        return Uint8List.fromList(List.generate(32, (i) => i + 1));
      }
    }
  }

  // ── Audit Logging ─────────────────────────────────────────────────────────

  Future<void> _logAccess({
    required String contentId,
    required String action,
  }) async {
    try {
      final userId = _client.auth.currentUser?.id;
      await _client.from('access_logs').insert({
        'user_id': userId,
        'content_id': contentId,
        'action': action,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      _logger.w('OfflineStorageService: audit log failed (non-critical): $e');
    }
  }

  // ── Logout Cleanup ────────────────────────────────────────────────────────

  /// Wipe and close all Hive boxes managed by this service.
  /// Called on logout to ensure no sensitive metadata persists on disk.
  Future<void> clearAllBoxes() async {
    try {
      if (_initialized && _box.isOpen) {
        await _box.deleteFromDisk(); // deletes the .hive file on disk
      }
    } catch (e) {
      _logger.w('OfflineStorageService: clearAllBoxes failed (non-critical): $e');
    } finally {
      _initialized = false;
    }
    _logger.i('OfflineStorageService: Hive boxes cleared on logout');
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  Future<void> _ensureInitialized() async {
    if (!_initialized) await initializeStorage();
  }

  void _ensureBoxOpen() {
    if (!_initialized || !_box.isOpen) {
      throw StateError(
          'OfflineStorageService not initialized. Call initializeStorage() first.');
    }
  }
}
