import 'package:flutter/material.dart';

/// A quiet drawing-paper canvas behind the account and feature screens.
class LiquidBackground extends StatelessWidget {
  final Widget? child;
  const LiquidBackground({super.key, this.child});
  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return ColoredBox(
      color: dark ? const Color(0xff16121e) : const Color(0xfff7f3fc),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: IgnorePointer(
              child: RepaintBoundary(
                child: CustomPaint(painter: _PaperPainter(dark)),
              ),
            ),
          ),
          if (child != null) child!,
        ],
      ),
    );
  }
}

class _PaperPainter extends CustomPainter {
  const _PaperPainter(this.dark);
  final bool dark;
  @override
  void paint(Canvas canvas, Size size) {
    final dots = Paint()
      ..color = (dark ? Colors.white : const Color(0xff7650a6)).withValues(
        alpha: .09,
      );
    for (double x = 12; x < size.width; x += 24) {
      for (double y = 12; y < size.height; y += 24) {
        canvas.drawCircle(Offset(x, y), .8, dots);
      }
    }
    final pen = Paint()
      ..color = const Color(0xffa992ca).withValues(alpha: .16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      canvas.drawCircle(Offset(size.width + 18, 110), 90 + i * 20, pen);
    }
    canvas.save();
    canvas.translate(-35, size.height - 70);
    canvas.rotate(-.22);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(0, 0, 190, 120),
        const Radius.circular(12),
      ),
      Paint()..color = const Color(0xffa1d4ca).withValues(alpha: .2),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_PaperPainter old) => old.dark != dark;
}
