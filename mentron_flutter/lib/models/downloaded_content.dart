// lib/models/downloaded_content.dart
//
// Hive-persisted metadata for offline content.
// The actual file bytes are stored AES-256 encrypted on disk.
// This model only records WHERE the file is and what it is.
//
// TypeId 0 — ensure no other Hive type in the project uses 0.

import 'package:hive/hive.dart';

part 'downloaded_content.g.dart';

@HiveType(typeId: 0)
class DownloadedContent extends HiveObject {
  @HiveField(0)
  final String id; // matches content.id in Supabase

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String contentType; // 'video' | 'notes'

  @HiveField(3)
  final String encryptedFilePath; // absolute path to the .enc file on disk

  @HiveField(4)
  final DateTime downloadedAt;

  @HiveField(5)
  final int fileSizeBytes; // size of the encrypted file

  @HiveField(6)
  final String? thumbnailUrl; // optional remote thumbnail for the UI

  DownloadedContent({
    required this.id,
    required this.title,
    required this.contentType,
    required this.encryptedFilePath,
    required this.downloadedAt,
    required this.fileSizeBytes,
    this.thumbnailUrl,
  });

  bool get isVideo => contentType == 'video';
  bool get isNotes => contentType == 'notes';

  String get formattedSize {
    if (fileSizeBytes < 1024 * 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  String toString() =>
      'DownloadedContent($id, $title, $contentType, $formattedSize)';
}
