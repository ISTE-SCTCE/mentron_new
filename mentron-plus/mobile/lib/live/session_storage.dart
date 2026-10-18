import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SecureSessionStorage extends LocalStorage {
  const SecureSessionStorage();
  static const store = FlutterSecureStorage(
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  static const key = 'mentronplus.session';
  @override
  Future<void> initialize() async {}
  @override
  Future<bool> hasAccessToken() => store.containsKey(key: key);
  @override
  Future<String?> accessToken() => store.read(key: key);
  @override
  Future<void> removePersistedSession() => store.delete(key: key);
  @override
  Future<void> persistSession(String value) =>
      store.write(key: key, value: value);
}

class SecurePkceStorage extends GotrueAsyncStorage {
  const SecurePkceStorage();
  static const store = FlutterSecureStorage();
  @override
  Future<String?> getItem({required String key}) =>
      store.read(key: 'mentronplus.pkce.$key');
  @override
  Future<void> setItem({required String key, required String value}) =>
      store.write(key: 'mentronplus.pkce.$key', value: value);
  @override
  Future<void> removeItem({required String key}) =>
      store.delete(key: 'mentronplus.pkce.$key');
}
