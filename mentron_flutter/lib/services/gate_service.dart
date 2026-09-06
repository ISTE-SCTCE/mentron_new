import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class GateDepartment {
  final String id;
  final String key;
  final String label;
  final String emoji;
  final String color;
  final int folderCount;

  const GateDepartment({
    required this.id,
    required this.key,
    required this.label,
    required this.emoji,
    required this.color,
    this.folderCount = 0,
  });

  factory GateDepartment.fromMap(Map<String, dynamic> map) {
    int count = 0;
    if (map['gate_folders'] != null && map['gate_folders'] is List) {
      count = (map['gate_folders'] as List).length;
    }
    return GateDepartment(
      id: map['id']?.toString() ?? '',
      key: map['key']?.toString() ?? '',
      label: map['label']?.toString() ?? '',
      emoji: map['emoji']?.toString() ?? '🏛️',
      color: map['color']?.toString() ?? 'cyan',
      folderCount: count,
    );
  }
}

class GateFolder {
  final String id;
  final String departmentId;
  final String name;
  final String? createdBy;
  final String? creatorName;
  final DateTime? createdAt;
  final int noteCount;

  const GateFolder({
    required this.id,
    required this.departmentId,
    required this.name,
    this.createdBy,
    this.creatorName,
    this.createdAt,
    this.noteCount = 0,
  });

  factory GateFolder.fromMap(Map<String, dynamic> map) {
    int count = 0;
    if (map['gate_notes'] != null && map['gate_notes'] is List) {
      count = (map['gate_notes'] as List).length;
    }
    String? creator;
    if (map['profiles'] != null && map['profiles'] is Map) {
      creator = map['profiles']['full_name']?.toString();
    }
    DateTime? created;
    if (map['created_at'] != null) {
      created = DateTime.tryParse(map['created_at'].toString());
    }

    return GateFolder(
      id: map['id']?.toString() ?? '',
      departmentId: map['department_id']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      createdBy: map['created_by']?.toString(),
      creatorName: creator,
      createdAt: created,
      noteCount: count,
    );
  }
}

class GateNote {
  final String id;
  final String folderId;
  final String title;
  final String? description;
  final String fileUrl;
  final String? profileId;
  final String? uploaderName;
  final DateTime? createdAt;

  const GateNote({
    required this.id,
    required this.folderId,
    required this.title,
    this.description,
    required this.fileUrl,
    this.profileId,
    this.uploaderName,
    this.createdAt,
  });

  factory GateNote.fromMap(Map<String, dynamic> map) {
    String? uploader;
    if (map['profiles'] != null && map['profiles'] is Map) {
      uploader = map['profiles']['full_name']?.toString();
    }
    DateTime? created;
    if (map['created_at'] != null) {
      created = DateTime.tryParse(map['created_at'].toString());
    }

    String rawUrl = map['file_url']?.toString() ?? '';
    // Format relative URL to absolute if needed
    if (rawUrl.startsWith('/api/')) {
      rawUrl = 'https://mentron.istesctce.in$rawUrl';
    }

    return GateNote(
      id: map['id']?.toString() ?? '',
      folderId: map['folder_id']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      description: map['description']?.toString(),
      fileUrl: rawUrl,
      profileId: map['profile_id']?.toString(),
      uploaderName: uploader,
      createdAt: created,
    );
  }
}

class GateService {
  final SupabaseClient client;
  static const String apiBaseUrl = 'https://mentron.istesctce.in';

  GateService(this.client);

  /// Fetch all gate departments with their folder count
  Future<List<GateDepartment>> fetchDepartments() async {
    final res = await client
        .from('gate_departments')
        .select('*, gate_folders(id)')
        .order('created_at', ascending: true);

    return (res as List).map((e) => GateDepartment.fromMap(e)).toList();
  }

  /// Fetch department by key
  Future<GateDepartment?> fetchDepartmentByKey(String key) async {
    final res = await client
        .from('gate_departments')
        .select('*, gate_folders(id)')
        .eq('key', key.toUpperCase())
        .maybeSingle();

    if (res == null) return null;
    return GateDepartment.fromMap(res);
  }

