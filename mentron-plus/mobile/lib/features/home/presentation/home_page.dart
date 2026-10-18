import 'package:flutter/material.dart';
import 'home_cards.dart';
import '../../../core/motion/motion.dart';
import '../../../core/theme/world_theme.dart';
import '../../../core/widgets/campus_widgets.dart';

class HomePage extends StatelessWidget {
  const HomePage({
    super.key,
    required this.world,
    required this.onNavigate,
    required this.onDetail,
  });
  final CampusWorld world;
  final void Function(String) onNavigate;
  final void Function(String) onDetail;
  @override
  Widget build(BuildContext context) {
    final campus = world == CampusWorld.campus;
    final w = WorldTheme.of(context);
    final actions = campus
        ? [
            (
              Icons.calendar_today_outlined,
              'Events',
              'Find your next thing',
              'Events',
              w.surface,
            ),
            (
              Icons.qr_code_rounded,
              'My QR',
              'Show up. Check in.',
              'QR',
              CampusTokens.peachSurface,
            ),
            (
              Icons.workspace_premium_outlined,
              'Certificates',
              'Little wins, kept safe',
              'Certificates',
              CampusTokens.mintSurface,
            ),
            (
              Icons.history_rounded,
              'Attendance',
              'See your story',
              'Attendance',
              CampusTokens.butterSurface,
            ),
          ]
        : [
            (
              Icons.menu_book_outlined,
              'Notes',
              'A little clarity',
              'Notes',
              w.surface,
            ),
            (
              Icons.lightbulb_outline,
              'Projects',
              'Make it happen',
              'Projects',
              CampusTokens.peachSurface,
            ),
            (
              Icons.forum_outlined,
              'The forum',
              'Ask. Share. Grow.',
              'Forum',
              CampusTokens.mintSurface,
            ),
            (
              Icons.emoji_events_outlined,
              'Leaderboard',
              'Meet the doers',
              'Leaderboard',
              CampusTokens.butterSurface,
            ),
          ];
    return RefreshIndicator(
      color: w.accent,
      onRefresh: () async {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You’re up to date with this design preview.'),
          ),
        );
      },
      child: CustomScrollView(
        key: PageStorageKey('home-${world.name}'),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Eyebrow(
                    campus
                        ? 'YOUR PEOPLE. YOUR POSSIBILITIES.'
                        : 'A GOOD DAY TO GET CURIOUS.',
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Hey, Alex.',
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Icon(
                        Icons.wb_sunny_outlined,
                        color: w.secondary,
                        size: 28,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    campus
                        ? 'You belong to something good.'
                        : 'A little learning. A little doing. All your possibilities.',
                    style: TextStyle(color: w.muted, fontSize: 12, height: 1.6),
                  ),
                  const SizedBox(height: 24),
                  HomeHeroCard(
                    campus: campus,
                    onTap: () => onNavigate(campus ? 'Events' : 'Notes'),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: w.surface),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.circle,
                          size: 6,
                          color: Color(0xFF71AD8C),
                        ),
                        const SizedBox(width: 7),
                        const Text(
                          'Today',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextButton(
                            onPressed: () => onDetail('Build Week ’26'),
                            child: const Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Build Week is open',
                                    style: TextStyle(fontSize: 11),
                                  ),
                                ),
                                Icon(Icons.north_east, size: 14),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SectionHeading(
                    campus ? 'Make campus yours.' : 'A good place to start.',
                    onMore: () => onNavigate('Explore'),
                  ),
                  LayoutBuilder(
                    builder: (context, constraints) => Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        for (var i = 0; i < actions.length; i++)
                          SizedBox(
                            width: (constraints.maxWidth - 12) / 2,
                            child: StaggerEntrance(
                              index: i,
                              child: ActionTile(
                                icon: actions[i].$1,
                                title: actions[i].$2,
                                subtitle: actions[i].$3,
                                color: actions[i].$5,
                                onTap: () => onNavigate(actions[i].$4),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  SectionHeading(
                    campus ? 'Save a little space.' : 'Notes worth opening.',
                    onMore: () => onNavigate(campus ? 'Events' : 'Notes'),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 22),
            sliver: SliverList.builder(
              itemCount: campus ? 2 : 3,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: StaggerEntrance(
                  index: index,
                  child: campus
                      ? HomeEventTile(
                          index: index,
                          onTap: () => onDetail(
                            index == 0 ? 'Build Week ’26' : 'The Design Jam',
                          ),
                        )
                      : NoteTile(
                          index: index,
                          title: [
                            'Signals & Systems',
                            'Data Structures',
                            'Network Theory',
                          ][index],
                          caption: [
                            'Signals, made simple.',
                            'Think in algorithms.',
                            'Connect the dots.',
                          ][index],
                          color: [
                            w.surface,
                            CampusTokens.peachSurface,
                            CampusTokens.mintSurface,
                          ][index],
                          onTap: () => onDetail(
                            [
                              'Signals & Systems',
                              'Data Structures',
                              'Network Theory',
                            ][index],
                          ),
                        ),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(30, 20, 30, 35),
              child: Text(
                'A little learning. A little living. All campus.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 10, color: Color(0xFF8B80A0)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
