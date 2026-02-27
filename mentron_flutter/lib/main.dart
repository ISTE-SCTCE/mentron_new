import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/services/supabase_service.dart';
import 'core/theme/app_theme.dart';
import 'core/main_scaffold.dart';
import 'features/auth/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Performance: lock to portrait, reduces compositor work ──
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // ── Performance: cap image cache at 50 MB (avoid OOM on mid-range phones) ──
  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024;
  PaintingBinding.instance.imageCache.maximumSize = 80;

  // ── Performance: transparent status bar, content behind it ──
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  final supabaseService = SupabaseService();
  await supabaseService.initialize(
    url: 'https://ysllolnoyezfdllqocgv.supabase.co',
    anonKey: 'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs',
  );

  runApp(
    MultiProvider(
      providers: [Provider.value(value: supabaseService)],
      child: const MentronApp(),
    ),
  );
}

class MentronApp extends StatelessWidget {
  const MentronApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mentron',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      // ── Performance: Android-native clamping scroll (no iOS bounce lag) ──
      scrollBehavior: const _AndroidScrollBehavior(),
      home: const AuthWrapper(),
    );
  }
}

/// Use ClampingScrollPhysics on Android for smoother, lower-latency scrolling.
class _AndroidScrollBehavior extends ScrollBehavior {
  const _AndroidScrollBehavior();
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const ClampingScrollPhysics();
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = Provider.of<SupabaseService>(context);
    return StreamBuilder(
      stream: supabase.authStateChanges,
      builder: (context, snapshot) {
        if (supabase.currentUser != null) return const MainScaffold();
        return const LoginScreen();
      },
    );
  }
}
