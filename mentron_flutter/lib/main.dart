import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/services/supabase_service.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/exec_theme.dart';
import 'core/main_scaffold.dart';
import 'core/exec_main_scaffold.dart';
import 'core/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024;
  PaintingBinding.instance.imageCache.maximumSize = 80;

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
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

class MentronApp extends StatefulWidget {
  const MentronApp({super.key});

  @override
  State<MentronApp> createState() => _MentronAppState();
}

class _MentronAppState extends State<MentronApp> {
  bool _isExec = false;
  bool _isLoadingRole = true;

  @override
  void initState() {
    super.initState();
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _checkRole(supabase.client.auth.currentSession?.user.id);
    supabase.authStateChanges.listen((event) {
      _checkRole(event.session?.user.id);
    });
  }

  Future<void> _checkRole(String? userId) async {
    if (userId == null) {
      if (mounted) {
        setState(() {
          _isExec = false;
          _isLoadingRole = false;
        });
      }
      return;
    }
    
    if (mounted) setState(() => _isLoadingRole = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    try {
      final profile = await supabase.client
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
      final role = profile?['role'];
      if (mounted) {
        setState(() {
          _isExec = role == 'exec' || role == 'core';
          _isLoadingRole = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingRole = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mentron',
      debugShowCheckedModeBanner: false,
      theme: _isExec ? ExecTheme.darkTheme : AppTheme.darkTheme,
      scrollBehavior: const _AndroidScrollBehavior(),
      home: AppRoot(isExec: _isExec, isLoadingRole: _isLoadingRole),
    );
  }
}

class _AndroidScrollBehavior extends ScrollBehavior {
  const _AndroidScrollBehavior();
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const ClampingScrollPhysics();
}

class AppRoot extends StatefulWidget {
  final bool isExec;
  final bool isLoadingRole;
  
  const AppRoot({super.key, required this.isExec, required this.isLoadingRole});

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
    return AuthWrapper(isExec: widget.isExec, isLoadingRole: widget.isLoadingRole);
  }
}

class AuthWrapper extends StatelessWidget {
  final bool isExec;
  final bool isLoadingRole;
  
  const AuthWrapper({super.key, required this.isExec, required this.isLoadingRole});

  @override
  Widget build(BuildContext context) {
    final supabase = Provider.of<SupabaseService>(context);
    return StreamBuilder<AuthState>(
      stream: supabase.authStateChanges,
      builder: (context, snapshot) {
        final session = snapshot.data?.session ?? supabase.client.auth.currentSession;
        if (session != null) {
          if (isLoadingRole) {
            return Scaffold(
              backgroundColor: isExec ? ExecTheme.bgColor : AppTheme.bgColor,
              body: const Center(child: CircularProgressIndicator()),
            );
          }
          return isExec ? const ExecMainScaffold() : const MainScaffold();
        }
        return const LoginScreen();
      },
    );
  }
}
