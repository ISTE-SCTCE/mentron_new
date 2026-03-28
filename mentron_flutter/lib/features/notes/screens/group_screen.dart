import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import 'semester_screen.dart';

class GroupScreen extends StatelessWidget {
  const GroupScreen({super.key});

  static const _years = [
    _YearMeta(year: 1, label: '1st Year', sems: 'S1 & S2', emoji: '🌱', color: Color(0xFF22C55E)),
    _YearMeta(year: 2, label: '2nd Year', sems: 'S3 & S4', emoji: '📘', color: Color(0xFF3B82F6)),
    _YearMeta(year: 3, label: '3rd Year', sems: 'S5 & S6', emoji: '🔬', color: Color(0xFFA855F7)),
    _YearMeta(year: 4, label: '4th Year', sems: 'S7 & S8', emoji: '🎓', color: Color(0xFFF97316)),
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
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
          children: [
            const Text(
              'SELECT YOUR YEAR',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 3),
            ),
            const SizedBox(height: 16),
            ...List.generate(_years.length, (i) {
              final y = _years[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _YearCard(meta: y, index: i),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _YearCard extends StatelessWidget {
  final _YearMeta meta;
  final int index;
  const _YearCard({required this.meta, required this.index});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.push(context, AppTransitions.slideUp(SemesterScreen(year: meta.year))),
      borderRadius: BorderRadius.circular(24),
      child: GlassContainer(
        padding: const EdgeInsets.all(24),
        border: Border.all(color: meta.color.withOpacity(0.3)),
        child: Row(
          children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                color: meta.color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(meta.emoji, style: const TextStyle(fontSize: 26)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(meta.label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                  const SizedBox(height: 4),
                  Text('Browse ${meta.sems} notes', style: TextStyle(color: meta.color, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: meta.color.withOpacity(0.6)),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideX(begin: -0.05);
  }
}

class _YearMeta {
  final int year;
  final String label;
  final String sems;
  final String emoji;
  final Color color;
  const _YearMeta({required this.year, required this.label, required this.sems, required this.emoji, required this.color});
}
