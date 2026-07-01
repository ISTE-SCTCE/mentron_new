// lib/models/content.dart
// Dart model mirroring the `content` Supabase table.

class Content {
  final String id;
  final String title;
  final String? description;
  final String contentType; // 'video' | 'notes'
  final String fileUrl;
  final String? createdBy;
  final DateTime? createdAt;

  const Content({
    required this.id,
    required this.title,
    this.description,
    required this.contentType,
    required this.fileUrl,
    this.createdBy,
    this.createdAt,
  });

  factory Content.fromJson(Map<String, dynamic> json) => Content(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String?,
        contentType: json['content_type'] as String,
        fileUrl: json['file_url'] as String,
        createdBy: json['created_by'] as String?,
        createdAt: json['created_at'] != null
            ? DateTime.parse(json['created_at'] as String)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'content_type': contentType,
        'file_url': fileUrl,
        'created_by': createdBy,
        'created_at': createdAt?.toIso8601String(),
      };

  bool get isVideo => contentType == 'video';
  bool get isNotes => contentType == 'notes';

  @override
  String toString() => 'Content($id, $title, $contentType)';
}
