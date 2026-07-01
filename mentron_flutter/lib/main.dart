import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/services/supabase_service.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/exec_theme.dart';
import 'core/main_scaffold.dart';
import 'core/exec_main_scaffold.dart';
import 'core/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'core/providers/academic_provider.dart';
import 'core/services/version_service.dart';
import 'features/force_update/screens/force_update_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'features/auth/screens/onboarding_screen.dart';
import 'services/auth_security_service.dart';
import 'services/api_security_service.dart';
import 'services/offline_storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Phase 0: Load .env (falls back gracefully if file missing) ────────────
  await dotenv.load(fileName: '.env', mergeWith: {}).catchError((_) {});

  // ── Phase 0: Hive ─────────────────────────────────────────────────────────
  await Hive.initFlutter();

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  PaintingBinding.instance.imageCache.maximumSizeBytes = 50 * 1024 * 1024;
  PaintingBinding.instance.imageCache.maximumSize = 80;

  // Force light status bar for new pastel design
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  // ── Phase 2: API Security (Dio + cert pinning) ────────────────────────────
  ApiSecurityService().initialize();

  // ── Phase 1: Supabase + Auth Security ─────────────────────────────────────
  final supabaseService = SupabaseService();
  await supabaseService.initialize(
    url: dotenv.maybeGet('SUPABASE_URL') ??
        'https://ysllolnoyezfdllqocgv.supabase.co',
    anonKey: dotenv.maybeGet('SUPABASE_ANON_KEY') ??
        'sb_publishable_FwJxMntZ8Hiqze7RUK0gcQ_L_0DGAbs',
  );
  AuthSecurityService().initialize();

  // ── Phase 4: Offline Storage ──────────────────────────────────────────────
  await OfflineStorageService().initializeStorage();

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: supabaseService),
        ChangeNotifierProvider(create: (_) => AcademicProvider()),
      ],
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
          .select('role, admission_year, admission_month')
          .eq('id', userId)
          .maybeSingle();
      final role = profile?['role'];
      
      // Initialize AcademicProvider
      if (profile != null && mounted) {
        final admissionYear = profile['admission_year'] as int? ?? DateTime.now().year;
        final admissionMonth = profile['admission_month'] as int? ?? 8;
        Provider.of<AcademicProvider>(context, listen: false).initialize(admissionYear, admissionMonth);
      }

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
      // All users get the new light pastel theme; exec uses exec theme
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
  bool _isCheckingVersion = true;
  bool _forceUpdate = false;
  bool _onboardingCompleted = false;

  @override
  void initState() {
    super.initState();
    _checkVersion();
    _checkOnboardingStatus();
  }

  Future<void> _checkOnboardingStatus() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _onboardingCompleted = prefs.getBool('onboarding_completed') ?? false;
      });
    }
  }

  Future<void> _checkVersion() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final versionService = VersionService(supabase);
    final result = await versionService.checkVersion();
    
    if (mounted) {
      setState(() {
        _forceUpdate = result.isUpdateRequired;
        _isCheckingVersion = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashDone || _isCheckingVersion) {
      return SplashScreen(
        onComplete: () {
          if (mounted) setState(() => _splashDone = true);
        },
      );
    }

    if (_forceUpdate) {
      return const ForceUpdateScreen();
    }

    return AuthWrapper(
      isExec: widget.isExec, 
      isLoadingRole: widget.isLoadingRole,
      onboardingCompleted: _onboardingCompleted,
    );
  }
}

class AuthWrapper extends StatelessWidget {
  final bool isExec;
  final bool isLoadingRole;
  final bool onboardingCompleted;
  
  const AuthWrapper({
    super.key, 
    required this.isExec, 
    required this.isLoadingRole,
    required this.onboardingCompleted,
  });

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
              backgroundColor: AppTheme.bgColor,
              body: const Center(
                child: CircularProgressIndicator(
                  color: AppTheme.accentPrimary,
                  strokeWidth: 3,
                ),
              ),
            );
          }
          return isExec ? const ExecMainScaffold() : const MainScaffold();
        }
        
        // If not logged in, show Onboarding or Login based on previous usage
        return onboardingCompleted ? const LoginScreen() : const OnboardingScreen();
      },
    );
  }
}
