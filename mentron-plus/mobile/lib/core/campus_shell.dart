import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../features/home/presentation/home_page.dart';
import '../features/explore/presentation/collection_page.dart';
import '../features/profile/presentation/profile_page.dart';
import 'motion/motion.dart';
import 'theme/world_theme.dart';
import 'widgets/preview_detail.dart';

class CampusShell extends StatefulWidget {
  const CampusShell({super.key, required this.preferences});
  final SharedPreferences preferences;
  @override
  State<CampusShell> createState() => _CampusShellState();
}

class _CampusShellState extends State<CampusShell>
    with SingleTickerProviderStateMixin {
  late CampusWorld _world;
  CampusWorld? _previousWorld;
  Widget? _previousFrame;
  int _index = 0;
  bool _performance = false;
  final Map<int, Widget> _tabs = {};
  late final AnimationController _switch =
      AnimationController(vsync: this, duration: Motion.world, value: 1)
        ..addStatusListener((status) {
          if (status == AnimationStatus.completed &&
              mounted &&
              _previousFrame != null) {
            setState(() {
              _previousFrame = null;
              _previousWorld = null;
            });
          }
        });
  @override
  void initState() {
    super.initState();
    _world = widget.preferences.getString('campus.world') == 'campus'
        ? CampusWorld.campus
        : CampusWorld.learn;
  }

  @override
  void dispose() {
    _switch.dispose();
    super.dispose();
  }

  List<(String, IconData)> _navigation(CampusWorld world) =>
      world == CampusWorld.learn
      ? [
          ('Home', Icons.home_outlined),
          ('Notes', Icons.menu_book_outlined),
          ('Projects', Icons.lightbulb_outline),
          ('Market', Icons.shopping_bag_outlined),
          ('Me', Icons.person_outline),
        ]
      : [
          ('Home', Icons.home_outlined),
          ('Events', Icons.calendar_today_outlined),
          ('QR', Icons.qr_code_scanner),
          ('Certificates', Icons.workspace_premium_outlined),
          ('Me', Icons.person_outline),
        ];
  void _switchWorld(CampusWorld next) {
    if (next == _world || _switch.isAnimating) return;
    HapticFeedback.selectionClick();
    final reduced = Motion.reduce(context);
    setState(() {
      _previousWorld = _world;
      _previousFrame = reduced ? null : _frame(_world);
      _world = next;
      _index = 0;
      _tabs.clear();
    });
    widget.preferences.setString('campus.world', next.name);
    if (reduced) {
      _switch.value = 1;
    } else {
      _switch.forward(from: 0);
    }
  }

  void _navigate(String label) {
    final index = _navigation(_world).indexWhere((e) => e.$1 == label);
    if (index >= 0) {
      setState(() => _index = index);
      return;
    }
    if (label == 'Explore') {
      _explore();
      return;
    }
    Navigator.of(context).push(
      CampusRoute<void>(
        reduced: Motion.reduce(context),
        settings: RouteSettings(name: '/${label.toLowerCase()}'),
        builder: (_) => Theme(
          data: campusTheme(_world),
          child: Scaffold(
            appBar: AppBar(title: Text(label)),
            body: CollectionPage(title: label, onDetail: _detail),
          ),
        ),
      ),
    );
  }

  void _detail(String title) => Navigator.of(context).push(
    CampusRoute<void>(
      reduced: Motion.reduce(context),
      settings: RouteSettings(
        name: '/detail',
        arguments: DetailArguments(title),
      ),
      builder: (_) => Theme(
        data: campusTheme(_world),
        child: PreviewDetail(title: title),
      ),
    ),
  );
  void _explore() => showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => Padding(
      padding: const EdgeInsets.fromLTRB(22, 0, 22, 25),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'A little more to explore.',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            for (final label in [
              'Notes',
              'Projects',
              'Market',
              'Events',
              'Certificates',
              'Attendance',
              'Forum',
              'Leaderboard',
              'Downloads',
            ])
              ListTile(
                title: Text(label),
                trailing: const Icon(Icons.north_east, size: 18),
                onTap: () {
                  Navigator.pop(context);
                  _navigate(label);
                },
              ),
          ],
        ),
      ),
    ),
  );
  Widget _tab(int i) => _tabs.putIfAbsent(i, () {
    final title = _navigation(_world)[i].$1;
    return switch (title) {
      'Home' => HomePage(
        world: _world,
        onNavigate: _navigate,
        onDetail: _detail,
      ),
      'QR' => const QrPreviewPage(),
      'Me' => ProfilePage(
        onNavigate: _navigate,
        onPerformance: (enabled) => setState(() => _performance = enabled),
      ),
      _ => CollectionPage(title: title, onDetail: _detail),
    };
  });
  Widget _frame(CampusWorld world) {
    final nav = _navigation(world);
    _tab(_index);
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 68,
        titleSpacing: 22,
        title: Row(
          children: [
            Hero(
              tag: 'campus-logo',
              child: Icon(
                Icons.blur_circular_rounded,
                size: 30,
                color: world == CampusWorld.learn
                    ? WorldTheme.learn.accent
                    : WorldTheme.campus.accent,
              ),
            ),
            const SizedBox(width: 7),
            const Text(
              'campus.',
              style: TextStyle(
                fontFamily: 'SpaceGrotesk',
                fontSize: 24,
                fontWeight: FontWeight.w600,
                letterSpacing: -1,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => _detail('A few things for you.'),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 3,
                ),
                child: _WorldToggle(world: world, onChanged: _switchWorld),
              ),
              Expanded(
                child: IndexedStack(
                  index: _index,
                  children: [
                    for (var i = 0; i < 5; i++)
                      TickerMode(
                        enabled: i == _index,
                        child: _tabs[i] ?? const SizedBox.shrink(),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        animationDuration: Motion.duration(context, Motion.base),
        height: 72,
        onDestinationSelected: (value) {
          HapticFeedback.selectionClick();
          setState(() => _index = value);
        },
        destinations: [
          for (var i = 0; i < nav.length; i++)
            NavigationDestination(
              label: nav[i].$1 == 'QR' ? 'My QR' : nav[i].$1,
              icon: nav[i].$1 == 'QR'
                  ? Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: WorldTheme.campus.accent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.qr_code_scanner,
                        color: Colors.white,
                        size: 23,
                      ),
                    )
                  : Icon(nav[i].$2),
              selectedIcon: Icon(nav[i].$2),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final newFrame = _frame(_world);
    final target = _world == CampusWorld.learn
        ? WorldTheme.learn
        : WorldTheme.campus;
    final source = _previousWorld == CampusWorld.campus
        ? WorldTheme.campus
        : WorldTheme.learn;
    return Stack(
      children: [
        if (_previousFrame != null)
          ExcludeSemantics(
            child: IgnorePointer(
              child: TickerMode(
                enabled: false,
                child: Theme(
                  data: campusTheme(_previousWorld!),
                  child: HeroMode(enabled: false, child: _previousFrame!),
                ),
              ),
            ),
          ),
        AnimatedBuilder(
          animation: _switch,
          child: newFrame,
          builder: (context, child) => ClipPath(
            clipper: _WorldReveal(_switch.value),
            child: Theme(
              data: campusTheme(
                _world,
                colors: source.lerp(
                  target,
                  Curves.easeInOut.transform(_switch.value),
                ),
              ),
              child: child!,
            ),
          ),
        ),
        if (_performance)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: IgnorePointer(child: PerformanceOverlay.allEnabled()),
          ),
      ],
    );
  }
}

class _WorldReveal extends CustomClipper<Path> {
  _WorldReveal(this.progress);
  final double progress;
  @override
  Path getClip(Size size) {
    if (progress >= 1) return Path()..addRect(Offset.zero & size);
    return Path()..addOval(
      Rect.fromCircle(
        center: Offset(size.width * .65, 95),
        radius:
            math.sqrt(size.width * size.width + size.height * size.height) *
            Curves.easeOutCubic.transform(progress),
      ),
    );
  }

  @override
  bool shouldReclip(covariant _WorldReveal old) => old.progress != progress;
}

class _WorldToggle extends StatelessWidget {
  const _WorldToggle({required this.world, required this.onChanged});
  final CampusWorld world;
  final ValueChanged<CampusWorld> onChanged;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(4),
    decoration: BoxDecoration(
      color: WorldTheme.of(context).surface,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      children: [
        for (final item in CampusWorld.values)
          Expanded(
            child: Semantics(
              selected: world == item,
              child: TextButton(
                onPressed: () => onChanged(item),
                style: TextButton.styleFrom(
                  minimumSize: const Size(48, 44),
                  backgroundColor: world == item
                      ? Colors.white
                      : Colors.transparent,
                  foregroundColor: world == item
                      ? WorldTheme.of(context).accentInk
                      : WorldTheme.of(context).muted,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      item == CampusWorld.learn
                          ? Icons.menu_book_outlined
                          : Icons.explore_outlined,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      item == CampusWorld.learn ? 'Learn' : 'Campus',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    ),
  );
}
