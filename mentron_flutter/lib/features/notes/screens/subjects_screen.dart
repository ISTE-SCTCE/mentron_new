import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import 'notes_by_subject_screen.dart';

class SubjectsScreen extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<String> subjects;
  final Color color;
  final int year;
  final String dept;

  const SubjectsScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.subjects,
    required this.color,
    required this.year,
    required this.dept,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text(title, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
          Text(subtitle, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: LiquidBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 110, 24, 40),
          children: [
            Text('TAP A SUBJECT TO VIEW NOTES', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
            const SizedBox(height: 4),
            const Text('Each subject opens its dedicated notes page', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
            const SizedBox(height: 20),
            if (subjects.isEmpty)
              const Text('No subjects data.', style: TextStyle(color: AppTheme.textMuted))
            else
              ...List.generate(subjects.length, (i) {
                final subject = subjects[i];
                final isElective = subject.startsWith('Electives:');

                if (isElective) {
                  // Parse elective options
                  final electives = subject.replaceFirst('Electives: ', '').split(', ');
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(18),
                      border: Border.all(color: color.withOpacity(0.15)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                            child: Text('OPEN ELECTIVES', style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          ),
                          const SizedBox(width: 8),
                          Text('choose one', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.6), fontSize: 9)),
                        ]),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: electives.map((elective) => GestureDetector(
                            onTap: () => Navigator.push(context, AppTransitions.slideUp(
                              NotesBySubjectScreen(subjectName: elective.trim(), color: color),
                            )),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.07),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: color.withOpacity(0.25)),
                              ),
                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                Text(elective.trim(), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 6),
                                Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.5), size: 14),
                              ]),
                            ),
                          )).toList(),
                        ),
                      ]),
                    ).animate().fadeIn(delay: (i * 30).ms),
                  );
                }

                // Regular subject — tappable card
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: () => Navigator.push(context, AppTransitions.slideUp(
                      NotesBySubjectScreen(subjectName: subject, color: color),
                    )),
                    borderRadius: BorderRadius.circular(16),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(16),
                      border: Border.all(color: color.withOpacity(0.15)),
                      child: Row(children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(9)),
                          child: Center(child: Text('${i + 1}', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(subject, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3))),
                        Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.4), size: 18),
                      ]),
                    ),
                  ).animate().fadeIn(delay: (i * 30).ms).slideX(begin: -0.03),
                );
              }),
          ],
        ),
      ),
    );
  }
}
