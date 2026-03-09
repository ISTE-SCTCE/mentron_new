import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/services/supabase_service.dart';
import 'core/theme/app_theme.dart';
import 'core/main_scaffold.dart';
import 'core/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024;
  PaintingBinding.instance.imageCache.maximumSize = 80;

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
      scrollBehavior: const _AndroidScrollBehavior(),
      home: const AppRoot(),
    );
  }
}

class _AndroidScrollBehavior extends ScrollBehavior {
  const _AndroidScrollBehavior();
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const ClampingScrollPhysics();
}

/// Shows splash first, then transitions to auth flow.
class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  bool _splashDone = false;

  @override
  Widget build(BuildContext context) {
    if (!_splashDone) {
      return SplashScreen(
        onComplete: () {
          if (mounted) setState(() => _splashDone = true);
        },
      );
    }
    return const AuthWrapper();
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final supabase = Provider.of<SupabaseService>(context);
    return StreamBuilder<AuthState>(
      stream: supabase.authStateChanges,
      builder: (context, snapshot) {
        final session = snapshot.data?.session ?? supabase.client.auth.currentSession;
        if (session != null) {
          return const MainScaffold();
        }
        return const LoginScreen();
      },
    );
  }
}
