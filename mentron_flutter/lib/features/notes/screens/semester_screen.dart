import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../data/models/subject_data.dart';
import 'first_year_group_screen.dart';
import 'dept_picker_screen.dart';
import 'subjects_screen.dart';

class SemesterScreen extends StatefulWidget {
  final int year;
  const SemesterScreen({super.key, required this.year});

  @override
  State<SemesterScreen> createState() => _SemesterScreenState();
}

class _SemesterScreenState extends State<SemesterScreen> {
  String? _userDept;
  String? _userRole;
  bool _isLoadingProfile = false;

  static const _groupColors = {
    'A': Color(0xFF3B82F6),
    'B': Color(0xFFEAB308),
    'C': Color(0xFFF97316),
    'D': Color(0xFF22C55E),
  };

  @override
  void initState() {
    super.initState();
    _loadUserMetadata();
  }

  Future<void> _loadUserMetadata() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final user = supabase.currentUser;
    if (user == null) return;

    if (mounted) setState(() => _isLoadingProfile = true);
    try {
      final profile = await supabase.client
          .from('profiles')
          .select('department, role')
          .eq('id', user.id)
          .maybeSingle();

      if (mounted && profile != null) {
        setState(() {
          _userDept = (profile['department'] as String?)?.trim().toUpperCase();
          _userRole = (profile['role'] as String?)?.trim().toLowerCase();
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoadingProfile = false);
    }
  }

  static const _yearColors = [
    Color(0xFF22C55E),
    Color(0xFF3B82F6),
    Color(0xFFA855F7),
    Color(0xFFF97316),
  ];
  static const _yearLabels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  static const _yearEmojis = ['🌱', '📘', '🔬', '🎓'];

  @override
  Widget build(BuildContext context) {
    final color = _yearColors[widget.year - 1];
    final sems = SubjectData.semsForYear(widget.year);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text(_yearLabels[widget.year - 1].toUpperCase(), style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Select Semester', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
          children: [
            Row(children: [
              Text(_yearEmojis[widget.year - 1], style: const TextStyle(fontSize: 36)),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_yearLabels[widget.year - 1], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24)),
                Text('Choose a semester', style: TextStyle(color: color.withOpacity(0.7), fontSize: 12)),
              ]),
              if (_isLoadingProfile)
                const Padding(
                  padding: EdgeInsets.only(left: 16),
                  child: SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white24)),
                ),
            ]).animate().fadeIn(),
            const SizedBox(height: 32),
            ...List.generate(sems.length, (i) {
              final sem = sems[i];
              final semNum = int.parse(sem.substring(1));
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () {
                    if (widget.year == 1) {
                      final isPrivileged = _userRole == 'panel' || _userRole == 'exec';
                      if (!isPrivileged && _userDept != null && _userDept != 'OTHER') {
                        // Auto-assign group based on department
                        final groupKey = DepartmentMapper.getGroupFromDepartment(_userDept);
                        final meta = SubjectData.firstYearGroups[groupKey]!;
                        Navigator.push(
                          context,
                          AppTransitions.slideUp(SubjectsScreen(
                            title: '${meta['label']} · $sem',
                            subtitle: meta['streams']!,
                            subjects: SubjectData.getFirstYearSubjects(groupKey, sem),
                            color: _groupColors[groupKey]!,
                            year: 1,
                            dept: groupKey,
                            sem: sem,
                          )),
                        );
                      } else {
                        // Show picker if privileged or status unknown
                        Navigator.push(context, AppTransitions.slideUp(FirstYearGroupScreen(sem: sem)));
                      }
                    } else {
                      Navigator.push(context, AppTransitions.slideUp(DeptPickerScreen(year: widget.year, sem: sem)));
                    }
                  },
                  borderRadius: BorderRadius.circular(24),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(24),
                    border: Border.all(color: color.withOpacity(0.3)),
                    child: Row(
                      children: [
                        Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: color.withOpacity(0.2)),
                          ),
                          child: Center(
                            child: Text(sem, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 20)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Semester $semNum', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                              const SizedBox(height: 4),
                              Text(
                                widget.year == 1 ? 'Select your stream group (A / B / C / D)' : 'Select your department',
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.6)),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: (i * 100).ms).slideY(begin: 0.05),
              );
            }),
          ],
        ),
      ),
    );
  }
}
