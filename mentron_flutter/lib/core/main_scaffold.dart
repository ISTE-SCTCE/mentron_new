import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:async';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/notes/screens/group_screen.dart';
import '../features/projects/screens/project_list_screen.dart';
import '../features/marketplace/screens/marketplace_screen.dart';
import '../features/requests/screens/requests_screen.dart';
import '../screens/my_downloads_screen.dart';
import '../core/services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'utils/app_transitions.dart';
import '../features/auth/screens/login_screen.dart';

class MainScaffold extends StatefulWidget {
  const MainScaffold({super.key});

  @override
  State<MainScaffold> createState() => MainScaffoldState();
}

class MainScaffoldState extends State<MainScaffold>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  static MainScaffoldState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainScaffoldState>();

  void setIndex(int index) {
    if (mounted && index >= 0 && index < _screens.length) {
      setState(() => _currentIndex = index);
    }
  }

  int _currentIndex = 0;
  bool _isNavbarVisible = true;
  bool _isExec = false;
  int _pendingCount = 0;
  RealtimeChannel? _roleChannel;
  Timer? _sessionCheckTimer;
  bool _isCheckingSession = false;

  // Animation controller for smooth show/hide
  late AnimationController _navbarAnimController;
  late Animation<Offset> _navbarSlideAnim;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const GroupScreen(),
    const ProjectListScreen(),
    const MarketplaceScreen(),
    const MyDownloadsScreen(), // replaces Profile — still reachable from dashboard
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _navbarAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _navbarSlideAnim = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, 2.0),
    ).animate(
      CurvedAnimation(parent: _navbarAnimController, curve: Curves.easeInOut),
    );

    _checkUserRole();
    _subscribeToRoleChanges();
    _sessionCheckTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _validateSession(),
    );
    Future.delayed(const Duration(seconds: 5), _validateSession);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkUserRole();
      _validateSession();
    }
  }

  void _subscribeToRoleChanges() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) return;

    _roleChannel = supabase.client
        .channel('role-watch-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'profiles',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: userId,
          ),
          callback: (_) => _checkUserRole(),
        )
        .subscribe();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _roleChannel?.unsubscribe();
    _sessionCheckTimer?.cancel();
    _navbarAnimController.dispose();
    super.dispose();
  }

  Future<void> _validateSession() async {
    if (_isCheckingSession || !mounted) return;
    _isCheckingSession = true;
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final isValid = await supabase.sessionGuard.validateSession();
      if (!isValid && mounted) {
        _sessionCheckTimer?.cancel();
        await supabase.signOut();
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            AppTransitions.fade(const LoginScreen()),
            (_) => false,
          );
          Future.delayed(const Duration(milliseconds: 600), () {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Color(0xFFFF6B6B),
                  duration: Duration(seconds: 6),
                  behavior: SnackBarBehavior.floating,
                  content: Text(
                    '⚠️ Your account is being used on another device. You have been logged out.',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }
          });
        }
      }
    } finally {
      _isCheckingSession = false;
    }
  }

  Future<void> _checkUserRole() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) return;
    try {
      final profile = await supabase.client
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
      if (!mounted || profile == null) return;
      final role = profile['role'];
      final isPrivileged = role == 'exec' || role == 'core';
      if (isPrivileged) {
        setState(() => _isExec = true);
        _fetchPendingCount();
      } else {
        setState(() {
          _isExec = false;
          _pendingCount = 0;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchPendingCount() async {
    if (!_isExec) return;
    final client = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final projects = await client.from('pending_projects').select('id');
      if (mounted) {
        setState(() {
          _pendingCount = (projects as List).length;
        });
      }
    } catch (_) {}
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (notification.depth != 0 || notification.metrics.axis != Axis.vertical) return false;

    if (notification is ScrollUpdateNotification) {
      final delta = notification.scrollDelta ?? 0;
      final offset = notification.metrics.pixels;

      if (offset <= 10) {
        if (!_isNavbarVisible) _showNavbar();
        return false;
      }

      if (delta > 8 && _isNavbarVisible) {
        _hideNavbar();
      } else if (delta < -8 && !_isNavbarVisible) {
        _showNavbar();
      }
    }
    return false;
  }

  void _hideNavbar() {
    if (!mounted) return;
    setState(() => _isNavbarVisible = false);
    _navbarAnimController.forward();
  }

  void _showNavbar() {
    if (!mounted) return;
    setState(() => _isNavbarVisible = true);
    _navbarAnimController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          setState(() {
            _currentIndex = 0;
          });
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.bgColor,
      body: Stack(
        children: [
          // ── Full-screen content ──────────────────────────────────
          NotificationListener<ScrollNotification>(
            onNotification: _onScrollNotification,
            child: IndexedStack(
              index: _currentIndex,
              children: _screens,
            ),
          ),
          // ── Bottom Navigation Bar ────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SlideTransition(
              position: _navbarSlideAnim,
              child: _buildNavbar(),
            ),
          ),
        ],
      ),
    ));
  }

  Widget _buildNavbar() {
    return Container(
      margin: EdgeInsets.only(
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).padding.bottom > 0 ? 12 : 24,
      ),
      height: 72,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(36),
        border: Border.all(color: Colors.white.withOpacity(0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(36),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, Icons.home_outlined),
                _buildNavItem(1, Icons.menu_book_rounded, Icons.menu_book_outlined),
                _buildNavItem(2, Icons.assignment_rounded, Icons.assignment_outlined),
                _buildNavItem(3, Icons.shopping_bag_rounded, Icons.shopping_bag_outlined),
                _buildNavItem(4, Icons.download_done_rounded, Icons.download_for_offline_outlined),
                if (_isExec) _buildBellItem(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData selectedIcon, IconData unselectedIcon) {
    final bool isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1E2238) : Colors.transparent,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Icon(
            isSelected ? selectedIcon : unselectedIcon,
            color: isSelected ? Colors.white : const Color(0xFF8E90A6),
            size: 22,
          ),
        ),
      ),
    );
  }

  /// Exec-only bell icon with pending badge
  Widget _buildBellItem() {
    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          AppTransitions.slideUp(const RequestsScreen()),
        );
        _fetchPendingCount();
      },
      behavior: HitTestBehavior.opaque,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Colors.transparent,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_outlined,
              color: Color(0xFF8E90A6),
              size: 22,
            ),
          ),
          if (_pendingCount > 0)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.all(3),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFFFF6B6B),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  _pendingCount > 99 ? '99+' : '$_pendingCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
