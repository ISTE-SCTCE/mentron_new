import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../data/models/subject_data.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../widgets/real_time_calendar.dart';
import '../widgets/event_banner_widget.dart';
import '../../notes/screens/add_note_screen.dart';
import '../../projects/screens/add_project_screen.dart';
import '../../events/screens/event_list_screen.dart';
import '../../leaderboard/screens/leaderboard_screen.dart';
import '../../profile/screens/profile_screen.dart';
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

  @override
  Widget build(BuildContext context) {
    final firstName =
        _profile?['full_name']?.toString().split(' ').first ?? 'Student';

    return Scaffold(
      body: LiquidBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 108),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(firstName),
                const SizedBox(height: 18),
                _buildHero(firstName),
                const SizedBox(height: 18),
                _buildLearningStats(),
                const SizedBox(height: 22),
                if (!_isExec) ...[
                  _buildSectionHeader('Top subjects'),
                  const SizedBox(height: 12),
                  _buildTopSubjects(),
                  const SizedBox(height: 22),
                ],
                _buildSectionHeader('Learning paths'),
                const SizedBox(height: 12),
                _buildLearningGrid(),
                const SizedBox(height: 22),
                if (_userRole != 'exec' && _userRole != 'core') ...[
                  const EventBannerWidget(),
                  const SizedBox(height: 22),
                ],
                _buildSectionHeader('Class calendar'),
                const SizedBox(height: 12),
                const RealTimeCalendar(),
                const SizedBox(height: 22),
                _buildContributeCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String firstName) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'WELCOME BACK',
                style: TextStyle(
                  color: AppTheme.accentSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                firstName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.displayMedium?.copyWith(fontSize: 30, height: 1),
              ),
            ],
          ),
        ),
        _buildRoundAction(
          icon: Icons.forum_rounded,
          onTap: () => Navigator.push(
            context,
            AppTransitions.slideUp(const ForumListScreen()),
          ),
        ),
        const SizedBox(width: 10),
        _buildRoundAction(
          icon: Icons.person_rounded,
          onTap: () => Navigator.push(
            context,
            AppTransitions.slideUp(const ProfileScreen()),
          ),
        ),
      ],
    ).animate().fadeIn().slideY(begin: -0.08);
  }

  Widget _buildRoundAction({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        width: 46,
        height: 46,
        borderRadius: 16,
        child: Icon(icon, color: AppTheme.accentPrimary, size: 21),
      ),
    );
  }

  Widget _buildHero(String firstName) {
    final year = _profile?['year']?.toString() ?? 'All';
    final dept = _profile?['department']?.toString() ?? 'General';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppTheme.accentPrimary,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: AppTheme.accentPrimary.withValues(alpha: 0.26),
            blurRadius: 34,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -32,
            top: -42,
            child: _HeroBubble(
              color: AppTheme.accentSecondary.withValues(alpha: 0.38),
            ),
          ),
          Positioned(
            left: 20,
            bottom: -52,
            child: _HeroBubble(
              color: AppTheme.accentTertiary.withValues(alpha: 0.24),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      color: Colors.white,
                      size: 15,
                    ),
                    SizedBox(width: 6),
                    Text(
                      'Study plan',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Pick up where\nyou left off.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 35,
                  fontWeight: FontWeight.w900,
                  height: 0.98,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Your notes, classes, practice projects, and rank are arranged around learning now.',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.76),
                  fontSize: 13,
                  height: 1.45,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _HeroMeta(label: 'Year', value: year),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _HeroMeta(label: 'Dept', value: dept),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.08);
  }

  Widget _buildLearningStats() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'XP',
            userXP >= 1000
                ? '${(userXP / 1000).toStringAsFixed(1)}k'
                : '$userXP',
            Icons.bolt_rounded,
            AppTheme.accentSecondary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            'Notes',
            '$totalNotes',
            Icons.menu_book_rounded,
            AppTheme.accentPrimary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            'Projects',
            '$totalProjects',
            Icons.assignment_rounded,
            AppTheme.accentTertiary,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 120.ms).slideY(begin: 0.08);
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
      'Data Structures and Algorithms',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
    ];
  }

  Widget _buildTopSubjects() {
    final subjects = _getTopSubjects();
    final colors = [
      AppTheme.accentPrimary,
      AppTheme.accentSecondary,
      AppTheme.accentTertiary,
      const Color(0xFFE11D48),
    ];
    final icons = [
      Icons.calculate_rounded,
      Icons.science_rounded,
      Icons.code_rounded,
      Icons.memory_rounded,
    ];

    return SizedBox(
      height: 166,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: subjects.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final color = colors[index % colors.length];
          return _buildSubjectCard(
            subject: subjects[index],
            color: color,
            icon: icons[index % icons.length],
            onTap: () => MainScaffoldState.of(context)?.setIndex(1),
          );
        },
      ),
    ).animate().fadeIn(delay: 150.ms).slideX(begin: 0.08);
  }

  Widget _buildSubjectCard({
    required String subject,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    final shortTitle = subject
        .replaceAll('Mathematics for ', 'Math ')
        .replaceAll('Engineering ', 'Engg ')
        .replaceAll('Introduction to ', 'Intro to ');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 142,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: color.withValues(alpha: 0.14)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.13),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: color, size: 23),
            ),
            const Spacer(),
            Text(
              shortTitle,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textMain,
                fontSize: 14,
                fontWeight: FontWeight.w900,
                height: 1.12,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      minHeight: 6,
                      value: 0.65 + (0.07 * (subject.length % 4)),
                      backgroundColor: color.withValues(alpha: 0.10),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, color: color, size: 17),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return GlassContainer(
      height: 112,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const Spacer(),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.textMain,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            maxLines: 1,
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLearningGrid() {
    final items = [
      _LearningAction(
        title: 'Learn',
        subtitle: 'Notes and PYQs',
        icon: Icons.menu_book_rounded,
        color: AppTheme.accentPrimary,
        onTap: () => MainScaffoldState.of(context)?.setIndex(1),
      ),
      _LearningAction(
        title: 'Classes',
        subtitle: 'Events today',
        icon: Icons.calendar_month_rounded,
        color: AppTheme.accentTertiary,
        onTap: () => Navigator.push(
          context,
          AppTransitions.slideUp(const EventListScreen()),
        ),
      ),
      _LearningAction(
        title: 'Practice',
        subtitle: 'Projects',
        icon: Icons.assignment_rounded,
        color: AppTheme.accentSecondary,
        onTap: () => MainScaffoldState.of(context)?.setIndex(2),
      ),
      _LearningAction(
        title: 'Rank',
        subtitle: 'Leaderboard',
        icon: Icons.emoji_events_rounded,
        color: const Color(0xFFE11D48),
        onTap: () => Navigator.push(
          context,
          AppTransitions.slideUp(const LeaderboardScreen()),
        ),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length + (_isExec ? 1 : 0),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.08,
      ),
      itemBuilder: (context, index) {
        if (index < items.length) return _buildLearningAction(items[index]);
        return _buildLearningAction(
          _LearningAction(
            title: 'Members',
            subtitle: 'Core tools',
            icon: Icons.admin_panel_settings_rounded,
            color: AppTheme.accentPrimary,
            onTap: () => Navigator.push(
              context,
              AppTransitions.slideUp(const CoreMembersScreen()),
            ),
          ),
        );
      },
    ).animate().fadeIn(delay: 180.ms).slideY(begin: 0.08);
  }

  Widget _buildLearningAction(_LearningAction action) {
    return GestureDetector(
      onTap: action.onTap,
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: action.color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(action.icon, color: action.color, size: 23),
            ),
            const Spacer(),
            Text(
              action.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textMain,
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
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
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: action.color,
                  size: 18,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(
        color: AppTheme.textMuted,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 2.2,
      ),
    );
  }

  Widget _buildContributeCard() {
    return GlassContainer(
      padding: const EdgeInsets.all(18),
      border: Border.all(color: AppTheme.accentPrimary.withValues(alpha: 0.16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: AppTheme.accentPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.add_rounded,
                  color: AppTheme.accentPrimary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CONTRIBUTE',
                      style: TextStyle(
                        color: AppTheme.accentSecondary,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.6,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Share with the community',
                      style: TextStyle(
                        color: AppTheme.textMain,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
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
    ).animate().fadeIn(delay: 240.ms);
  }

  Widget _buildContributeButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.11),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: 0.18)),
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
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroMeta extends StatelessWidget {
  final String label;
  final String value;

  const _HeroMeta({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.62),
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroBubble extends StatelessWidget {
  final Color color;

  const _HeroBubble({required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 142,
      height: 142,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _LearningAction {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _LearningAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}
