import 'package:flutter/material.dart';
import '../../../shared/widgets/pressable_scale.dart';

/// Reusable Neon Portal Graphic & Announcement Banner for Mentron Gate Initiative
class GatePortalBanner extends StatelessWidget {
  final VoidCallback? onTap;
  final bool compact;

  const GatePortalBanner({
    super.key,
    this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onTap,
      child: Container(
        height: compact ? 160 : 200,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0D0424),
              Color(0xFF130938),
              Color(0xFF09122C),
            ],
          ),
          border: Border.all(
            color: const Color(0xFF00C6FF).withValues(alpha: 0.35),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7000DF).withValues(alpha: 0.3),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: const Color(0xFF00C6FF).withValues(alpha: 0.15),
              blurRadius: 16,
              spreadRadius: 1,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: Stack(
            children: [
              // ── Background Ambient Glows & Arches ──
              Positioned(
                right: -40,
                top: -30,
                bottom: -30,
                width: 220,
                child: CustomPaint(
                  painter: _GatePortalPainter(),
                ),
              ),

              // ── Content ──
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Badge
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF00C6FF).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF00C6FF).withValues(alpha: 0.35),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('✨ ', style: TextStyle(fontSize: 10)),
                              Text(
                                'DIRECT ACADEMIC PORTALS',
                                style: TextStyle(
                                  color: Color(0xFF00C6FF),
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                            ),
                          ),
                          child: const Text(
                            'LIVE NOW',
                            style: TextStyle(
                              color: Color(0xFF4ADE80),
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Title & Description
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mentron Gate Initiative',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        SizedBox(
                          width: MediaQuery.of(context).size.width * 0.58,
                          child: const Text(
                            'Direct department & subject notes archive. No year or semester barriers.',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Action CTA
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7000DF), Color(0xFF00C6FF)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00C6FF).withValues(alpha: 0.3),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'OPEN PORTAL',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 13,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'ECE • ME + more',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
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

class _GatePortalPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width * 0.75, size.height * 0.5);

    // Glowing blur core
    final corePaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF00C6FF).withValues(alpha: 0.6),
          const Color(0xFF7000DF).withValues(alpha: 0.3),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: 70));
    canvas.drawCircle(center, 70, corePaint);

    // Outer concentric ring
    final ringPaint = Paint()
      ..color = const Color(0xFF7000DF).withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(center, 80, ringPaint);

    // Mid neon ring
    final neonRing = Paint()
      ..color = const Color(0xFF00C6FF).withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawCircle(center, 58, neonRing);

    // Portal Arch
    final archPath = Path()
      ..moveTo(center.dx - 36, center.dy + 60)
      ..lineTo(center.dx - 36, center.dy - 10)
      ..quadraticBezierTo(center.dx, center.dy - 65, center.dx + 36, center.dy - 10)
      ..lineTo(center.dx + 36, center.dy + 60);

    final archPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFF00C6FF),
          Color(0xFF7000DF),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: 60))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(archPath, archPaint);

    // Core singularity
    final singularityPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 5, singularityPaint);

    // Department Runes / Nodes
    _drawNode(canvas, Offset(center.dx - 55, center.dy + 20), 'ECE', const Color(0xFF00C6FF));
    _drawNode(canvas, Offset(center.dx + 55, center.dy + 20), 'ME', const Color(0xFFF97316));
  }

  void _drawNode(Canvas canvas, Offset pos, String text, Color color) {
    final bgPaint = Paint()
      ..color = const Color(0xFF030712)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(pos, 14, bgPaint);

    final borderPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawCircle(pos, 14, borderPaint);

    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: 8,
          fontWeight: FontWeight.w900,
          fontFamily: 'monospace',
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset(pos.dx - textPainter.width / 2, pos.dy - textPainter.height / 2),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
