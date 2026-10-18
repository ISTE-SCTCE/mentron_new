import 'package:flutter/material.dart';
import '../../../core/theme/world_theme.dart';
import '../../../core/widgets/campus_widgets.dart';
import '../../../core/widgets/states.dart';

class CollectionPage extends StatefulWidget {
  const CollectionPage({
    super.key,
    required this.title,
    required this.onDetail,
  });
  final String title;
  final void Function(String) onDetail;
  @override
  State<CollectionPage> createState() => _CollectionPageState();
}

class _CollectionPageState extends State<CollectionPage> {
  String filter = 'All';
  String search = '';
  @override
  Widget build(BuildContext context) {
    final w = WorldTheme.of(context);
    final isNotes = widget.title == 'Notes';
    final items = switch (widget.title) {
      'Notes' => [
        'Signals & Systems',
        'Data Structures',
        'Network Theory',
        'Engineering Mathematics',
      ],
      'Projects' => [
        'A smarter campus garden',
        'Find your way, together',
        'Small panels. Big potential.',
      ],
      'Market' => [
        'Casio fx-991EX · ₹850',
        'The semester starter pack · ₹450',
        'Arduino maker kit · ₹650',
      ],
      'Events' => ['Build Week ’26', 'The Design Jam', 'Campus Conversations'],
      'Certificates' => [
        'Web Development Bootcamp',
        'Innovation Challenge',
        'An Introduction to IoT',
      ],
      'Attendance' => [
        '12 Sep · Web Development Bootcamp',
        '28 Aug · Innovation Challenge',
        '16 Aug · An Introduction to IoT',
      ],
      'Forum' => [
        'How do you remember Fourier pairs?',
        'Anyone building with Flutter?',
        'Your favourite way to study?',
      ],
      'Leaderboard' => [
        '01 · Niya K. — 1,280 XP',
        '02 · Arjun M. — 1,100 XP',
        '03 · Dev S. — 920 XP',
      ],
      _ => ['Your saved learning will appear here.'],
    };
    final visible = filter == 'Saved'
        ? <String>[]
        : items
              .where((s) => s.toLowerCase().contains(search.toLowerCase()))
              .toList();
    return CustomScrollView(
      key: PageStorageKey(widget.title),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 24, 22, 0),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('A LITTLE MORE POSSIBILITY'),
                const SizedBox(height: 10),
                Text(
                  widget.title,
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 10),
                Text(
                  isNotes
                      ? 'Find your next “oh, I get it.”'
                      : 'Good things happen when you get curious.',
                  style: TextStyle(fontSize: 13, color: w.muted),
                ),
                const SizedBox(height: 24),
                TextField(
                  onChanged: (value) => setState(() => search = value),
                  decoration: InputDecoration(
                    labelText: 'Search ${widget.title.toLowerCase()}',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final label in ['All', 'Saved'])
                      ChoiceChip(
                        label: Text(label),
                        selected: filter == label,
                        onSelected: (_) => setState(() => filter = label),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
        if (visible.isEmpty)
          SliverToBoxAdapter(
            child: EmptyState(
              title: 'A little room for something new.',
              message: 'Try another search or explore the collection.',
              action: 'Show all',
              onAction: () => setState(() {
                filter = 'All';
                search = '';
              }),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 22),
            sliver: SliverList.builder(
              itemCount: visible.length,
              itemBuilder: (context, i) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: isNotes
                    ? NoteTile(
                        title: visible[i],
                        caption: [
                          'Signals, made simple.',
                          'Think in algorithms.',
                          'Connect the dots.',
                          'Make sense of the maths.',
                        ][i % 4],
                        color: [
                          w.surface,
                          CampusTokens.peachSurface,
                          CampusTokens.mintSurface,
                        ][i % 3],
                        onTap: () => widget.onDetail(visible[i]),
                      )
                    : Card(
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(18),
                          leading: CircleAvatar(
                            backgroundColor: w.surface,
                            child: Icon(
                              widget.title == 'Certificates'
                                  ? Icons.workspace_premium_outlined
                                  : Icons.auto_awesome_outlined,
                              color: w.accentInk,
                            ),
                          ),
                          title: Text(
                            visible[i],
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          subtitle: const Padding(
                            padding: EdgeInsets.only(top: 8),
                            child: Text(
                              'Sample content · Take a closer look',
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                          trailing: const Icon(Icons.north_east, size: 17),
                          onTap: () => widget.onDetail(visible[i]),
                        ),
                      ),
              ),
            ),
          ),
        const SliverToBoxAdapter(child: SizedBox(height: 32)),
      ],
    );
  }
}

class QrPreviewPage extends StatelessWidget {
  const QrPreviewPage({super.key});
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      const Eyebrow('BE HERE. MAKE IT COUNT.'),
      const SizedBox(height: 10),
      Text(
        'Your campus\ncheck-in.',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 25),
      Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: WorldTheme.of(context).surface,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          children: [
            const Eyebrow('DESIGN PREVIEW'),
            const SizedBox(height: 25),
            Container(
              padding: const EdgeInsets.all(35),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                Icons.qr_code_scanner,
                size: 110,
                color: WorldTheme.of(context).accent,
              ),
            ),
            const SizedBox(height: 25),
            Text('Alex Morgan', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text(
              'Electronics · Semester 4',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 25),
            const Text(
              'A secure token appears after sign-in.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
      const SizedBox(height: 24),
      Text(
        'Show up. Get scanned. You’re part of it.',
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: 12),
      Text(
        'This preview doesn’t generate valid attendance tokens. Secure QR issuance connects after the data phase.',
        style: TextStyle(
          fontSize: 12,
          height: 1.7,
          color: WorldTheme.of(context).muted,
        ),
      ),
    ],
  );
}
