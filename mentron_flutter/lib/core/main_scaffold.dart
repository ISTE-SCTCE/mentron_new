import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/notes/screens/group_screen.dart';
import '../features/projects/screens/project_list_screen.dart';
import '../features/marketplace/screens/marketplace_screen.dart';
import '../features/requests/screens/requests_screen.dart';
import '../core/services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'utils/app_transitions.dart';

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
  double _lastScrollOffset = 0;
  bool _isExec = false;
  int _pendingCount = 0;
  RealtimeChannel? _roleChannel;

  // Animation controller for smooth show/hide
  late AnimationController _navbarAnimController;
  late Animation<Offset> _navbarSlideAnim;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const GroupScreen(),
    const ProjectListScreen(),
    const MarketplaceScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _navbarAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _navbarSlideAnim = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, 2.0),
    ).animate(CurvedAnimation(parent: _navbarAnimController, curve: Curves.easeInOut));

    _checkUserRole();
    _subscribeToRoleChanges();
  }

  /// Re-check role whenever the app comes back to the foreground.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkUserRole();
    }
  }

  /// Subscribe to real-time changes on the current user's profile row.
  /// If the role column changes (e.g. core promotes/demotes them),
  /// we immediately re-fetch and refresh _isExec.
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
    _navbarAnimController.dispose();
    super.dispose();
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
        // Demoted or member — hide bell
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

  /// Called by screens via NotificationListener to hide/show navbar on scroll
  bool _onScrollNotification(ScrollNotification notification) {
    if (notification is ScrollUpdateNotification) {
      final delta = notification.scrollDelta ?? 0;
      final offset = notification.metrics.pixels;

      // Show navbar at very top regardless
      if (offset <= 10) {
        if (!_isNavbarVisible) _showNavbar();
        return false;
      }

      // Scrolling down → hide; scrolling up → show
      if (delta > 4 && _isNavbarVisible) {
        _hideNavbar();
      } else if (delta < -4 && !_isNavbarVisible) {
        _showNavbar();
      }

      _lastScrollOffset = offset;
    }
    // Show on scroll end / idle
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
          // ── Floating auto-hiding navbar ──────────────────────────
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
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      height: 72,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 30,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: const Color(0xFF7B2FFF).withOpacity(0.08),
            blurRadius: 24,
            spreadRadius: 1,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(0.14),
                  Colors.white.withOpacity(0.06),
                ],
              ),
              border: Border.all(
                color: Colors.white.withOpacity(0.15),
                width: 0.8,
              ),
            ),
            child: Stack(
              children: [
                // Glass sheen highlight
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 18,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.white.withOpacity(0.22),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildNavItem(0, Icons.grid_view_rounded, 'Home'),
                    _buildNavItem(1, Icons.library_books_rounded, 'Library'),
                    _buildNavItem(2, Icons.rocket_launch_rounded, 'Projects'),
                    _buildNavItem(3, Icons.shopping_bag_rounded, 'Market'),
                    if (_isExec) _buildBellItem(),
                  ],
                ),
              ],
            ),
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? AppTheme.accentPrimary.withOpacity(0.15) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              icon,
              color: isSelected ? AppTheme.accentPrimary : AppTheme.textMuted,
              size: 22,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? AppTheme.accentPrimary : AppTheme.textMuted,
              fontSize: 9,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  /// Execom-only bell icon with pending badge
  Widget _buildBellItem() {
    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          AppTransitions.slideUp(const RequestsScreen()),
        );
        // Refresh count when returning
        _fetchPendingCount();
      },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: _pendingCount > 0
                      ? Colors.orangeAccent.withOpacity(0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.notifications_rounded,
                  color: _pendingCount > 0 ? Colors.orangeAccent : AppTheme.textMuted,
                  size: 22,
                ),
              ),
              if (_pendingCount > 0)
                Positioned(
                  top: 4,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: const BoxDecoration(
                      color: Colors.redAccent,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      _pendingCount > 99 ? '99+' : '$_pendingCount',
                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'Requests',
            style: TextStyle(
              color: _pendingCount > 0 ? Colors.orangeAccent : AppTheme.textMuted,
              fontSize: 9,
              fontWeight: _pendingCount > 0 ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
