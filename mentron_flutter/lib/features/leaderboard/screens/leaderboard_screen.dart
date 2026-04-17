import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});
  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<Map<String, dynamic>> _students = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('leaderboard_view')
          .select('full_name, xp, roll_number, department')
          .order('xp', ascending: false)
          .limit(20);
      if (mounted) setState(() { _students = List<Map<String, dynamic>>.from(response); _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: Column(children: [
          const Text('COMMUNITY INFLUENCE', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Leaderboard', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                child: Column(children: [
                  // Top 3 Podium
                  if (_students.length >= 3) _buildPodium(),
                  const SizedBox(height: 24),
                  // Full Rankings Table
                  GlassContainer(
                    padding: EdgeInsets.zero,
                    child: Column(children: [
                      // Header
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        child: const Row(children: [
                          SizedBox(width: 40, child: Text('RANK', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1))),
                          Expanded(child: Text('STUDENT', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1))),
                          Text('VOTES', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                        ]),
                      ),
                      Divider(color: Colors.white.withValues(alpha: 0.05), height: 1),
                      ...List.generate(_students.length, (index) => RepaintBoundary(child: _buildRankRow(_students[index], index))),
                    ]),
                  ).animate().fadeIn(delay: 300.ms),
                ]),
              ),
      ),
    );
  }

  Widget _buildPodium() {
    final medals = ['👑', '🥈', '🥉'];
    final colors = [AppTheme.accentSecondary, AppTheme.textMuted, AppTheme.accentPrimary];
    // Reorder: 2nd, 1st, 3rd for podium display
    final order = _students.length >= 3 ? [1, 0, 2] : [0];
    
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: order.map((i) {
        final student = _students[i];
        final isFirst = i == 0;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(bottom: isFirst ? 0 : 20, left: 4, right: 4),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              border: Border.all(color: colors[i].withValues(alpha: 0.4), width: isFirst ? 2 : 1),
              child: Column(children: [
                Text(medals[i], style: const TextStyle(fontSize: 28)),
                const SizedBox(height: 8),
                Text(student['full_name'] ?? '', textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 4),
                Text('${student['xp'] ?? 0} Votes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: colors[i])),
                if (student['department'] != null)
                  Text(student['department'], style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, letterSpacing: 1)),
              ]),
            ),
          ).animate().fadeIn(delay: (i * 100).ms).slideY(begin: 0.1),
        );
      }).toList(),
    );
  }

  Widget _buildRankRow(Map<String, dynamic> student, int index) {
    final isTopThree = index < 3;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(children: [
        SizedBox(
          width: 40,
          child: Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color: isTopThree ? AppTheme.accentSecondary.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text('${index + 1}', style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w900,
              color: isTopThree ? AppTheme.accentSecondary : AppTheme.textMuted,
            ))),
          ),
        ),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(student['full_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
          if (student['roll_number'] != null)
            Text(student['roll_number'], style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 1)),
        ])),
        Text('${student['xp'] ?? 0}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
      ]),
    );
  }
}
