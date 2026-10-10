import 'package:flutter/material.dart';

/// Shared visual language; all content and actions come from the owning screen.
class CampusHeader extends StatelessWidget {
  const CampusHeader({
    super.key,
    required this.name,
    required this.product,
    required this.subtitle,
    required this.onProfile,
    this.onCommunity,
    this.onNotifications,
    this.unread = 0,
  });
  final String name, product, subtitle;
  final VoidCallback onProfile;
  final VoidCallback? onCommunity, onNotifications;
  final int unread;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(24, 20, 20, 18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              product == 'Mentron'
                  ? Icons.layers_outlined
                  : Icons.explore_outlined,
              size: 23,
              color: const Color(0xff66508c),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                product,
                style: const TextStyle(
                  fontSize: 21,
                  letterSpacing: -.8,
                  fontWeight: FontWeight.w700,
                  color: Color(0xff29283e),
                ),
              ),
            ),
            if (onCommunity != null)
              IconButton(
                tooltip: 'Community discussions',
                onPressed: onCommunity,
                icon: const Icon(Icons.forum_outlined, size: 21),
              ),
            if (onNotifications != null)
              IconButton(
                tooltip: 'Notifications, $unread unread',
                onPressed: onNotifications,
                icon: Badge(
                  isLabelVisible: unread > 0,
                  label: Text(unread > 99 ? '99+' : '$unread'),
                  child: const Icon(Icons.notifications_none_rounded, size: 23),
                ),
              ),
            IconButton(
              tooltip: 'Your profile',
              onPressed: onProfile,
              icon: CircleAvatar(
                radius: 19,
                backgroundColor: const Color(0xffe9e0f7),
                child: Text(
                  name.isEmpty ? 'M' : name.characters.first.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xff4b3966),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 23),
        Text(
          'Hello, $name.',
          style: const TextStyle(
            fontSize: 30,
            height: 1.16,
            letterSpacing: -1.2,
            fontWeight: FontWeight.w600,
            color: Color(0xff29283e),
          ),
        ),
        const SizedBox(height: 7),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 12,
            height: 1.5,
            color: Color(0xff67647c),
          ),
        ),
      ],
    ),
  );
}

