import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'live/live_app.dart';
import 'live/session_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/campus_shell.dart';
import 'core/theme/world_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const url = String.fromEnvironment('SUPABASE_URL');
  const key = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
  final configured = url.isNotEmpty && key.isNotEmpty;
  if (configured) {
    await Supabase.initialize(
      url: url,
      publishableKey: key,
      debug: false,
      authOptions: FlutterAuthClientOptions(
        localStorage: kIsWeb
            ? SharedPreferencesLocalStorage(persistSessionKey: 'mentron.auth')
            : const SecureSessionStorage(),
        pkceAsyncStorage: kIsWeb ? null : const SecurePkceStorage(),
      ),
    );
  }
  runApp(MentronLiveApp(configured: configured));
}

class CampusApp extends StatelessWidget {
  const CampusApp({super.key, required this.preferences});
  final SharedPreferences preferences;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Campus',
    debugShowCheckedModeBanner: false,
    theme: campusTheme(CampusWorld.learn),
    home: CampusShell(preferences: preferences),
  );
}
