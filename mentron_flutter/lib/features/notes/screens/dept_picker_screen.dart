import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../data/models/subject_data.dart';
import 'subjects_screen.dart';

class DeptPickerScreen extends StatefulWidget {
  final int year;
  final String sem;
  const DeptPickerScreen({super.key, required this.year, required this.sem});

  @override
  State<DeptPickerScreen> createState() => _DeptPickerScreenState();
}

class _DeptPickerScreenState extends State<DeptPickerScreen> {
  String? _userDept;

  static const _deptColors = {
    'CSE': Color(0xFF3B82F6),
    'ECE': Color(0xFF06B6D4),
    'ME':  Color(0xFFF97316),
    'MEA': Color(0xFFEF4444),
    'BT':  Color(0xFF22C55E),
  };

  @override
  void initState() {
    super.initState();
    _loadUserDept();
  }

  Future<void> _loadUserDept() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final user = supabase.currentUser;
    if (user == null) return;
    try {
      final profile = await supabase.client
          .from('profiles')
          .select('department')
          .eq('id', user.id)
          .maybeSingle();
      if (mounted && profile != null) {
        setState(() => _userDept = (profile['department'] as String?)?.trim().toUpperCase());
      }
    } catch (_) {}
  }

  void _showLockedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [
          Icon(Icons.lock_rounded, color: Colors.amber, size: 20),
          SizedBox(width: 10),
          Text('Access Restricted', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ]),
        content: const Text(
          'You can only view notes from your own department with your current subscription.',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it', style: TextStyle(color: AppTheme.accentSecondary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final depts = SubjectData.departments.entries.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text('YEAR ${widget.year} · ${widget.sem}',
              style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Select Department', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
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
              const Icon(Icons.info_outline_rounded, color: AppTheme.textMuted, size: 14),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Notes are restricted to your enrolled department.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12, height: 1.5),
                ),
              ),
            ]).animate().fadeIn(),
            const SizedBox(height: 24),
            ...List.generate(depts.length, (i) {
              final code = depts[i].key;
              final meta = depts[i].value;
              final isUnlocked = _userDept == null || _userDept == code;
              final color = isUnlocked ? _deptColors[code]! : Colors.grey;

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () {
                    if (!isUnlocked) {
                      _showLockedDialog(context);
                      return;
                    }
                    Navigator.push(
                      context,
                      AppTransitions.slideUp(SubjectsScreen(
                        title: '$code · ${widget.sem}',
                        subtitle: meta['name']!,
                        subjects: SubjectData.getSubjects(code, widget.sem),
                        color: _deptColors[code]!,
                        year: widget.year,
                        dept: code,
                      )),
                    );
                  },
                  borderRadius: BorderRadius.circular(24),
                  child: Opacity(
                    opacity: isUnlocked ? 1.0 : 0.4,
                    child: GlassContainer(
                      padding: const EdgeInsets.all(24),
                      border: Border.all(color: color.withOpacity(0.35)),
                      child: Row(children: [
                        Container(
                          width: 56, height: 56,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: isUnlocked
                                ? Text(meta['emoji']!, style: const TextStyle(fontSize: 26))
                                : const Icon(Icons.lock_rounded, color: Colors.grey, size: 22),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(code, style: TextStyle(color: isUnlocked ? Colors.white : Colors.grey, fontWeight: FontWeight.w900, fontSize: 18)),
                            const SizedBox(height: 4),
                            Text(meta['name']!, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                            if (!isUnlocked) ...[
                              const SizedBox(height: 4),
                              const Text('Subscription required', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
                            ],
                          ]),
                        ),
                        Icon(
                          isUnlocked ? Icons.chevron_right_rounded : Icons.lock_outline_rounded,
                          color: color.withOpacity(0.6),
                        ),
                      ]),
                    ),
                  ),
                ).animate().fadeIn(delay: (i * 80).ms).slideX(begin: -0.04),
              );
            }),
          ],
        ),
      ),
    );
  }
}
