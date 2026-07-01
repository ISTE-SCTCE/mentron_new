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
  final String sem;

  const SubjectsScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.subjects,
    required this.color,
    required this.year,
    required this.dept,
    required this.sem,
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
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: Theme.of(context).colorScheme.onSurface, size: 18),
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
                final isElective = subject.startsWith('Electives:') || subject.startsWith('Elective:');

                if (isElective) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () => _showElectivesSheet(context, subject, color, year.toString(), sem, dept),
                      borderRadius: BorderRadius.circular(16),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(16),
                        border: Border.all(color: color.withOpacity(0.15)),
                        child: Row(children: [
                          Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(9)),
                            child: Center(child: Icon(Icons.book_rounded, color: color, size: 16)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Text('Electives', style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 13, fontWeight: FontWeight.bold))),
                          Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.4), size: 18),
                        ]),
                      ),
                    ),
                  ).animate().fadeIn(delay: (i * 30).ms).slideX(begin: -0.03);
                }

                // Regular subject — tappable card
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: () => Navigator.push(context, AppTransitions.slideUp(
                      NotesBySubjectScreen(
                        subjectName: subject,
                        color: color,
                        year: year.toString(),
                        semester: sem,
                        dept: dept,
                      ),
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
                        Expanded(child: Text(subject, style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 13, height: 1.3))),
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

  void _showElectivesSheet(BuildContext context, String subject, Color color, String year, String sem, String dept) {
    final electives = subject.replaceFirst(RegExp(r'^Electives?:\s*'), '').split(', ');
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: GlassContainer(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('CHOOSE ELECTIVE', style: TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.close, color: Theme.of(context).colorScheme.onSurface, size: 20)),
                ],
              ),
              const SizedBox(height: 16),
              ...electives.asMap().entries.map((entry) {
                final electiveName = entry.value.trim();
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        AppTransitions.slideRight(
                          NotesBySubjectScreen(
                            subjectName: electiveName,
                            color: color,
                            year: year,
                            semester: sem,
                            dept: dept,
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(14),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(16),
                      border: Border.all(color: color.withOpacity(0.15)),
                      child: Row(
                        children: [
                          Icon(Icons.book_outlined, color: color, size: 18),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              electiveName,
                              style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, color: color.withOpacity(0.5), size: 16),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

