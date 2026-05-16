import 'package:flutter/material.dart';

class LiquidBackground extends StatelessWidget {
  final Widget? child;
  const LiquidBackground({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFFBF8FF),
            Color(0xFFF4EDFF),
            Color(0xFFFFF8EE),
          ],
        ),
      ),
      child: RepaintBoundary(
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              top: -130,
              left: -120,
              child: _GlowOrb(
                size: 360,
                color: const Color(0xFF7C3AED).withValues(alpha: 0.18),
              ),
            ),
            Positioned(
              top: 220,
              right: -140,
              child: _GlowOrb(
                size: 320,
                color: const Color(0xFFFF9F1C).withValues(alpha: 0.17),
              ),
            ),
            Positioned(
              bottom: -120,
              left: -90,
              child: _GlowOrb(
                size: 300,
                color: const Color(0xFF10B981).withValues(alpha: 0.12),
              ),
            ),
            ?child,
          ],
        ),
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  final double size;
  final Color color;

  const _GlowOrb({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color, color.withValues(alpha: 0)],
            stops: const [0.0, 1.0],
          ),
        ),
      ),
    );
  }
}
