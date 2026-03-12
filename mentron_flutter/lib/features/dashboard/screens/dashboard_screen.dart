import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../widgets/real_time_calendar.dart';
import '../../notes/screens/group_screen.dart';
import '../../notes/screens/add_note_screen.dart';
import '../../projects/screens/project_list_screen.dart';
import '../../projects/screens/add_project_screen.dart';
import '../../marketplace/screens/marketplace_screen.dart';
import '../../events/screens/event_list_screen.dart';
import '../../leaderboard/screens/leaderboard_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../societies/screens/societies_screen.dart';
import '../../team/screens/team_screen.dart';
import '../../../core/utils/app_transitions.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int totalMembers = 0;
  int totalNotes = 0;
  int totalProjects = 0;

  @override
  void initState() {
    super.initState();
    _loadInitialStats();
    _setupRealtime();
  }

  Future<void> _loadInitialStats() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    
    // Using simple count queries
    final membersRes = await supabase.from('profiles').select('id');
    final notesRes = await supabase.from('notes').select('id');
    final projectsRes = await supabase.from('projects').select('id');

    if (mounted) {
      setState(() {
        totalMembers = (membersRes as List).length;
        totalNotes = (notesRes as List).length;
        totalProjects = (projectsRes as List).length;
      });
    }
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    
    supabase.subscribeToTable(table: 'profiles', onUpdate: (_) => _loadInitialStats());
    supabase.subscribeToTable(table: 'notes', onUpdate: (_) => _loadInitialStats());
    supabase.subscribeToTable(table: 'projects', onUpdate: (_) => _loadInitialStats());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LiquidBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildStatsGrid(),
                const SizedBox(height: 32),
                _buildSectionHeader('ACADEMIC CALENDAR'),
                const SizedBox(height: 16),
                const RealTimeCalendar(),
                const SizedBox(height: 32),
                _buildContributeCard(),
                const SizedBox(height: 32),
                _buildSectionHeader('QUICK ACTIONS'),
                const SizedBox(height: 16),
                _buildActionButtons(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContributeCard() {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      border: Border.all(color: AppTheme.accentPrimary.withOpacity(0.3)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.accentPrimary.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.add_rounded, color: AppTheme.accentPrimary, size: 20),
          ),
          const SizedBox(width: 12),
          const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('CONTRIBUTE', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
            Text('Share with the community', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
          ]),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _buildContributeButton(
            'Add Note', Icons.note_add_rounded, AppTheme.accentSecondary,
            () => Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen())),
          )),
          const SizedBox(width: 12),
          Expanded(child: _buildContributeButton(
            'Post Project', Icons.rocket_launch_rounded, AppTheme.accentPrimary,
            () => Navigator.push(context, AppTransitions.slideUp(const AddProjectScreen())),
          )),
        ]),
      ]),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _buildContributeButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        ]),
      ),
    );
  }

  Widget _buildHeader() {
    final user = Provider.of<SupabaseService>(context).currentUser;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('WELCOME BACK,', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
            Text(user?.email?.split('@').first.toUpperCase() ?? 'STUDENT', style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 28)),
          ],
        ),
        Row(
          children: [
            // Small Mentron logo top-right
            Image.asset(
              'assets/images/mentron_logo.png',
              width: 60,
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => Navigator.push(context, AppTransitions.slideUp(const ProfileScreen())),
              child: const GlassContainer(padding: EdgeInsets.all(12), borderRadius: 12, child: Icon(Icons.person_rounded, color: AppTheme.accentSecondary, size: 20)),
            ),
          ],
        ),
      ],
    ).animate().fadeIn().slideX(begin: -0.1);
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('MEMBERS', totalMembers.toString(), Icons.people_outline, AppTheme.accentPrimary),
        _buildStatCard('NOTES', totalNotes.toString(), Icons.note_outlined, AppTheme.accentSecondary),
        _buildStatCard('PROJECTS', totalProjects.toString(), Icons.rocket_launch_outlined, Colors.orangeAccent),
        _buildStatCard('XP', '1.2k', Icons.bolt_rounded, Colors.yellowAccent),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(color: color.withOpacity(0.7), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 20),
          ),
        ],
      ),
    ).animate().scale(delay: 200.ms);
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: AppTheme.textMuted,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 3,
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(children: [
      _buildActionButton('Academic Library', 'Browse notes & materials', Icons.library_books_rounded, AppTheme.accentSecondary,
          () => Navigator.push(context, AppTransitions.slideUp(GroupScreen()))),
      const SizedBox(height: 12),
      _buildActionButton('Incubation Center', 'View projects & apply', Icons.rocket_launch_rounded, AppTheme.accentPrimary,
          () => Navigator.push(context, AppTransitions.slideUp(ProjectListScreen()))),
      const SizedBox(height: 12),
      _buildActionButton('Student Market', 'Buy & sell textbooks', Icons.shopping_bag_outlined, Colors.greenAccent,
          () => Navigator.push(context, AppTransitions.slideUp(MarketplaceScreen()))),
      const SizedBox(height: 12),
      _buildActionButton('Upcoming Events', 'Register for workshops', Icons.event_rounded, Colors.orangeAccent,
          () => Navigator.push(context, AppTransitions.slideUp(const EventListScreen()))),
      const SizedBox(height: 12),
      _buildActionButton('Leaderboard', 'View XP rankings', Icons.emoji_events_rounded, Colors.amberAccent,
          () => Navigator.push(context, AppTransitions.slideUp(const LeaderboardScreen()))),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _buildSmallActionButton('Societies', '🏛️', () => Navigator.push(context, AppTransitions.slideUp(const SocietiesScreen())))),
        const SizedBox(width: 12),
        Expanded(child: _buildSmallActionButton('Team', '👥', () => Navigator.push(context, AppTransitions.slideUp(const TeamScreen())))),
      ]),
    ]);
  }

  Widget _buildSmallActionButton(String label, String emoji, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
        ]),
      ),
    );
  }

  void _showAddOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => GlassContainer(
        padding: const EdgeInsets.all(32),
        borderRadius: 0,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('WHAT WOULD YOU LIKE TO ADD?', 
              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildAddOption(
                  'NOTE', 
                  Icons.note_add_rounded, 
                  AppTheme.accentSecondary,
                  () {
                    Navigator.pop(context);
                    Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen()));
                  }
                ),
                _buildAddOption(
                  'PROJECT', 
                  Icons.rocket_launch_rounded, 
                  AppTheme.accentPrimary,
                  () {
                    Navigator.pop(context);
                    Navigator.push(context, AppTransitions.slideUp(const AddProjectScreen()));
                  }
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildAddOption(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(height: 12),
          Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildActionButton(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  Text(subtitle, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted),
          ],
        ),
      ),
    ).animate().slideY(begin: 0.1);
  }
}

