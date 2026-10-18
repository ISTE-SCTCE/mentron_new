import 'package:supabase_flutter/supabase_flutter.dart';
import 'profile_rules.dart';

class AccountFailure implements Exception {
  const AccountFailure(this.message);
  final String message;
  @override
  String toString() => message;
}

class AccountChange {
  const AccountChange({required this.recovery, required this.signedOut});
  final bool recovery;
  final bool signedOut;
}

class AccountRepository {
  SupabaseClient get _client => Supabase.instance.client;
  bool get hasSession => _client.auth.currentSession != null;
  Stream<AccountChange> get changes => _client.auth.onAuthStateChange.map(
    (event) => AccountChange(
      recovery: event.event == AuthChangeEvent.passwordRecovery,
      signedOut: event.event == AuthChangeEvent.signedOut,
    ),
  );
  static const redirect = String.fromEnvironment(
    'AUTH_REDIRECT_URL',
    defaultValue: 'mentronplus://auth-callback',
  );
  Future<void> signIn(String email, String password) async {
    try {
      await _client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
    } on AuthException catch (error) {
      throw AccountFailure(_message(error));
    }
  }

  Future<bool> signUp(String email, String password, String name) async {
    try {
      final result = await _client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {'name': name.trim()},
        emailRedirectTo: redirect,
      );
      return result.session != null;
    } on AuthException catch (error) {
      throw AccountFailure(_message(error));
    }
  }

  Future<void> reset(String email) async {
    try {
      await _client.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo: redirect,
      );
    } on AuthException catch (error) {
      throw AccountFailure(_message(error));
    }
  }

  Future<void> updatePassword(String password) async {
    try {
      await _client.auth.updateUser(UserAttributes(password: password));
    } on AuthException catch (error) {
      throw AccountFailure(_message(error));
    }
  }

  Future<void> signOut() => _client.auth.signOut();
  Future<Map<String, dynamic>> profile() async {
    final user = (await _client.auth.getUser()).user;
    if (user == null) throw const AccountFailure('Please log in again.');
    final row = await _client
        .from('profiles')
        .select(
          'id,name,email,branch,year,phone,roll_number,college,status,suspended_until,is_iste_member,iste_membership_id,expiry_date,role',
        )
        .eq('id', user.id)
        .single();
    if (!activeProfile(row)) {
      throw const AccountFailure(
        'Your account is not active. Contact ISTE support.',
      );
    }
    return row;
  }

  String _message(AuthException error) {
    if (error.code == 'invalid_credentials') {
      return 'The email or password is incorrect.';
    }
    if (error.code == 'email_not_confirmed') {
      return 'Confirm your email before logging in.';
    }
    if (error.statusCode == '429') {
      return 'Too many attempts. Wait a few minutes and try again.';
    }
    return error.message;
  }
}