  /// Create a new department (exec/core/admin only)
  Future<GateDepartment> createDepartment({
    required String key,
    required String label,
    String emoji = '🏛️',
    String color = 'cyan',
  }) async {
    final res = await client
        .from('gate_departments')
        .insert({
          'key': key.trim().toUpperCase(),
          'label': label.trim(),
          'emoji': emoji.trim(),
          'color': color.trim(),
        })
        .select('*, gate_folders(id)')
        .single();

    return GateDepartment.fromMap(res);
  }

  /// Fetch folders for a department
  Future<List<GateFolder>> fetchFolders(String departmentId) async {
    final res = await client
        .from('gate_folders')
        .select('*, profiles(full_name), gate_notes(id)')
        .eq('department_id', departmentId)
        .order('name', ascending: true);

    return (res as List).map((e) => GateFolder.fromMap(e)).toList();
  }

  /// Create a new subject folder in a department
  Future<GateFolder> createFolder({
    required String departmentId,
    required String name,
  }) async {
    final user = client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final res = await client
        .from('gate_folders')
        .insert({
          'department_id': departmentId,
          'name': name.trim(),
          'created_by': user.id,
        })
        .select('*, profiles(full_name), gate_notes(id)')
        .single();

    return GateFolder.fromMap(res);
  }

  /// Delete a folder
  Future<void> deleteFolder(String folderId) async {
    await client.from('gate_folders').delete().eq('id', folderId);
  }

  /// Fetch notes inside a subject folder
  Future<List<GateNote>> fetchNotes(String folderId) async {
    final res = await client
        .from('gate_notes')
        .select('*, profiles(full_name)')
        .eq('folder_id', folderId)
        .order('created_at', ascending: false);

    return (res as List).map((e) => GateNote.fromMap(e)).toList();
  }

  /// Delete a note
  Future<void> deleteNote(String noteId) async {
    await client.from('gate_notes').delete().eq('id', noteId);
  }

  /// Upload a note file to R2 via presigned URL and insert gate_notes record
  Future<GateNote> uploadGateNote({
    required String folderId,
    required String title,
    String? description,
    required File file,
    Function(double progress)? onProgress,
  }) async {
    final user = client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    final session = client.auth.currentSession;
    final token = session?.accessToken;

    final fileName = file.path.split(Platform.pathSeparator).last;
    final ext = fileName.split('.').last.toLowerCase();

    String contentType = 'application/octet-stream';
    if (ext == 'pdf') {
      contentType = 'application/pdf';
    } else if (ext == 'doc') {
      contentType = 'application/msword';
    } else if (ext == 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Step 1: Request presigned URL from API
    final presignedRes = await http.post(
      Uri.parse('$apiBaseUrl/api/upload/presigned'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fileName': fileName,
        'fileType': contentType,
        'bucketFolder': 'notes_bucket',
      }),
    );

    if (presignedRes.statusCode >= 400) {
      String err = 'Failed to get upload authorization';
      try {
        final b = jsonDecode(presignedRes.body);
        if (b['error'] != null) err = b['error'];
      } catch (_) {}
      throw Exception(err);
    }

    final presignedData = jsonDecode(presignedRes.body);
    final String uploadUrl = presignedData['url'];
    final String fileKey = presignedData['key'];

    // Step 2: Stream upload to storage
    final fileBytes = await file.readAsBytes();
    final putReq = await http.put(
      Uri.parse(uploadUrl),
      headers: {'Content-Type': contentType},
      body: fileBytes,
    );

    if (putReq.statusCode < 200 || putReq.statusCode >= 300) {
      throw Exception('Storage upload failed with status ${putReq.statusCode}');
    }

    onProgress?.call(1.0);

    // Step 3: Insert gate_notes record in Supabase
    final fileUrl = '/api/files/$fileKey';
    final res = await client
        .from('gate_notes')
        .insert({
          'folder_id': folderId,
          'title': title.trim(),
          'description': description?.trim().isEmpty ?? true ? null : description?.trim(),
          'file_url': fileUrl,
          'profile_id': user.id,
        })
        .select('*, profiles(full_name)')
        .single();

    return GateNote.fromMap(res);
  }
}
