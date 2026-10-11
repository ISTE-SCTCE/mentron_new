import '../design/campus_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/notes/screens/group_screen.dart';
import '../features/projects/screens/project_list_screen.dart';
import '../features/marketplace/screens/marketplace_screen.dart';
import '../features/requests/screens/requests_screen.dart';
import '../features/notifications/screens/notifications_inbox_screen.dart';
import '../screens/my_downloads_screen.dart';
import '../core/services/supabase_service.dart';
import '../services/notification_manager_service.dart';
import 'theme/app_theme.dart';
import 'utils/app_transitions.dart';
import 'widgets/animated_indexed_stack.dart';
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
      if (_currentIndex != index) {
        HapticFeedback.selectionClick();
      }
      setState(() => _currentIndex = index);
    }
  }

  int _currentIndex = 0;
  bool _isNavbarVisible = true;
  bool _isExec = false;
  int _pendingCount = 0;
  int _notifBadgeCount = 0; // unread broadcast notifications for all users
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
    _navbarSlideAnim =
        Tween<Offset>(begin: Offset.zero, end: const Offset(0, 2.0)).animate(
          CurvedAnimation(
            parent: _navbarAnimController,
            curve: Curves.easeInOut,
          ),
        );

    _checkUserRole();
    _subscribeToRoleChanges();
    _loadNotifBadge();
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
      _loadNotifBadge();
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
          schema: 'mentron',
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
          .schema('mentron')
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
      final projects = await client
          .schema('mentron')
          .from('projects')
          .select('id')
          .eq('is_approved', false);
      if (mounted) {
        setState(() {
          _pendingCount = (projects as List).length;
        });
      }
    } catch (_) {}
  }

  /// Loads the unread broadcast notification count for the bell badge.
  /// "Unread" = sent after [notifications_inbox_last_seen] in SharedPreferences.
  Future<void> _loadNotifBadge() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastSeenMs = prefs.getInt(NotificationsInboxScreen.lastSeenPrefKey);
      final since = lastSeenMs != null
          ? DateTime.fromMillisecondsSinceEpoch(lastSeenMs)
          : DateTime.now().subtract(const Duration(days: 30));

      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final svc = NotificationManagerService(supabase.client);
      final count = await svc.countNewSince(since);

      if (mounted) setState(() => _notifBadgeCount = count);
    } catch (_) {}
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (notification.depth != 0 || notification.metrics.axis != Axis.vertical)
      return false;

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
              child: AnimatedIndexedStack(
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
      ),
    );
  }

  Widget _buildNavbar() => Padding(
    padding: EdgeInsets.fromLTRB(
      8,
      0,
      8,
      MediaQuery.paddingOf(context).bottom + 12,
    ),
    child: CampusBottomNav(
      learning: true,
      selected: _currentIndex,
      items: [
        const CampusNavItem('Home', Icons.home_outlined),
        const CampusNavItem('Study', Icons.menu_book_outlined),
        const CampusNavItem('Projects', Icons.assignment_outlined),
        const CampusNavItem('Shop', Icons.shopping_bag_outlined),
        const CampusNavItem('Saved', Icons.download_for_offline_outlined),
        CampusNavItem(
          _isExec ? 'Requests' : 'Inbox',
          Icons.notifications_outlined,
          badge: _isExec ? _pendingCount : _notifBadgeCount,
        ),
      ],
      onSelected: (index) async {
        if (index < 5) {
          if (_currentIndex != index) {
            HapticFeedback.selectionClick();
            setState(() => _currentIndex = index);
          }
        } else if (_isExec) {
          await Navigator.push(
            context,
            AppTransitions.slideUp(const RequestsScreen()),
          );
          _fetchPendingCount();
        } else {
          await Navigator.push(
            context,
            AppTransitions.slideUp(const NotificationsInboxScreen()),
          );
          _loadNotifBadge();
        }
      },
    ),
  );
}
