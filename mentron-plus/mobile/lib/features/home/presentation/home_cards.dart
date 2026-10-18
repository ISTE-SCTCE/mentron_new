import 'package:flutter/material.dart';
import '../../../core/motion/motion.dart';
import '../../../core/theme/world_theme.dart';
import '../../../core/widgets/campus_widgets.dart';

class HomeHeroCard extends StatelessWidget {
  const HomeHeroCard({super.key, required this.campus, required this.onTap});
  final bool campus;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final w = WorldTheme.of(context);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: w.surface,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -45,
            top: 80,
            width: 230,
            height: 220,
            child: BookIllustration(campus: campus),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(
                  campus ? 'MAKE ROOM FOR CONNECTION' : 'YOUR NEXT CHAPTER',
                ),
                const SizedBox(height: 20),
                Text(
                  campus
                      ? 'Less scrolling.\nMore showing up.'
                      : 'Big ideas.\nSmall beginnings.',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: 170,
                  child: Text(
                    campus
                        ? 'Find your people and make campus yours.'
                        : 'The notes, people, and projects that turn “what if” into something good.',
                    style: TextStyle(color: w.muted, fontSize: 11, height: 1.7),
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: onTap,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        campus ? 'Explore events' : 'Find your flow',
                        style: const TextStyle(fontSize: 12),
                      ),
                      const SizedBox(width: 12),
                      const Icon(Icons.north_east, size: 17),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    for (var i = 0; i < 3; i++)
                      Align(
                        widthFactor: .8,
                        child: CircleAvatar(
                          radius: 11,
                          backgroundColor: [
                            const Color(0xFFB39679),
                            const Color(0xFF7B9295),
                            const Color(0xFFA49BB9),
                          ][i],
                          child: Text(
                            ['N', 'A', 'D'][i],
                            style: const TextStyle(
                              fontSize: 7,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'A little better, together.',
                        style: TextStyle(fontSize: 9, color: w.muted),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class HomeEventTile extends StatelessWidget {
  const HomeEventTile({super.key, required this.index, required this.onTap});
  final int index;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => PressableScale(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: index == 0
                  ? WorldTheme.of(context).surface
                  : CampusTokens.peachSurface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Text('OCT', style: TextStyle(fontSize: 9)),
                Text(
                  index == 0 ? '24' : '28',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(index == 0 ? 'HACKATHON' : 'WORKSHOP'),
                const SizedBox(height: 6),
                Text(
                  index == 0 ? 'Build Week ’26' : 'The Design Jam',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  index == 0 ? 'Innovation Lab · 9 AM' : 'Studio 204 · 2 PM',
                  style: TextStyle(
                    fontSize: 10,
                    color: WorldTheme.of(context).muted,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.north_east, size: 17),
        ],
      ),
    ),
  );
}
