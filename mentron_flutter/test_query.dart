import 'package:supabase/supabase.dart';
import 'dart:io';

void main() async {
  final supabase = SupabaseClient(
    'https://ysllolnoyezfdllqocgv.supabase.co',
    'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs',
  );

  try {
    print('Executing query...');
    final response = await supabase
        .from('notes')
        .select('*, profiles!notes_profile_id_fkey(full_name)')
        .eq('subject', 'Chemistry for Information Science & Electrical Science')
        .eq('department', 'A')
        .eq('year', 1)
        .eq('semester', 'S2')
        .isFilter('folder_id', null)
        .order('created_at', ascending: false);
    
    print('Success! Rows returned: ${response.length}');
    if (response.isNotEmpty) {
      print(response.first);
    }
  } catch (e) {
    print('Error caught: $e');
  }
}
