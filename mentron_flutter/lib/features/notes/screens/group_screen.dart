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
import 'notes_by_subject_screen.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../data/models/subject_data.dart';
import '../../../core/providers/academic_provider.dart';

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

  bool _showAll = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false, // tab screen — no back button
        title: Column(children: [
          const Text('ACADEMIC', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Library', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : ListView(
                padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
                children: [
                  // Toggle UI
                  Container(
                    margin: const EdgeInsets.only(bottom: 24),
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _showAll = false),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: !_showAll ? AppTheme.accentPrimary : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: const Text('My Course', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _showAll = true),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _showAll ? AppTheme.accentPrimary : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: const Text('See All', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (!_showAll) ...[
                    if (_userDept != null) _buildMySubjectsList(),
                    if (_userDept == null) const Text("Please update your profile to see your course", style: TextStyle(color: Colors.white70)),
                  ] else ...[
                    // ── Browse by Year ───────────────────────────────
                    _buildSectionHeader('BROWSE BY YEAR'),
                    const SizedBox(height: 16),
                    ..._yearCards.asMap().entries.map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _buildYearBrowseCard(e.value, e.key),
                    )),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildMySubjectsList() {
    final academic = Provider.of<AcademicProvider>(context, listen: false);
    final year = academic.currentAcademicYear;
    final semNum = academic.currentSemester;
    final sem = 'S$semNum';
    final dept = _userDept?.toUpperCase() ?? 'CSE';

    List<String> subjects = [];
    if (year == 1) {
      final group = SubjectData.getGroupFromDepartment(dept);
      subjects = SubjectData.getFirstYearSubjects(group, sem);
    } else {
      subjects = SubjectData.getSubjects(dept, sem);
    }

    if (subjects.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Text("No subjects found for your course.", style: TextStyle(color: Colors.white70)),
        ),
      );
    }

    final colors = [
      AppTheme.accentPrimary,
      AppTheme.accentSecondary,
      AppTheme.accentTertiary,
      const Color(0xFFFF6B9D),
    ];
    final icons = [
      Icons.calculate_rounded,
      Icons.science_rounded,
      Icons.code_rounded,
      Icons.memory_rounded,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppTheme.accentPrimary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
              child: Text(dept, style: const TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 8),
            Text('Semester $semNum', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        ...subjects.asMap().entries.map((entry) {
          final index = entry.key;
          final subject = entry.value;
          final color = colors[index % colors.length];
          final icon = icons[index % icons.length];
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  AppTransitions.slideRight(
                    NotesBySubjectScreen(
                      subjectName: subject,
                      color: color,
                      year: year.toString(),
                      semester: sem,
                      dept: dept,
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(16),
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                border: Border.all(color: color.withValues(alpha: 0.3)),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                      child: Icon(icon, color: color, size: 20),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        subject,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: color.withValues(alpha: 0.5)),
                  ],
                ),
              ),
            ),
          ).animate().fadeIn(delay: (index * 40).ms).slideX(begin: -0.03);
        }),
      ],
    );
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
        border: Border.all(color: y.color.withValues(alpha: 0.3)),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: y.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
            child: Center(child: Text(y.emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(y.label, style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 15)),
            Text(y.sems, style: TextStyle(color: y.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ])),
          Icon(Icons.chevron_right_rounded, color: y.color.withValues(alpha: 0.5)),
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