class CampusSpotlight extends StatelessWidget {
  const CampusSpotlight({
    super.key,
    required this.learning,
    required this.onOpen,
    this.status,
    this.notesCount,
    this.xp,
  });
  final bool learning;
  final VoidCallback onOpen;
  final String? status;
  final int? notesCount, xp;
  @override
  Widget build(BuildContext context) {
    final ink = learning ? const Color(0xffeee7ff) : const Color(0xffedf6e2);
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 6, 24, 22),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: learning ? const Color(0xff342748) : const Color(0xff184d46),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(22),
          topRight: Radius.circular(62),
          bottomLeft: Radius.circular(22),
          bottomRight: Radius.circular(22),
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -26,
            top: -25,
            child: ExcludeSemantics(
              child: SizedBox(
                width: 145,
                height: 145,
                child: CustomPaint(painter: _OrbitPainter(ink)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(25),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  learning ? 'YOUR NEXT CHAPTER' : 'ISTE SCTCE · CAMPUS PASS',
                  style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 1.7,
                    fontWeight: FontWeight.w600,
                    color: ink,
                  ),
                ),
                const SizedBox(height: 25),
                Icon(
                  learning
                      ? Icons.auto_stories_outlined
                      : Icons.explore_outlined,
                  size: 34,
                  color: ink,
                ),
                const SizedBox(height: 17),
                Text(
                  learning
                      ? 'Stay curious.\nKeep going.'
                      : 'Your campus.\nA little closer.',
                  style: TextStyle(
                    fontSize: 32,
                    height: 1.07,
                    letterSpacing: -1.2,
                    fontWeight: FontWeight.w500,
                    color: ink,
                  ),
                ),
                const SizedBox(height: 13),
                Text(
                  learning
                      ? 'Find a fresh perspective. Make something worth sharing.'
                      : 'Your people, your moments and every milestone along the way.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.65,
                    color: ink.withValues(alpha: .85),
                  ),
                ),
                const SizedBox(height: 23),
                FilledButton(
                  onPressed: onOpen,
                  style: FilledButton.styleFrom(
                    backgroundColor: learning
                        ? const Color(0xffc9b3f0)
                        : const Color(0xffe0edc9),
                    foregroundColor: learning
                        ? const Color(0xff342748)
                        : const Color(0xff184d46),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 15,
                    ),
                    minimumSize: const Size(48, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          learning
                              ? 'Open study library'
                              : 'Open attendance QR',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 18),
                      Icon(
                        learning ? Icons.north_east : Icons.qr_code_2,
                        size: 19,
                      ),
                    ],
                  ),
                ),
                if (status != null || notesCount != null || xp != null) ...[
                  const SizedBox(height: 22),
                  Divider(color: ink.withValues(alpha: .2), height: 1),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 20,
                    runSpacing: 10,
                    children: [
                      if (status != null)
                        Text(
                          status!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: ink,
                          ),
                        ),
                      if (notesCount != null)
                        Text(
                          '$notesCount study resources',
                          style: TextStyle(fontSize: 11, color: ink),
                        ),
                      if (xp != null)
                        Text(
                          '$xp XP earned',
                          style: TextStyle(fontSize: 11, color: ink),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrbitPainter extends CustomPainter {
  const _OrbitPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.translate(size.width / 2, size.height / 2);
    final pen = Paint()
      ..color = color.withValues(alpha: .22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var i = 0; i < 3; i++) {
      canvas.drawOval(
        Rect.fromCenter(center: Offset.zero, width: 136, height: 56),
        pen,
      );
      canvas.rotate(1.0472);
    }
    canvas.drawCircle(
      const Offset(42, 18),
      6,
      Paint()..color = color.withValues(alpha: .7),
    );
  }

  @override
  bool shouldRepaint(_OrbitPainter oldDelegate) => oldDelegate.color != color;
}

class CampusActionCard extends StatelessWidget {
  const CampusActionCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tint,
    required this.onTap,
  });
  final String title, subtitle;
  final IconData icon;
  final Color tint;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: tint,
    borderRadius: BorderRadius.circular(17),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(19),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 25, color: const Color(0xff3e3854)),
                const Spacer(),
                const Icon(
                  Icons.north_east,
                  size: 16,
                  color: Color(0xff676078),
                ),
              ],
            ),
            const SizedBox(height: 27),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                height: 1.25,
                letterSpacing: -.4,
                fontWeight: FontWeight.w600,
                color: Color(0xff302b42),
              ),
            ),
            const SizedBox(height: 7),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                height: 1.5,
                color: Color(0xff655c72),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class CampusActionGrid extends StatelessWidget {
  const CampusActionGrid({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 24),
    child: LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth > 700
            ? 4
            : (constraints.maxWidth < 280 ||
                      MediaQuery.textScalerOf(context).scale(16) > 24
                  ? 1
                  : 2);
        final width = (constraints.maxWidth - 12 * (columns - 1)) / columns;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final child in children) SizedBox(width: width, child: child),
          ],
        );
      },
    ),
  );
}

class CampusSectionHeading extends StatelessWidget {
  const CampusSectionHeading(this.title, {super.key, this.onSeeAll});
  final String title;
  final VoidCallback? onSeeAll;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(24, 24, 16, 15),
    child: Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 21,
              letterSpacing: -.65,
              height: 1.2,
              fontWeight: FontWeight.w600,
              color: Color(0xff302b42),
            ),
          ),
        ),
        if (onSeeAll != null)
          TextButton(
            onPressed: onSeeAll,
            child: const Text(
              'See all',
              style: TextStyle(color: Color(0xff625083), fontSize: 12),
            ),
          ),
      ],
    ),
  );
}

class CampusNavItem {
  const CampusNavItem(this.label, this.icon, {this.badge = 0});
  final String label;
  final IconData icon;
  final int badge;
}

class CampusBottomNav extends StatelessWidget {
  const CampusBottomNav({
    super.key,
    required this.items,
    required this.selected,
    required this.onSelected,
    this.learning = false,
  });
  final List<CampusNavItem> items;
  final int selected;
  final ValueChanged<int> onSelected;
  final bool learning;
  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xfffcfbff),
    elevation: 5,
    shadowColor: Colors.black12,
    borderRadius: BorderRadius.circular(22),
    child: Padding(
      padding: const EdgeInsets.all(6),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++)
            Expanded(
              child: Semantics(
                selected: i == selected,
                child: Tooltip(
                  message: items[i].label,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => onSelected(i),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 58),
                      padding: const EdgeInsets.symmetric(
                        vertical: 9,
                        horizontal: 2,
                      ),
                      decoration: BoxDecoration(
                        color: i == selected
                            ? (learning
                                  ? const Color(0xffe8def7)
                                  : const Color(0xffdfece3))
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Badge(
                            isLabelVisible: items[i].badge > 0,
                            label: Text(
                              items[i].badge > 99 ? '99+' : '${items[i].badge}',
                            ),
                            child: Icon(
                              items[i].icon,
                              size: 23,
                              color: i == selected
                                  ? const Color(0xff3c3452)
                                  : const Color(0xff737181),
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            items[i].label,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Color(0xff514b61),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}
