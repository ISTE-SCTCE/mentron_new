import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../data/models/subject_data.dart';
import 'subjects_screen.dart';

class DeptPickerScreen extends StatelessWidget {
  final int year;
  final String sem;
  const DeptPickerScreen({super.key, required this.year, required this.sem});

  static const _deptColors = {
    'CSE': Color(0xFF3B82F6),
    'ECE': Color(0xFF06B6D4),
    'ME':  Color(0xFFF97316),
    'MEA': Color(0xFFEF4444),
    'BT':  Color(0xFF22C55E),
  };

  @override
  Widget build(BuildContext context) {
    final depts = SubjectData.departments.entries.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text('YEAR $year · $sem', style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
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
            const Text(
              'Choose your stream to view subjects and notes',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
            ).animate().fadeIn(),
            const SizedBox(height: 24),
            ...List.generate(depts.length, (i) {
              final code = depts[i].key;
              final meta = depts[i].value;
              final color = _deptColors[code]!;

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () => Navigator.push(
                    context,
                    AppTransitions.slideUp(SubjectsScreen(
                      title: '$code · $sem',
                      subtitle: meta['name']!,
                      subjects: SubjectData.getSubjects(code, sem),
                      color: color,
                      year: year,
                      dept: code,
                    )),
                  ),
                  borderRadius: BorderRadius.circular(24),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(24),
                    border: Border.all(color: color.withOpacity(0.35)),
                    child: Row(children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
                        child: Center(child: Text(meta['emoji']!, style: const TextStyle(fontSize: 26))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(code, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                          const SizedBox(height: 4),
                          Text(meta['name']!, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                        ]),
                      ),
                      Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.6)),
                    ]),
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
