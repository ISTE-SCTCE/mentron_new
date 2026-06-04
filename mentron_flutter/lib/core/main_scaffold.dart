import 'package:flutter/material.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/notes/screens/group_screen.dart';
import '../features/projects/screens/project_list_screen.dart';
import '../features/marketplace/screens/marketplace_screen.dart';
import '../features/requests/screens/requests_screen.dart';
import '../features/profile/screens/profile_screen.dart';
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
    const ProfileScreen(),
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
    if (notification is ScrollUpdateNotification) {
      final delta = notification.scrollDelta ?? 0;
      final offset = notification.metrics.pixels;

      if (offset <= 10) {
        if (!_isNavbarVisible) _showNavbar();
        return false;
      }

      if (delta > 4 && _isNavbarVisible) {
        _hideNavbar();
      } else if (delta < -4 && !_isNavbarVisible) {
        _showNavbar();
      }
    }
    if (notification is ScrollEndNotification && !_isNavbarVisible) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted && !_isNavbarVisible) _showNavbar();
      });
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
    return Scaffold(
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
    );
  }

  Widget _buildNavbar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentPrimary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, Icons.home_rounded, 'Home'),
              _buildNavItem(1, Icons.menu_book_rounded, 'Learn'),
              _buildNavItem(2, Icons.assignment_rounded, 'Practice'),
              _buildNavItem(3, Icons.shopping_bag_rounded, 'Store'),
              _buildNavItem(4, Icons.person_rounded, 'Profile'),
              if (_isExec) _buildBellItem(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.accentPrimary.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              child: Icon(
                icon,
                color: isSelected ? AppTheme.accentPrimary : AppTheme.textLight,
                size: 22,
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 220),
              style: TextStyle(
                color: isSelected ? AppTheme.accentPrimary : AppTheme.textLight,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              ),
              child: Text(label),
            ),
          ],
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: _pendingCount > 0
              ? AppTheme.accentSecondary.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  Icons.notifications_rounded,
                  color: _pendingCount > 0
                      ? AppTheme.accentSecondary
                      : AppTheme.textLight,
                  size: 22,
                ),
                if (_pendingCount > 0)
                  Positioned(
                    top: -7,
                    right: -8,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      constraints:
                          const BoxConstraints(minWidth: 16, minHeight: 16),
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
            const SizedBox(height: 4),
            Text(
              'Alerts',
              style: TextStyle(
                color: _pendingCount > 0
                    ? AppTheme.accentSecondary
                    : AppTheme.textLight,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
