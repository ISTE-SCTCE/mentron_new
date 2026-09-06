import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../shared/widgets/exec_glass_container.dart';
import '../../../shared/widgets/exec_liquid_background.dart';
import '../widgets/real_time_calendar.dart';
import '../../leaderboard/screens/leaderboard_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../forum/screens/forum_list_screen.dart';
import 'core_members_screen.dart';
import '../../execom/screens/event_manager_screen.dart';
import '../../execom/screens/notification_manager_screen.dart';
import '../../execom/screens/payment_management_screen.dart';
import '../../execom/screens/buyers_list_screen.dart';
import '../../../core/utils/app_transitions.dart';
import '../widgets/event_banner_widget.dart';
import '../../../core/main_scaffold.dart';
import '../../../shared/widgets/pressable_scale.dart';

class ExecDashboardScreen extends StatefulWidget {
  const ExecDashboardScreen({super.key});

  @override
  State<ExecDashboardScreen> createState() => _ExecDashboardScreenState();
}

class _ExecDashboardScreenState extends State<ExecDashboardScreen> {
  int totalMembers = 0;
  int totalNotes = 0;
  int totalProjects = 0;
  int userXP = 0;
  String _userRole = 'member'; // 'member', 'exec', 'core'
  Map<String, dynamic>? _profile;
  bool _isExec = false;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadInitialStats();
    _setupRealtime();
  }

  Future<void> _loadInitialStats() async {
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;

    try {
      final user = supabase.auth.currentUser;
      int fetchedXp = 0;

      if (user != null) {
        final profileRes = await supabase
          .from('profiles')
          .select('department, xp, role, full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profileRes != null) {
          final userRole = (profileRes['role'] as String?) ?? 'member';
          if (mounted) {
            setState(() {
              _userRole = userRole;
              _isExec = userRole == 'exec' || userRole == 'core';
              _profile = profileRes;
            });
          }
          if (profileRes['xp'] != null) {
            fetchedXp = int.tryParse(profileRes['xp'].toString()) ?? 0;
          }
        }
      }

      // Sync logic with Web: Filter for 'member' role only
      final membersRes = await supabase
        .from('profiles')
        .count(CountOption.exact)
        .eq('role', 'member');
      final membersCount = membersRes;

      // Global notes count (matching Web)
      final notesCount = await supabase
        .from('notes')
        .count(CountOption.exact);

      // Total projects count
      final projectsCount = await supabase
        .from('projects')
        .count(CountOption.exact);

      if (mounted) {
        setState(() {
          totalMembers = membersCount;
          totalNotes = notesCount;
          totalProjects = projectsCount;
          userXP = fetchedXp;
          _isLoadingStats = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _isLoadingStats = false; });
    }
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);

    supabase.subscribeToTable(
      table: 'profiles',
      onUpdate: (_) => _loadInitialStats(),
    );
    supabase.subscribeToTable(
      table: 'notes',
      onUpdate: (_) => _loadInitialStats(),
    );
    supabase.subscribeToTable(
      table: 'projects',
      onUpdate: (_) => _loadInitialStats(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ExecLiquidBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 28),
                _buildBentoStats(),
                const SizedBox(height: 28),
                if (_userRole != 'exec' && _userRole != 'core') ...[
                  const EventBannerWidget(),
                  const SizedBox(height: 28),
                ],
                _buildSectionHeader('QUICK ACCESS'),
                const SizedBox(height: 16),
                _buildBentoActions(),
                const SizedBox(height: 28),
                _buildSectionHeader('ACADEMIC CALENDAR'),
                const SizedBox(height: 16),
                const RealTimeCalendar(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBentoStats() {
    if (_isLoadingStats) {
      return _buildStatsSkeleton();
    }

    return Row(
      children: [
        // Large XP Card
        Expanded(
          flex: 3,
          child: _buildStatCard(
            'TOTAL XP',
            userXP >= 1000 ? '${(userXP / 1000).toStringAsFixed(1)}k' : userXP.toString(),
            Icons.bolt_rounded,
            const Color(0xFFF59E0B),
            height: 136,
          ),
        ),
        const SizedBox(width: 12),
        // Column of 2 smaller cards
        Expanded(
          flex: 2,
          child: Column(
            children: [
              _buildStatCard(
                'MEMBERS',
                totalMembers.toString(),
                Icons.people_outline,
                ExecTheme.accentPrimary,
                height: 62,
                compact: true,
              ),
              const SizedBox(height: 12),
              _buildStatCard(
                'NOTES',
                totalNotes.toString(),
                Icons.note_outlined,
                ExecTheme.accentSecondary,
                height: 62,
                compact: true,
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.05);
  }

  Widget _buildStatsSkeleton() {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: ExecGlassContainer(
            height: 136,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 65,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: 90,
                  height: 26,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          )
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .fade(begin: 0.35, end: 0.75, duration: 800.ms),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: Column(
            children: [
              ExecGlassContainer(
                height: 62,
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: ExecTheme.accentPrimary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 48,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .fade(begin: 0.35, end: 0.75, duration: 800.ms),
              const SizedBox(height: 12),
              ExecGlassContainer(
                height: 62,
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: ExecTheme.accentSecondary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 48,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .fade(begin: 0.35, end: 0.75, duration: 800.ms),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color, {
    double height = 100,
    bool compact = false,
  }) {
    return ExecGlassContainer(
      height: height,
      padding: EdgeInsets.all(compact ? 12 : 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: compact ? 12 : 16, color: color),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: color.withOpacity(0.7),
                  fontSize: compact ? 8 : 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          SizedBox(height: compact ? 4 : 12),
          Text(
            value,
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontSize: compact ? 18 : 26,
                  height: 1,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBentoActions() {
    return Column(
      children: [
        Row(
          children: [
            // Academic Library (Large)
            Expanded(
              flex: 3,
              child: _buildBentoItem(
                'Academic Library',
                'Browse notes & materials',
                Icons.library_books_rounded,
                ExecTheme.accentSecondary,
                160,
                () => MainScaffoldState.of(context)?.setIndex(1),
              ),
            ),
            const SizedBox(width: 12),
            // Leaderboard (Square)
            Expanded(
              flex: 2,
              child: _buildBentoItem(
                'Ranks',
                'Top XP',
                Icons.emoji_events_rounded,
                const Color(0xFFF59E0B),
                160,
                () => Navigator.push(
                  context,
                  AppTransitions.slideUp(const LeaderboardScreen()),
                ),
              ),
            ),
          ],
        ).animate().fadeIn(delay: 100.ms, duration: 350.ms).slideY(begin: 0.06),
        const SizedBox(height: 12),
        Row(
          children: [
            // Incubator (Wide)
            Expanded(
              flex: 1,
              child: _buildBentoItem(
                'Incubation Center',
                'Innovation Lab',
                Icons.rocket_launch_rounded,
                ExecTheme.accentPrimary,
                100,
                () => MainScaffoldState.of(context)?.setIndex(2),
                isWide: true,
              ),
            ),
          ],
        ).animate().fadeIn(delay: 160.ms, duration: 350.ms).slideY(begin: 0.06),
        const SizedBox(height: 12),
        Row(
          children: [
            // Marketplace
            Expanded(
              child: _buildBentoItem(
                'Market',
                'Textbooks',
                Icons.shopping_bag_outlined,
                ExecTheme.accentSecondary,
                120,
                () => MainScaffoldState.of(context)?.setIndex(3),
              ),
            ),
            const SizedBox(width: 12),
            // Forum
            Expanded(
              child: _buildBentoItem(
                'Forum',
                'Ask Anonymously',
                Icons.forum_rounded,
                ExecTheme.accentPrimary,
                120,
                () => Navigator.push(
                  context,
                  AppTransitions.slideUp(const ForumListScreen()),
                ),
              ),
            ),
          ],
        ).animate().fadeIn(delay: 220.ms, duration: 350.ms).slideY(begin: 0.06),
        if (_isExec) ...[
          const SizedBox(height: 12),
          _buildBentoItem(
            'Manage Members',
            'Leadership Controls',
            Icons.admin_panel_settings_rounded,
            ExecTheme.accentPrimary,
            80,
            () => Navigator.push(
              context,
              AppTransitions.slideUp(const CoreMembersScreen()),
            ),
            isWide: true,
          ).animate().fadeIn(delay: 280.ms, duration: 350.ms).slideY(begin: 0.06),
          const SizedBox(height: 12),
          _buildBentoItem(
            'Event Manager',
            'Publish & Edit Events',
            Icons.event_note_rounded,
            ExecTheme.accentSecondary,
            80,
            () => Navigator.push(
              context,
              AppTransitions.slideUp(const EventManagerScreen()),
            ),
            isWide: true,
          ).animate().fadeIn(delay: 340.ms, duration: 350.ms).slideY(begin: 0.06),
          const SizedBox(height: 12),
          _buildBentoItem(
            'Notification Manager',
            'Broadcast to All Users',
            Icons.campaign_rounded,
            const Color(0xFFF59E0B),
            80,
            () => Navigator.push(
              context,
              AppTransitions.slideUp(const NotificationManagerScreen()),
            ),
            isWide: true,
          ).animate().fadeIn(delay: 400.ms, duration: 350.ms).slideY(begin: 0.06),
          const SizedBox(height: 12),
          _buildBentoItem(
            'Payment Management',
            'Verify Payments & Listings',
            Icons.payments_outlined,
            const Color(0xFF10B981),
            80,
            () => Navigator.push(
              context,
              AppTransitions.slideUp(const PaymentManagementScreen()),
            ),
            isWide: true,
          ).animate().fadeIn(delay: 460.ms, duration: 350.ms).slideY(begin: 0.06),
          const SizedBox(height: 12),
          _buildBentoItem(
            'Buyers List',
            'View & Export Purchases',
            Icons.people_alt_rounded,
            ExecTheme.accentSecondary,
            80,
            () => Navigator.push(
              context,
              AppTransitions.slideUp(const BuyersListPage()),
            ),
            isWide: true,
          ).animate().fadeIn(delay: 520.ms, duration: 350.ms).slideY(begin: 0.06),
        ],
      ],
    );
  }

  Widget _buildBentoItem(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    double height,
    VoidCallback onTap, {
    bool isWide = false,
  }) {
    return PressableScale(
      onTap: onTap,
      child: ExecGlassContainer(
        height: height,
        padding: const EdgeInsets.all(20),
        child: isWide
            ? Row(
                children: [
                  _buildBentoIcon(icon, color),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: ExecTheme.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right_rounded, color: ExecTheme.textMuted),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBentoIcon(icon, color),
                  const Spacer(),
                  Text(
                    title,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: ExecTheme.textMuted,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildBentoIcon(IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'WELCOME BACK,',
              style: TextStyle(
                color: ExecTheme.accentSecondary,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
            Text(
              _profile?['full_name']?.toString().split(' ').first.toUpperCase() ?? 'STUDENT',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 28),
            ),
          ],
        ),
        Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                AppTransitions.slideUp(const ForumListScreen()),
              ),
              child: const ExecGlassContainer(
                padding: EdgeInsets.all(12),
                borderRadius: 12,
                child: Icon(
                  Icons.forum_rounded,
                  color: ExecTheme.accentSecondary,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                AppTransitions.slideUp(const ProfileScreen()),
              ),
              child: const ExecGlassContainer(
                padding: EdgeInsets.all(12),
                borderRadius: 12,
                child: Icon(
                  Icons.person_rounded,
                  color: ExecTheme.accentSecondary,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn().slideX(begin: -0.1);
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: ExecTheme.textMuted,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 3,
      ),
    );
  }
}
