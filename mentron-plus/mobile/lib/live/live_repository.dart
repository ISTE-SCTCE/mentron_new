import 'package:supabase_flutter/supabase_flutter.dart';
import 'profile_rules.dart';

class LiveRepository {
  SupabaseClient get client => Supabase.instance.client;
  Future<void> enroll(bool studyWorld) async {
    await client.rpc(
      'enroll_current_user',
      params: {'p_product': studyWorld ? 'mentron' : 'mlynq'},
    );
  }

  Future<void> signOut() => client.auth.signOut();
  Future<void> updateProfile(Map<String, dynamic> input) async {
    final user = client.auth.currentUser;
    if (user == null) throw Exception('Please log in again.');
    await client
        .from('profiles')
        .update(profilePatch(input))
        .eq('id', user.id)
        .select('id')
        .single();
  }

  Future<void> readNotification(String id) async {
    await client
        .schema('mentron')
        .from('notifications')
        .update({'is_read': true})
        .eq('id', id)
        .eq('user_id', client.auth.currentUser!.id);
  }

  Future<Map<String, dynamic>> issueQr() async =>
      Map<String, dynamic>.from(await client.rpc('issue_attendance_token'));
  Future<Uri> fileUrl(String value, {String? bucket}) async {
    String? path;
    final uri = Uri.tryParse(value);
    if (value.startsWith('/api/files/notes_bucket/')) {
      bucket = 'mentron-notes_bucket';
      path = value.substring('/api/files/notes_bucket/'.length);
    } else if (uri?.scheme == 'https' && uri!.host.endsWith('.supabase.co')) {
      final match = RegExp(
        r'^/storage/v1/object/(?:public|sign|authenticated)/([^/]+)/(.+)$',
      ).firstMatch(uri.path);
      if (match != null) {
        bucket = Uri.decodeComponent(match.group(1)!);
        if (bucket == 'notes_bucket') bucket = 'mentron-notes_bucket';
        path = Uri.decodeComponent(match.group(2)!);
      }
    } else if (bucket != null && !value.startsWith('https://')) {
      path = value;
    }
    if (bucket != null && path != null) {
      if (path.startsWith('/') ||
          path.split('/').any((part) => part == '..' || part == '.')) {
        throw Exception('File unavailable.');
      }
      return Uri.parse(
        await client.storage.from(bucket).createSignedUrl(path, 120),
      );
    }
    if (uri == null || uri.scheme != 'https' || uri.host.isEmpty) {
      throw Exception('File unavailable.');
    }
    return uri;
  }

  Future<Uri> certificateUrl(Map<String, dynamic> row) {
    // Issuers use both buckets; URL references identify the real bucket.
    for (final key in ['certificate_url', 'file_url']) {
      final value = row[key] as String?;
      if (value != null && value.contains('/storage/v1/object/')) {
        return fileUrl(value);
      }
    }
    final path = row['storage_path'] as String?;
    return path != null && path.isNotEmpty
        ? fileUrl(path, bucket: 'issued-certificates')
        : fileUrl(row['certificate_url'] ?? row['file_url'] ?? '');
  }

  Future<List<Map<String, dynamic>>> list(
    String kind, {
    int page = 0,
    String search = '',
  }) async {
    final study = client.schema('mentron');
    final id = client.auth.currentUser!.id;
    dynamic q;
    switch (kind) {
      case 'Notes':
        q = study
            .from('notes')
            .select(
              'id,title,description,department,year,semester,subject,require_iste_id',
            )
            .order('created_at', ascending: false);
        break;
      case 'Projects':
        q = study
            .from('projects')
            .select('id,title,description,category,role,duration,cv_required')
            .eq('is_approved', true)
            .order('created_at', ascending: false);
        break;
      case 'Market':
        q = study
            .from('marketplace_listings')
            .select('id,title,description,price,condition,category')
            .eq('status', 'live')
            .order('created_at', ascending: false);
        break;
      case 'Events':
        q = client
            .from('events')
            .select('id,title,description,date,location,category')
            .order('date', ascending: false);
        break;
      case 'Certificates':
        q = client
            .from('certificates')
            .select('id,title,file_url,certificate_url,storage_path,issued_at')
            .eq('user_id', id)
            .order('issued_at', ascending: false);
        break;
      case 'Attendance':
        q = client
            .from('session_attendance')
            .select(
              'id,status,marked_at,event_sessions(session_date,events(title))',
            )
            .eq('profile_id', id)
            .order('marked_at', ascending: false);
        break;
      case 'Community':
        q = study
            .from('forum_questions')
            .select('id,title,content,topic,created_at')
            .order('created_at', ascending: false);
        break;
      case 'Notifications':
        q = study
            .from('notifications')
            .select('id,title,message,is_read,created_at')
            .eq('user_id', id)
            .order('created_at', ascending: false);
        break;
      case 'Applications':
        q = study
            .from('project_applications')
            .select('id,status,message,created_at,projects(title)')
            .eq('profile_id', id)
            .order('created_at', ascending: false);
        break;
      case 'Orders':
        q = study
            .from('marketplace_orders')
            .select(
              'id,amount,order_status,created_at,marketplace_listings(title)',
            )
            .eq('buyer_id', id)
            .order('created_at', ascending: false);
        break;
      default:
        return [];
    }
    if (search.isNotEmpty &&
        ['Notes', 'Projects', 'Market', 'Events', 'Community'].contains(kind)) {
      q = q.ilike('title', '%${search.replaceAll(RegExp(r'[%_\\]'), '')}%');
    }
    return List<Map<String, dynamic>>.from(
      await q.range(page * 24, page * 24 + 23),
    );
  }

  Future<Uri> noteUrl(
    Map<String, dynamic> note,
    Map<String, dynamic> profile,
  ) async {
    final row = await client
        .schema('mentron')
        .from('notes')
        .select('file_url,require_iste_id')
        .eq('id', note['id'])
        .single();
    if (row['require_iste_id'] == true) {
      if (!activeMembership(profile)) {
        throw Exception('An active ISTE membership is required.');
      }
    }
    return fileUrl(row['file_url'] as String);
  }
}
