import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'creative_motion.dart';

const _ink = Color(0xff30243f);
const _paperShape = BorderRadius.only(
  topLeft: Radius.circular(6),
  topRight: Radius.circular(30),
  bottomLeft: Radius.circular(30),
  bottomRight: Radius.circular(6),
);

/// Visual components receive real data and existing callbacks from screen owners.
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
  Widget build(BuildContext context) {
    final learning = product == 'Mentron';
    final accent = learning ? const Color(0xff69479a) : const Color(0xff216655);
    return CreativeEntrance(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(5),
                      topRight: Radius.circular(14),
                      bottomLeft: Radius.circular(14),
                      bottomRight: Radius.circular(5),
                    ),
                  ),
                  child: Icon(
                    learning
                        ? Icons.auto_awesome_mosaic_outlined
                        : Icons.local_activity_outlined,
                    size: 20,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    product,
                    style: TextStyle(
                      fontSize: 22,
                      letterSpacing: -1,
                      fontWeight: FontWeight.w700,
                      color: accent,
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
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        size: 23,
                      ),
                    ),
                  ),
                IconButton(
                  tooltip: 'Your profile',
                  onPressed: onProfile,
                  icon: CircleAvatar(
                    radius: 18,
                    backgroundColor: learning
                        ? const Color(0xffe9dcfa)
                        : const Color(0xffdce8c2),
                    child: Text(
                      name.isEmpty ? 'M' : name.characters.first.toUpperCase(),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: accent,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(width: 20, height: 1, color: accent),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    learning ? 'THE IDEA STUDIO' : 'YOUR CAMPUS JOURNAL',
                    style: TextStyle(
                      color: accent,
                      fontSize: 9,
                      letterSpacing: 2,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Hello, $name.',
              style: const TextStyle(
                fontSize: 36,
                height: 1.05,
                letterSpacing: -1.7,
                fontWeight: FontWeight.w500,
                color: _ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                height: 1.6,
                color: Color(0xff6b6178),
              ),
            ),
          ],
        ),
      ),
    );
  }
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
    final ink = learning ? const Color(0xff342247) : const Color(0xff214c3d);
    final background = learning
        ? const Color(0xffd8bff7)
        : const Color(0xffe4edbe);
    return CreativeEntrance(
      distance: 25,
      child: Container(
        margin: const EdgeInsets.fromLTRB(24, 8, 28, 24),
        decoration: BoxDecoration(
          color: background,
          borderRadius: _paperShape,
          border: Border.all(color: ink.withValues(alpha: .35)),
          boxShadow: [
            BoxShadow(
              color: learning
                  ? const Color(0xff99d6d0)
                  : const Color(0xffb1d3d5),
              offset: const Offset(6, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: _paperShape,
          child: Stack(
            children: [
              Positioned(
                right: -22,
                top: 32,
                child: ExcludeSemantics(
                  child: SizedBox(
                    width: 152,
                    height: 152,
                    child: CustomPaint(
                      painter: _StudioShapePainter(ink, learning),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            learning
                                ? 'FIELD NOTES / YOUR NEXT CHAPTER'
                                : 'ADMIT ONE / YOUR CAMPUS PASS',
                            style: TextStyle(
                              fontSize: 9,
                              letterSpacing: 1.3,
                              fontWeight: FontWeight.w600,
                              color: ink,
                            ),
                          ),
                        ),
                        Icon(
                          learning
                              ? Icons.north_east
                              : Icons.confirmation_number_outlined,
                          color: ink,
                          size: 23,
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 205),
                      child: Text(
                        learning
                            ? 'Make room\nfor ideas.'
                            : 'You belong\nin the story.',
                        style: TextStyle(
                          fontSize: 35,
                          height: 1.02,
                          letterSpacing: -1.6,
                          fontWeight: FontWeight.w600,
                          color: ink,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      learning
                          ? 'A fresh page. A new perspective.\nSee where your curiosity goes.'
                          : 'Your people, your moments.\nKeep this chapter close.',
                      style: TextStyle(fontSize: 12, height: 1.7, color: ink),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        onOpen();
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: ink,
                        foregroundColor: background,
                        minimumSize: const Size(48, 48),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 15,
                        ),
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(5),
                            topRight: Radius.circular(16),
                            bottomLeft: Radius.circular(16),
                            bottomRight: Radius.circular(5),
                          ),
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
                          const SizedBox(width: 14),
                          Icon(
                            learning ? Icons.north_east : Icons.qr_code_2,
                            size: 19,
                          ),
                        ],
                      ),
                    ),
                    if (status != null || notesCount != null || xp != null) ...[
                      const SizedBox(height: 22),
                      LayoutBuilder(
                        builder: (_, constraints) => Row(
                          children: List.generate(
                            (constraints.maxWidth / 10).floor(),
                            (_) => Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 2,
                                ),
                                child: Container(
                                  height: 1,
                                  color: ink.withValues(alpha: .35),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 15),
                      Wrap(
                        spacing: 18,
                        runSpacing: 8,
                        children: [
                          if (status != null)
                            Text(
                              status!,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
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
        ),
      ),
    );
  }
}

class _StudioShapePainter extends CustomPainter {
  const _StudioShapePainter(this.color, this.learning);
  final Color color;
  final bool learning;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.translate(size.width / 2, size.height / 2);
    final paint = Paint()..color = color.withValues(alpha: .12);
    for (var i = 0; i < (learning ? 6 : 8); i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset.zero,
            width: learning ? 17 : 30,
            height: 134,
          ),
          Radius.circular(learning ? 2 : 40),
        ),
        paint,
      );
      canvas.rotate(math.pi / (learning ? 6 : 8));
    }
    canvas.drawCircle(
      Offset.zero,
      14,
      Paint()..color = color.withValues(alpha: .2),
    );
  }

  @override
  bool shouldRepaint(_StudioShapePainter old) =>
      old.color != color || old.learning != learning;
}

class CampusActionCard extends StatefulWidget {
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
  State<CampusActionCard> createState() => _CampusActionCardState();
}

class _CampusActionCardState extends State<CampusActionCard> {
  bool pressed = false;
  @override
  Widget build(BuildContext context) => AnimatedScale(
    scale: pressed ? .97 : 1,
    duration: MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 130),
    child: Material(
      color: widget.tint,
      shape: RoundedRectangleBorder(
        borderRadius: _paperShape,
        side: const BorderSide(color: Color(0x2430243f)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onHighlightChanged: (value) => setState(() => pressed = value),
        onTap: () {
          HapticFeedback.selectionClick();
          widget.onTap();
        },
        child: Padding(
          padding: const EdgeInsets.all(19),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .55),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(widget.icon, size: 23, color: _ink),
                  ),
                  const Spacer(),
                  const Icon(Icons.north_east, size: 17, color: _ink),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                widget.title,
                style: const TextStyle(
                  fontSize: 18,
                  height: 1.15,
                  letterSpacing: -.7,
                  fontWeight: FontWeight.w600,
                  color: _ink,
                ),
              ),
              const SizedBox(height: 7),
              Text(
                widget.subtitle,
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
            for (var i = 0; i < children.length; i++)
              SizedBox(
                width: width,
                child: CreativeEntrance(
                  distance: 12 + i * 3,
                  child: children[i],
                ),
              ),
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
    padding: const EdgeInsets.fromLTRB(24, 26, 16, 16),
    child: Row(
      children: [
        Container(
          width: 4,
          height: 24,
          margin: const EdgeInsets.only(right: 10),
          decoration: BoxDecoration(
            color: const Color(0xff8864b5),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 22,
              letterSpacing: -.8,
              height: 1.15,
              fontWeight: FontWeight.w500,
              color: _ink,
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
  Widget build(BuildContext context) {
    final accent = learning ? const Color(0xffd8bff7) : const Color(0xffe4edbe);
    final ink = learning ? const Color(0xff342247) : const Color(0xff214c3d);
    return Material(
      color: const Color(0xfffffcf8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: ink.withValues(alpha: .2)),
      ),
      elevation: 3,
      shadowColor: Colors.black12,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: Semantics(
                  selected: i == selected,
                  button: true,
                  child: Tooltip(
                    message: items[i].label,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onSelected(i);
                      },
                      child: AnimatedContainer(
                        duration: MediaQuery.disableAnimationsOf(context)
                            ? Duration.zero
                            : const Duration(milliseconds: 240),
                        curve: Curves.easeOutCubic,
                        constraints: const BoxConstraints(minHeight: 60),
                        padding: const EdgeInsets.symmetric(
                          vertical: 9,
                          horizontal: 2,
                        ),
                        decoration: BoxDecoration(
                          color: i == selected ? accent : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Badge(
                              isLabelVisible: items[i].badge > 0,
                              label: Text(
                                items[i].badge > 99
                                    ? '99+'
                                    : '${items[i].badge}',
                              ),
                              child: Icon(items[i].icon, size: 23, color: ink),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              items[i].label,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: i == selected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: ink,
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
}
