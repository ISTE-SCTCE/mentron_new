import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  final _logger = Logger();
  late final SupabaseClient client;

  Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    try {
      await Supabase.initialize(
        url: url,
        anonKey: anonKey,
      );
      client = Supabase.instance.client;
      _logger.i('Supabase Initialized Successfully');
    } catch (e) {
      _logger.e('Supabase Initialization Failed: $e');
      rethrow;
    }
  }

  // Auth Helpers
  User? get currentUser => client.auth.currentUser;
  Session? get currentSession => client.auth.currentSession;
  Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() async {
    await client.auth.signOut();
  }

  // Real-time Helpers
  RealtimeChannel subscribeToTable({
    required String table,
    required void Function(dynamic payload) onUpdate,
  }) {
    final channel = client.channel('public:$table');
    channel.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: table,
      callback: (payload) => onUpdate(payload),
    ).subscribe();
    return channel;
  }

  // Permission Helpers
  Future<bool> isLeadershipPosition() async {
    final userId = currentUser?.id;
    if (userId == null) return false;
    
    final response = await client
        .from('profiles')
        .select('iste_position')
        .eq('id', userId)
        .maybeSingle();
    
    if (response == null) return false;
    final position = response['iste_position'];
    return position == 'Chairman' || position == 'Vice Chairman';
  }

  Future<Map<String, bool>> getPermissions() async {
    final userId = currentUser?.id;
    if (userId == null) return {};
    
    final response = await client
        .from('profiles')
        .select('permissions, iste_position')
        .eq('id', userId)
        .maybeSingle();
    
    if (response == null) return {};
    
    final position = response['iste_position'];
    if (position == 'Chairman' || position == 'Vice Chairman') {
      return {
        'can_see_member_info': true,
        'can_delete_account': true,
        'can_upload_notes': true,
      };
    }

    final Map<String, dynamic> rawPerms = response['permissions'] ?? {};
    return rawPerms.map((key, value) => MapEntry(key, value == true));
  }
}
