import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../data/models/subject_data.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/illustration_card.dart';
import '../widgets/real_time_calendar.dart';
import '../widgets/dashboard_carousel.dart';
import '../widgets/event_banner_widget.dart';
import '../../notes/screens/add_note_screen.dart';
import '../../notes/screens/notes_by_subject_screen.dart';
import '../../projects/screens/add_project_screen.dart';
import '../../events/screens/event_list_screen.dart';
import '../../leaderboard/screens/leaderboard_screen.dart';
import '../../forum/screens/forum_list_screen.dart';
import 'core_members_screen.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/main_scaffold.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int totalMembers = 0;
  int totalNotes = 0;
  int totalProjects = 0;
  int userXP = 0;
  bool _isCoreMember = false;
  String _userRole = 'member';
  Map<String, dynamic>? _profile;
  bool _isExec = false;

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
            .select('department, year, roll_number, xp, role, full_name')
            .eq('id', user.id)
            .maybeSingle();
        if (profileRes != null) {
          final userRole = (profileRes['role'] as String?) ?? 'member';
          if (mounted) {
            setState(() {
              _userRole = userRole;
              _isCoreMember = userRole == 'core';
              _isExec = userRole == 'exec' || userRole == 'core';
              _profile = profileRes;
            });
          }
          if (profileRes['xp'] != null) {
            fetchedXp = int.tryParse(profileRes['xp'].toString()) ?? 0;
          }
        }
      }

      final membersCount = await supabase
          .from('profiles')
          .count(CountOption.exact)
          .eq('role', 'member');

      final notesCount = await supabase.from('notes').count(CountOption.exact);
      final projectsCount = await supabase
          .from('projects')
          .count(CountOption.exact);

      if (mounted) {
        setState(() {
          totalMembers = membersCount;
          totalNotes = notesCount;
          totalProjects = projectsCount;
          userXP = fetchedXp;
        });
      }
    } catch (_) {
      if (mounted) setState(() {});
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

  List<String> _getTopSubjects() {
    final year = int.tryParse(_profile?['year']?.toString() ?? '') ?? 1;
    final dept = (_profile?['department']?.toString() ?? 'CSE').toUpperCase();
    final sems = SubjectData.semsForYear(year);
    final sem = sems.isNotEmpty ? sems.first : 'S1';

    if (year == 1) {
      final group = SubjectData.getGroupFromDepartment(dept);
      return SubjectData.getFirstYearSubjects(group, sem).take(4).toList();
    }

    final subjects = SubjectData.getSubjects(dept, sem);
    if (subjects.isNotEmpty) return subjects.take(4).toList();

    return const [
      'Data Structures & Algorithms',
      'Database Management',
      'Operating Systems',
      'Computer Networks',
    ];
  }

  @override
  Widget build(BuildContext context) {
    final firstName =
        _profile?['full_name']?.toString().split(' ').first ?? 'Student';

    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: SafeArea(
        child: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            // ── App Bar ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeader(firstName),
            ),
            // ── Greeting + Headline ───────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeadlineSection(firstName),
            ),
            // ── Dashboard Event & Trending Subject Carousel ──────
            const SliverToBoxAdapter(
              child: DashboardCarousel(),
            ),
            // ── Course Cards ──────────────────────────────────────
            SliverToBoxAdapter(
              child: _buildSectionLabel('Featured Courses'),
            ),
            SliverToBoxAdapter(
              child: _buildCourseCards(),
            ),
            // ── Subject Scrollable Cards ──────────────────────────
            if (!_isExec) ...[
              SliverToBoxAdapter(
                child: _buildSectionLabel('Your Subjects'),
              ),
              SliverToBoxAdapter(
                child: _buildSubjectCards(),
              ),
            ],
            // ── Quick Actions Grid ────────────────────────────────
            SliverToBoxAdapter(
              child: _buildSectionLabel('Quick Actions'),
            ),
            SliverToBoxAdapter(
              child: _buildQuickActionsGrid(),
            ),
            // ── Event Banner ──────────────────────────────────────
            if (_userRole != 'exec' && _userRole != 'core')
              const SliverToBoxAdapter(child: EventBannerWidget()),
            // ── Calendar ─────────────────────────────────────────
            SliverToBoxAdapter(
              child: _buildSectionLabel('Class Calendar'),
            ),
            const SliverToBoxAdapter(child: RealTimeCalendar()),
            // ── Contribute Card ───────────────────────────────────
            SliverToBoxAdapter(
              child: _buildContributeCard(),
            ),
            // Bottom padding for navbar
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildHeader(String firstName) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: AppTheme.card1Gradient,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.accentPrimary.withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                firstName.isNotEmpty ? firstName[0].toUpperCase() : 'S',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Name + plan
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi, $firstName 👋',
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 3),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.accentSecondary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: const Text(
                    'Member Plan',
                    style: TextStyle(
                      color: AppTheme.accentSecondary,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Forum button
          _buildHeaderAction(
            icon: Icons.forum_rounded,
            onTap: () => Navigator.push(
              context,
              AppTransitions.slideUp(const ForumListScreen()),
            ),
          ),
          const SizedBox(width: 8),
          // Notification
          _buildHeaderAction(
            icon: Icons.notifications_none_rounded,
            onTap: () {},
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, curve: Curves.easeOut);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Headline
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildHeadlineSection(String firstName) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What would you like\nto learn today?',
            style: TextStyle(
              color: AppTheme.textMain,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pick up right where you left off.',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.08, curve: Curves.easeOut);
  }

  Widget _buildHeaderAction({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppTheme.accentPrimary.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: AppTheme.textMuted, size: 20),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subject Chips
  // ─────────────────────────────────────────────────────────────────────────





  // ─────────────────────────────────────────────────────────────────────────
  // Course Cards
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildCourseCards() {
    final year = int.tryParse(_profile?['year']?.toString() ?? '') ?? 1;
    final dept = (_profile?['department']?.toString() ?? 'CSE').toUpperCase();
    final sems = SubjectData.semsForYear(year);
    final sem = sems.isNotEmpty ? sems.first : 'S1';
    final courseSubjects = _getTopSubjects();
    
    // Pick the first subject from their course, or fallback to Basic Science
    final importantSubject = courseSubjects.isNotEmpty 
        ? courseSubjects.first 
        : 'Basic Science';

    // Format the subject name nicely with newlines if it's long
    final displayTitle = importantSubject.length > 20 && !importantSubject.contains('\n')
        ? importantSubject.replaceFirst(' for ', '\nfor ').replaceFirst(' and ', '\nand ').replaceFirst(' & ', '\n& ')
        : importantSubject;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        children: [
          IllustrationCard(
            title: 'Video Lectures',
            subtitle: 'Watch topic-wise video tutorials for your subjects',
            imagePath: 'assets/images/physics_card.png',
            gradient: AppTheme.card1Gradient,
            buttonLabel: 'Start Watching',
            onTap: () => MainScaffoldState.of(context)?.setIndex(1),
          ),
          const SizedBox(height: 14),
          IllustrationCard(
            title: displayTitle,
            subtitle: 'Study notes, resources, and question papers for $importantSubject',
            imagePath: 'assets/images/geometry_card.png',
            gradient: AppTheme.card2Gradient,
            buttonLabel: 'Start Learning',
            onTap: () {
              Navigator.push(
                context,
                AppTransitions.slideRight(
                  NotesBySubjectScreen(
                    subjectName: importantSubject,
                    color: AppTheme.accentSecondary,
                    year: year.toString(),
                    semester: sem,
                    dept: dept,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.08, curve: Curves.easeOut);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Subject Cards (horizontal scroll)
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildSubjectCards() {
    final subjects = _getTopSubjects();
    final colors = [
      AppTheme.accentPrimary,
      AppTheme.accentSecondary,
      AppTheme.accentTertiary,
      const Color(0xFFFF6B9D),
    ];
    final bgColors = [
      AppTheme.cardBg1,
      AppTheme.cardBg2,
      AppTheme.cardBg3,
      const Color(0xFFFFF0F5),
    ];
    final icons = [
      Icons.calculate_rounded,
      Icons.science_rounded,
      Icons.code_rounded,
      Icons.memory_rounded,
    ];

    return SizedBox(
      height: 172,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        physics: const BouncingScrollPhysics(),
        itemCount: subjects.length,
        separatorBuilder: (_, i) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final color = colors[index % colors.length];
          final bg = bgColors[index % bgColors.length];
          return _buildSubjectCard(
            subject: subjects[index],
            color: color,
            bgColor: bg,
            icon: icons[index % icons.length],
            onTap: () => MainScaffoldState.of(context)?.setIndex(1),
          );
        },
      ),
    ).animate().fadeIn(delay: 220.ms).slideX(begin: 0.08, curve: Curves.easeOut);
  }

  Widget _buildSubjectCard({
    required String subject,
    required Color color,
    required Color bgColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    final shortTitle = subject
        .replaceAll('Mathematics for ', 'Math ')
        .replaceAll('Engineering ', 'Engg ')
        .replaceAll('Introduction to ', 'Intro to ')
        .replaceAll('Data Structures and', 'DSA —')
        .replaceAll('Database Management Systems', 'DBMS');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 148,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.12),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const Spacer(),
            Text(
              shortTitle,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textMain,
                fontSize: 13,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: LinearProgressIndicator(
                      minHeight: 5,
                      value: 0.55 + (0.08 * (subject.length % 5)),
                      backgroundColor: color.withValues(alpha: 0.12),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, color: color, size: 16),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Actions Grid
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildQuickActionsGrid() {
    final items = [
      _QuickAction(
        title: 'Study Notes',
        subtitle: 'Notes & PYQs',
        icon: Icons.menu_book_rounded,
        color: AppTheme.accentPrimary,
        bgColor: AppTheme.cardBg1,
        onTap: () => MainScaffoldState.of(context)?.setIndex(1),
      ),
      _QuickAction(
        title: 'Classes',
        subtitle: 'Events today',
        icon: Icons.calendar_month_rounded,
        color: AppTheme.accentTertiary,
        bgColor: AppTheme.cardBg3,
        onTap: () => Navigator.push(
          context,
          AppTransitions.slideUp(const EventListScreen()),
        ),
      ),
      _QuickAction(
        title: 'Projects',
        subtitle: 'Build & earn XP',
        icon: Icons.rocket_launch_rounded,
        color: AppTheme.accentSecondary,
        bgColor: AppTheme.cardBg2,
        onTap: () => MainScaffoldState.of(context)?.setIndex(2),
      ),
      _QuickAction(
        title: 'Leaderboard',
        subtitle: 'Top students',
        icon: Icons.emoji_events_rounded,
        color: const Color(0xFFFF6B9D),
        bgColor: const Color(0xFFFFF0F5),
        onTap: () => Navigator.push(
          context,
          AppTransitions.slideUp(const LeaderboardScreen()),
        ),
      ),
      if (_isExec)
        _QuickAction(
          title: 'Admin',
          subtitle: 'Core tools',
          icon: Icons.admin_panel_settings_rounded,
          color: AppTheme.accentPrimary,
          bgColor: AppTheme.cardBg1,
          onTap: () => Navigator.push(
            context,
            AppTransitions.slideUp(const CoreMembersScreen()),
          ),
        ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: items.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.12,
        ),
        itemBuilder: (context, index) => _buildQuickActionCard(items[index]),
      ),
    ).animate().fadeIn(delay: 240.ms).slideY(begin: 0.08, curve: Curves.easeOut);
  }

  Widget _buildQuickActionCard(_QuickAction action) {
    return GestureDetector(
      onTap: action.onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: action.color.withValues(alpha: 0.10),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: action.bgColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const Spacer(),
            Text(
              action.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textMain,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 3),
            Row(
              children: [
                Expanded(
                  child: Text(
                    action.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: action.color,
                  size: 16,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Contribute Card
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildContributeCard() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppTheme.accentPrimary.withValues(alpha: 0.07),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg1,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.volunteer_activism_rounded,
                    color: AppTheme.accentPrimary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CONTRIBUTE',
                        style: TextStyle(
                          color: AppTheme.accentSecondary,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.8,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Share with the community',
                        style: TextStyle(
                          color: AppTheme.textMain,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                if (_isExec || _isCoreMember) ...[
                  Expanded(
                    child: _buildContributeButton(
                      'Add Note',
                      Icons.note_add_rounded,
                      AppTheme.accentPrimary,
                      AppTheme.cardBg1,
                      () => Navigator.push(
                        context,
                        AppTransitions.slideUp(const AddNoteScreen()),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: _buildContributeButton(
                    'Post Project',
                    Icons.rocket_launch_rounded,
                    AppTheme.accentSecondary,
                    AppTheme.cardBg2,
                    () => Navigator.push(
                      context,
                      AppTransitions.slideUp(const AddProjectScreen()),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 280.ms);
  }

  Widget _buildContributeButton(
    String label,
    IconData icon,
    Color color,
    Color bg,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textMain,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            'See all',
            style: const TextStyle(
              color: AppTheme.accentPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helper Models ─────────────────────────────────────────────────────────

class _QuickAction {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _QuickAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });
}
