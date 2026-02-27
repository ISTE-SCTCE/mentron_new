import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class SocietiesScreen extends StatelessWidget {
  const SocietiesScreen({super.key});

  static const _societies = [
    {'name': 'SWaS', 'full': 'Software as a Service', 'desc': 'The premier coding and software development community. Focusing on modern stacks, open source, and building products.', 'icon': '💻', 'color': 0xFF00C6FF},
    {'name': 'MECH', 'full': 'Mechanical Society', 'desc': 'Exploring the world of robotics, automotive engineering, and thermal sciences. Hands-on projects and design workshops.', 'icon': '⚙️', 'color': 0xFF7000DF},
    {'name': 'BIOTECH', 'full': 'Life Sciences Forum', 'desc': 'Bridging biology and technology. Investigating bioinformatics, genetics, and pharmaceutical innovations.', 'icon': '🧬', 'color': 0xFF00C853},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: Column(children: [
          const Text('COMMUNITIES', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Sub-Societies', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
          itemCount: _societies.length,
          itemBuilder: (context, index) {
            final soc = _societies[index];
            final color = Color(soc['color'] as int);
            return Container(
              margin: const EdgeInsets.only(bottom: 20),
              child: GlassContainer(
                padding: const EdgeInsets.all(28),
                border: Border.all(color: color.withOpacity(0.2)),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(soc['icon'] as String, style: const TextStyle(fontSize: 40)),
                  const SizedBox(width: 20),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(soc['name'] as String, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
                    Text(soc['full'] as String, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 12),
                    Text(soc['desc'] as String, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.6)),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.2))),
                      child: Text('View Community →', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ),
                  ])),
                ]),
              ),
            ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.05);
          },
        ),
      ),
    );
  }
}
