import 'package:flutter/material.dart';

/// Deep Space Navy background — the premium sweet spot between pure black and colored.
/// Color: #080B14 (dark navy) with rich purple/cyan orbs.
///
/// Why navy beats pure black for glassmorphism:
/// - Blue undertone gives glass cards a "cool", techy depth
/// - Purple + cyan orbs blend naturally into navy (not harsh)
/// - Still OLED-dark enough for battery efficiency
/// - Text and glass borders pop naturally
class LiquidBackground extends StatelessWidget {
  final Widget? child;
  const LiquidBackground({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      // Deep space navy — the signature color
      color: const Color(0xFF080B14),
      child: RepaintBoundary(
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Rich purple nebula — top left (larger, more saturated)
            Positioned(
              top: -100,
              left: -100,
              child: Container(
                width: 520,
                height: 520,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF7B2FFF).withValues(alpha: 0.25),
                      const Color(0xFF4A0099).withValues(alpha: 0.12),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.45, 1.0],
                  ),
                ),
              ),
            ),
            // Electric cyan — bottom right
            Positioned(
              bottom: -80,
              right: -80,
              child: Container(
                width: 440,
                height: 440,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF00C6FF).withValues(alpha: 0.18),
                      const Color(0xFF0066BB).withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.4, 1.0],
                  ),
                ),
              ),
            ),
            // Mid-screen deep blue warmth (connects the two orbs visually)
            Positioned(
              top: MediaQuery.sizeOf(context).height * 0.30,
              left: MediaQuery.sizeOf(context).width * 0.25,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF1A0066).withValues(alpha: 0.15),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            ?child,
          ],
        ),
      ),
    );
  }
}
