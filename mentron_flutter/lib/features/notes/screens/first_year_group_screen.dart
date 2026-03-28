import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import '../../../data/models/subject_data.dart';
import 'subjects_screen.dart';

class FirstYearGroupScreen extends StatelessWidget {
  final String sem;
  const FirstYearGroupScreen({super.key, required this.sem});

  static const _groupColors = {
    'A': Color(0xFF3B82F6),
    'B': Color(0xFFEAB308),
    'C': Color(0xFFF97316),
    'D': Color(0xFF22C55E),
  };

  @override
  Widget build(BuildContext context) {
    final groups = SubjectData.firstYearGroups.entries.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text('1ST YEAR · $sem', style: const TextStyle(color: Color(0xFF22C55E), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Select Group', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
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
              'Choose the stream group that matches your department',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5),
            ).animate().fadeIn(),
            const SizedBox(height: 24),
            ...List.generate(groups.length, (i) {
              final entry = groups[i];
              final groupKey = entry.key;
              final meta = entry.value;
              final color = _groupColors[groupKey]!;

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () => Navigator.push(
                    context,
                    AppTransitions.slideUp(SubjectsScreen(
                      title: '${meta['label']} · $sem',
                      subtitle: meta['streams']!,
                      subjects: SubjectData.getFirstYearSubjects(groupKey, sem),
                      color: color,
                      year: 1,
                      dept: 'Group $groupKey',
                    )),
                  ),
                  borderRadius: BorderRadius.circular(24),
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
                        child: Center(child: Text(meta['emoji']!, style: const TextStyle(fontSize: 26))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(meta['label']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                          const SizedBox(height: 4),
                          Text(meta['streams']!, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
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
