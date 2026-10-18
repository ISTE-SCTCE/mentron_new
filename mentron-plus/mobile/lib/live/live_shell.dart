import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../core/theme/world_theme.dart';
import '../core/widgets/campus_widgets.dart';
import 'live_collection.dart';
import 'live_repository.dart';
import 'live_profile.dart';

class LiveShell extends StatefulWidget {
  const LiveShell({
    super.key,
    required this.profile,
    required this.refreshProfile,
  });
  final Map<String, dynamic> profile;
  final Future<void> Function() refreshProfile;
  @override
  State<LiveShell> createState() => _LiveShellState();
}

class _LiveShellState extends State<LiveShell> {
  CampusWorld world = CampusWorld.learn;
  int index = 0;
  final Map<int, Widget> pages = {};
  late Future<void> enrollment;
  List<String> get labels => world == CampusWorld.learn
      ? ['Home', 'Notes', 'Projects', 'Market', 'Me']
      : ['Home', 'Events', 'QR', 'Certificates', 'Me'];
  List<IconData> get icons => world == CampusWorld.learn
      ? [
          Icons.home_outlined,
          Icons.menu_book_outlined,
          Icons.lightbulb_outline,
          Icons.shopping_bag_outlined,
          Icons.person_outline,
        ]
      : [
          Icons.home_outlined,
          Icons.calendar_today_outlined,
          Icons.qr_code_scanner,
          Icons.workspace_premium_outlined,
          Icons.person_outline,
        ];
  @override
  void initState() {
    super.initState();
    enrollment = enroll();
    restore();
  }

  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted && prefs.getString('mentron.world') == 'campus') {
      switchWorld(CampusWorld.campus);
    }
  }

  @override
  void didUpdateWidget(covariant LiveShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile != widget.profile) pages.clear();
  }

  Future<void> enroll() async {
    await LiveRepository().enroll(world == CampusWorld.learn);
  }

  void switchWorld(CampusWorld next) {
    if (next == world) return;
    setState(() {
      world = next;
      index = 0;
      pages.clear();
      enrollment = enroll();
    });
    SharedPreferences.getInstance().then(
      (p) => p.setString('mentron.world', next.name),
    );
  }

  void navigate(String title) {
    final tab = labels.indexOf(title);
    if (tab >= 0) {
      setState(() => index = tab);
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (context) => Theme(
          data: campusTheme(world),
          child: Scaffold(
            appBar: AppBar(title: Text(title)),
            body: LiveCollection(title: title, profile: widget.profile),
          ),
        ),
      ),
    );
  }

  Widget tab(int i) => pages.putIfAbsent(
    i,
    () => switch (labels[i]) {
      'Home' => home(),
      'Me' => profile(),
      'QR' => const LiveQr(),
      _ => LiveCollection(title: labels[i], profile: widget.profile),
    },
  );
  Widget home() => ListView(
    padding: const EdgeInsets.all(22),
    children: [
      const Eyebrow('MENTRON+ · YOUR STUDENT TRIBE'),
      const SizedBox(height: 15),
      Text(
        'Hey, ${widget.profile['name']?.split(' ').first}.',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 20),
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: world == CampusWorld.learn
              ? WorldTheme.learn.surface
              : WorldTheme.campus.surface,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              world == CampusWorld.learn
                  ? 'Study together.\nBuild what’s next.'
                  : 'Get involved.\nMake it count.',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 180,
              child: BookIllustration(campus: world == CampusWorld.campus),
            ),
            FilledButton(
              onPressed: () =>
                  navigate(world == CampusWorld.learn ? 'Notes' : 'Events'),
              child: Text(
                world == CampusWorld.learn
                    ? 'Explore notes'
                    : 'Discover events',
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 25),
      for (final label in [
        'Notes',
        'Projects',
        'Events',
        'Certificates',
        'Attendance',
        'Community',
        'Applications',
        'Orders',
        'Notifications',
      ])
        Card(
          child: ListTile(
            title: Text(label),
            trailing: const Icon(Icons.north_east, size: 18),
            onTap: () => navigate(label),
          ),
        ),
    ],
  );
  Widget profile() => LiveProfile(
    profile: widget.profile,
    refresh: widget.refreshProfile,
    navigate: navigate,
  );
  @override
  Widget build(BuildContext context) {
    tab(index);
    return Theme(
      data: campusTheme(world),
      child: Scaffold(
        appBar: AppBar(
          title: Text(world == CampusWorld.learn ? 'Mentron' : 'mlynq'),
          actions: [
            IconButton(
              tooltip: 'Notifications',
              onPressed: () => navigate('Notifications'),
              icon: const Icon(Icons.notifications_outlined),
            ),
          ],
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
              child: SegmentedButton<CampusWorld>(
                segments: const [
                  ButtonSegment(
                    value: CampusWorld.learn,
                    label: Text('Mentron'),
                  ),
                  ButtonSegment(
                    value: CampusWorld.campus,
                    label: Text('mlynq'),
                  ),
                ],
                selected: {world},
                onSelectionChanged: (value) => switchWorld(value.first),
              ),
            ),
            Expanded(
              child: FutureBuilder<void>(
                future: enrollment,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Unable to open this workspace.'),
                          TextButton(
                            onPressed: () =>
                                setState(() => enrollment = enroll()),
                            child: const Text('Try again'),
                          ),
                        ],
                      ),
                    );
                  }
                  return IndexedStack(
                    index: index,
                    children: [
                      for (var i = 0; i < 5; i++)
                        TickerMode(
                          enabled: i == index,
                          child: pages[i] ?? const SizedBox.shrink(),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (value) => setState(() => index = value),
          destinations: [
            for (var i = 0; i < 5; i++)
              NavigationDestination(icon: Icon(icons[i]), label: labels[i]),
          ],
        ),
      ),
    );
  }
}

class LiveQr extends StatefulWidget {
  const LiveQr({super.key});
  @override
  State<LiveQr> createState() => _LiveQrState();
}

class _LiveQrState extends State<LiveQr> with WidgetsBindingObserver {
  Map<String, dynamic>? token;
  String? error;
  Timer? timer;
  bool visible = false;
  bool foreground = true;
  int generation = 0;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
    updateVisibility();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    updateVisibility();
  }

  void updateVisibility() {
    final next = foreground && TickerMode.valuesOf(context).enabled;
    if (next == visible) return;
    visible = next;
    timer?.cancel();
    generation++;
    token = null;
    if (visible) issue();
  }

  Future<void> issue() async {
    if (!visible) return;
    final request = ++generation;
    setState(() {
      token = null;
      error = null;
    });
    try {
      final value = await LiveRepository().issueQr();
      if (!mounted || !visible || request != generation) return;
      setState(() {
        token = value;
        error = null;
      });
      timer?.cancel();
      final expiry = DateTime.parse(value['expires_at'] as String);
      final remaining =
          expiry.difference(DateTime.now()) - const Duration(seconds: 1);
      timer = Timer(remaining.isNegative ? Duration.zero : remaining, issue);
    } catch (_) {
      if (mounted && visible && request == generation) {
        setState(
          () => error =
              'Check-in is unavailable. Ask your event coordinator for assistance.',
        );
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    generation++;
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(25),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Your event check-in',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 25),
          if (token != null)
            QrImageView(data: jsonEncode(token), size: 240)
          else if (error == null)
            const CircularProgressIndicator(),
          if (error != null) ...[
            Text(error!, textAlign: TextAlign.center),
            TextButton(onPressed: issue, child: const Text('Try again')),
          ],
          const SizedBox(height: 20),
          const Text(
            'Your personal code refreshes automatically.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
