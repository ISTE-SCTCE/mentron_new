import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import 'note_list_screen.dart';
import 'semester_screen.dart';
import '../../../core/utils/app_transitions.dart';

class GroupScreen extends StatefulWidget {
  const GroupScreen({super.key});

  @override
  State<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends State<GroupScreen> {
  String? _userDept;
  String? _userYear;
  String? _userRoll;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final user = supabase.currentUser;
    if (user == null) { setState(() => _isLoading = false); return; }

    try {
      final profile = await supabase.client
          .from('profiles')
          .select('department, roll_number, year')
          .eq('id', user.id)
          .maybeSingle();

      if (mounted && profile != null) {
        final roll = profile['roll_number'] as String?;
        final detected = DepartmentMapper.getDepartmentFromRoll(roll);
        String? dept;
        if (detected != 'Other') {
          dept = detected;
        } else {
          final stored = (profile['department'] as String? ?? '').trim();
          if (stored.isNotEmpty && stored.toLowerCase() != 'other') dept = stored;
        }
        setState(() {
          _userRoll = roll;
          _userDept = dept;
          _userYear = profile['year']?.toString();
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  static const _yearCards = [
    _YearCard(year: 1, label: '1st Year', sems: 'S1 & S2', emoji: '🌱', color: Color(0xFF22C55E)),
    _YearCard(year: 2, label: '2nd Year', sems: 'S3 & S4', emoji: '📘', color: Color(0xFF3B82F6)),
    _YearCard(year: 3, label: '3rd Year', sems: 'S5 & S6', emoji: '🔬', color: Color(0xFFA855F7)),
    _YearCard(year: 4, label: '4th Year', sems: 'S7 & S8', emoji: '🎓', color: Color(0xFFF97316)),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          const Text('ACADEMIC', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Library', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : ListView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
                children: [
                  // ── Browse by Year ───────────────────────────────
                  _buildSectionHeader('BROWSE BY YEAR'),
                  const SizedBox(height: 16),
                  ..._yearCards.asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _buildYearBrowseCard(e.value, e.key),
                  )),
                ],
              ),
      ),
    );
  }

  Widget _buildMyDeptCard() {
    final deptName = DepartmentMapper.getName(_userDept!);
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      border: Border.all(color: AppTheme.accentPrimary.withOpacity(0.5), width: 1.5),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.folder_special_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('YOUR DEPARTMENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
            Text(deptName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            if (_userRoll != null)
              Text(_userRoll!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 1)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: AppTheme.accentPrimary.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: Text(_userDept!, style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900)),
          ),
        ]),
        const SizedBox(height: 16),
        const Text('SELECT YEAR', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
        const SizedBox(height: 10),
        Row(children: List.generate(4, (i) {
          final year = '${i + 1}';
          final isMyYear = _userYear == year;
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
              child: GestureDetector(
                onTap: () => Navigator.push(context, AppTransitions.slideUp(NoteListScreen(deptCode: _userDept!, year: year))),
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: isMyYear ? LinearGradient(colors: [AppTheme.accentPrimary, AppTheme.accentSecondary]) : null,
                    color: isMyYear ? null : Colors.white.withOpacity(0.07),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isMyYear ? AppTheme.accentPrimary : Colors.white.withOpacity(0.12), width: isMyYear ? 0 : 1),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(year, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isMyYear ? Colors.black : Colors.white)),
                    if (isMyYear) const Text('MINE', style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black54, letterSpacing: 1)),
                  ]),
                ),
              ),
            ),
          );
        })),
      ]),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 3));
  }

  Widget _buildYearBrowseCard(_YearCard y, int index) {
    return InkWell(
      onTap: () => Navigator.push(context, AppTransitions.slideUp(SemesterScreen(year: y.year))),
      borderRadius: BorderRadius.circular(20),
      child: GlassContainer(
        padding: const EdgeInsets.all(18),
        border: Border.all(color: y.color.withOpacity(0.3)),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: y.color.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
            child: Center(child: Text(y.emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(y.label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            Text(y.sems, style: TextStyle(color: y.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ])),
          Icon(Icons.chevron_right_rounded, color: y.color.withOpacity(0.5)),
        ]),
      ),
    ).animate().fadeIn(delay: (index * 60).ms).slideX(begin: -0.03);
  }
}

class _YearCard {
  final int year;
  final String label;
  final String sems;
  final String emoji;
  final Color color;
  const _YearCard({required this.year, required this.label, required this.sems, required this.emoji, required this.color});
}
