import 'package:flutter/material.dart';
import '../motion/motion.dart';
import '../theme/world_theme.dart';

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: TextStyle(
      fontSize: 9,
      letterSpacing: 1.4,
      fontWeight: FontWeight.w500,
      height: 1.5,
      color: WorldTheme.of(context).muted,
    ),
  );
}

class SectionHeading extends StatelessWidget {
  const SectionHeading(this.title, {super.key, this.onMore});
  final String title;
  final VoidCallback? onMore;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 16),
    child: Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        if (onMore != null)
          TextButton(
            onPressed: onMore,
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('View all', style: TextStyle(fontSize: 11)),
                SizedBox(width: 5),
                Icon(Icons.north_east, size: 14),
              ],
            ),
          ),
      ],
    ),
  );
}

class ActionTile extends StatelessWidget {
  const ActionTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String title, subtitle;
  final Color color;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => PressableScale(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(icon, size: 26, color: WorldTheme.of(context).accentInk),
              const Spacer(),
              Icon(
                Icons.north_east,
                size: 15,
                color: WorldTheme.of(context).muted,
              ),
            ],
          ),
          const SizedBox(height: 23),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: TextStyle(fontSize: 10, color: WorldTheme.of(context).muted),
          ),
        ],
      ),
    ),
  );
}

class NoteTile extends StatelessWidget {
  const NoteTile({
    super.key,
    required this.title,
    required this.caption,
    required this.color,
    required this.onTap,
    this.index = 0,
  });
  final String title, caption;
  final Color color;
  final VoidCallback onTap;
  final int index;
  @override
  Widget build(BuildContext context) => PressableScale(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: WorldTheme.of(context).surface),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: double.infinity,
            color: color,
            padding: const EdgeInsets.all(17),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('MADE A LITTLE CLEARER'),
                const SizedBox(height: 13),
                SizedBox(
                  height: 55,
                  width: double.infinity,
                  child: CustomPaint(
                    painter: _SignalPainter(
                      WorldTheme.of(context).accentInk,
                      index,
                    ),
                  ),
                ),
                const SizedBox(height: 15),
                Text(caption, style: Theme.of(context).textTheme.titleLarge),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('SEMESTER 4 · 24 PAGES'),
                const SizedBox(height: 8),
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 13),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: color,
                      child: const Text('N', style: TextStyle(fontSize: 10)),
                    ),
                    const SizedBox(width: 7),
                    Text(
                      'Niya K.',
                      style: TextStyle(
                        fontSize: 11,
                        color: WorldTheme.of(context).muted,
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.arrow_outward, size: 17),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _SignalPainter extends CustomPainter {
  _SignalPainter(this.color, this.index);
  final Color color;
  final int index;
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color.withValues(alpha: .65)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final path = Path()..moveTo(0, size.height / 2);
    for (var i = 0; i < 3; i++) {
      final x = i * size.width / 3;
      path.cubicTo(
        x + size.width / 9,
        -size.height / 2,
        x + size.width * 2 / 9,
        size.height * 1.5,
        x + size.width / 3,
        size.height / 2,
      );
    }
    canvas.drawPath(path, p);
    canvas.drawLine(
      Offset(0, size.height * .8),
      Offset(size.width, size.height * .8),
      p..color = color.withValues(alpha: .15),
    );
  }

  @override
  bool shouldRepaint(covariant _SignalPainter old) =>
      old.color != color || old.index != index;
}

class BookIllustration extends StatelessWidget {
  const BookIllustration({super.key, this.campus = false});
  final bool campus;
  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: RepaintBoundary(child: CustomPaint(painter: _BookPainter(campus))),
  );
}

class _BookPainter extends CustomPainter {
  _BookPainter(this.campus);
  final bool campus;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 230, size.height / 220);
    final p = Paint();
    canvas.drawCircle(
      const Offset(120, 105),
      90,
      p
        ..color = const Color(0xFFB5A7D2).withValues(alpha: .25)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
    for (var i = 0; i < 3; i++) {
      final y = 160.0 - i * 22;
      final cover = Path()
        ..moveTo(30, y - 35)
        ..lineTo(113, y - 78)
        ..lineTo(213, y - 18)
        ..lineTo(130, y + 28)
        ..close();
      final pages = cover.shift(const Offset(0, -7));
      canvas.drawPath(
        cover,
        p
          ..style = PaintingStyle.fill
          ..color = campus
              ? const Color(0xFFD99777)
              : Color.lerp(
                  const Color(0xFFA89BE3),
                  const Color(0xFF7965BC),
                  i / 3,
                )!,
      );
      canvas.drawPath(pages, p..color = const Color(0xFFFCF8EF));
    }
    final book = Path()
      ..moveTo(43, 80)
      ..lineTo(112, 47)
      ..lineTo(197, 97)
      ..lineTo(130, 132)
      ..close();
    canvas.drawPath(book, p..color = const Color(0xFFFFFEF5));
    canvas.drawLine(
      const Offset(112, 47),
      const Offset(130, 132),
      p
        ..color = const Color(0xFFDFD6EC)
        ..strokeWidth = 1.5,
    );
    for (var i = 0; i < 3; i++) {
      canvas.drawLine(
        Offset(59 + i * 5, 81 + i * 6),
        Offset(102 + i * 4, 60 + i * 6),
        p..color = const Color(0xFFC6BCD6),
      );
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(13, 39, 35, 44),
        const Radius.circular(7),
      ),
      p..color = const Color(0xFF4ECDC4),
    );
    canvas.drawPath(
      Path()
        ..moveTo(21, 60)
        ..lineTo(28, 67)
        ..lineTo(40, 51),
      p
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round,
    );
    canvas.drawCircle(
      const Offset(194, 167),
      19,
      p
        ..style = PaintingStyle.fill
        ..color = const Color(0xFFFFAB89),
    );
    canvas.drawLine(
      const Offset(185, 167),
      const Offset(203, 167),
      p
        ..color = Colors.white
        ..strokeWidth = 2,
    );
    canvas.drawLine(const Offset(194, 158), const Offset(194, 176), p);
    canvas.drawCircle(
      const Offset(170, 30),
      4,
      p..color = const Color(0xFFFF8C69),
    );
    canvas.drawCircle(
      const Offset(45, 186),
      3,
      p..color = const Color(0xFFB8B4FF),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _BookPainter old) => old.campus != campus;
}
