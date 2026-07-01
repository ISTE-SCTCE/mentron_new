import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/utils/app_transitions.dart';
import '../../offenso/screens/offenso_academy_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OFFENSO HACKING ACADEMY — Main Event Hero Banner
// Full-width, 220dp, animated cyberpunk gradient banner.
// Sits as the FIRST item in the dashboard scroll — static (not in a PageView).
// ─────────────────────────────────────────────────────────────────────────────

class OffensoBannerWidget extends StatefulWidget {
  const OffensoBannerWidget({super.key});

  @override
  State<OffensoBannerWidget> createState() => _OffensoBannerWidgetState();
}

class _OffensoBannerWidgetState extends State<OffensoBannerWidget>
    with TickerProviderStateMixin {
  // ── Palette ─────────────────────────────────────────────────────────────────
  static const Color _neonGreen    = Color(0xFF00FF41);
  static const Color _surfaceDark  = Color(0xFF0A0E27);
  static const Color _surfaceMid   = Color(0xFF1A1F3A);
  static const Color _surfaceElevated = Color(0xFF252D4A);
  static const Color _textPrimary  = Color(0xFFF0F0F0);
  static const Color _textSecondary = Color(0xFFA0A0A0);
  static const Color _border       = Color(0xFF2A3A5A);

  // ── Gradient cycle colours (3-stop cycling) ──────────────────────────────
  static const List<List<Color>> _gradientCycles = [
    [Color(0xFF1A1F3A), Color(0xFF0A0E27), Color(0xFF0A0E27)],
    [Color(0xFF252D4A), Color(0xFF1A1F3A), Color(0xFF0A0E27)],
    [Color(0xFF1A1F3A), Color(0xFF252D4A), Color(0xFF1A1F3A)],
  ];

  late AnimationController _gradientController;
  late AnimationController _ctaGlowController;
  late AnimationController _entryController;

  int _gradientIndex = 0;
  bool _ctaPressed = false;

  @override
  void initState() {
    super.initState();

    // Entry animation (runs once)
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    )..forward();

    // Gradient cycle: every 3 seconds
    _gradientController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed && mounted) {
          _gradientController.reset();
          setState(() {
            _gradientIndex = (_gradientIndex + 1) % _gradientCycles.length;
          });
          _gradientController.forward();
        }
      });
    _gradientController.forward();

    // CTA glow pulse: infinite 600ms ease-in-out
    _ctaGlowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _gradientController.dispose();
    _ctaGlowController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  void _onBannerTap() {
    HapticFeedback.lightImpact();
    Navigator.push(
      context,
      AppTransitions.slideUp(const OffensoAcademyScreen()),
    );
  }

  void _onCtaTapDown(TapDownDetails _) {
    if (!mounted) return;
    setState(() => _ctaPressed = true);
  }

  void _onCtaTapUp(TapUpDetails _) {
    if (!mounted) return;
    setState(() => _ctaPressed = false);
    _onBannerTap();
  }

  void _onCtaTapCancel() {
    if (!mounted) return;
    setState(() => _ctaPressed = false);
  }

  @override
  Widget build(BuildContext context) {
    final currentGradient = _gradientCycles[_gradientIndex];
    final nextGradient = _gradientCycles[(_gradientIndex + 1) % _gradientCycles.length];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: AnimatedBuilder(
        animation: _gradientController,
        builder: (context, child) {
          final t = _gradientController.value;
          final lerpedColors = List.generate(
            3,
            (i) => Color.lerp(currentGradient[i], nextGradient[i], t)!,
          );

          return GestureDetector(
            onTap: _onBannerTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 220,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: lerpedColors,
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                border: Border.all(color: _border, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: _neonGreen.withOpacity(0.08),
                    blurRadius: 24,
                    spreadRadius: 2,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.hardEdge,
                children: [
                  // ── Background: Subtle grid mesh ────────────────────────
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: CustomPaint(
                        painter: _CyberGridPainter(),
                      ),
                    ),
                  ),

                  // ── Top neon accent line ─────────────────────────────────
                  Positioned(
                    top: 0, left: 0, right: 0,
                    child: Container(
                      height: 2,
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(20),
                        ),
                        gradient: const LinearGradient(
                          colors: [Colors.transparent, _neonGreen, Colors.transparent],
                        ),
                      ),
                    ),
                  ),

                  // ── Decorative corner brackets ───────────────────────────
                  Positioned(top: 12, left: 14, child: _bracketCorner()),
                  Positioned(
                    top: 12, right: 14,
                    child: Transform.scale(scaleX: -1, child: _bracketCorner()),
                  ),
                  Positioned(
                    bottom: 12, left: 14,
                    child: Transform.scale(scaleY: -1, child: _bracketCorner()),
                  ),
                  Positioned(
                    bottom: 12, right: 14,
                    child: Transform.scale(
                      scaleX: -1,
                      scaleY: -1,
                      child: _bracketCorner(),
                    ),
                  ),

                  // ── Floating hexagon accent (top-right, 5% opacity) ──────
                  Positioned(
                    top: -18, right: -18,
                    child: CustomPaint(
                      painter: _HexPainter(
                        color: _neonGreen.withOpacity(0.05),
                      ),
                      size: const Size(100, 100),
                    ),
                  ),

                  // ── Main content ─────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // LAYER 1: Badge / status line
                        Row(
                          children: [
                            const Icon(
                              Icons.shield_outlined,
                              color: _neonGreen,
                              size: 12,
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'ELITE ACADEMY',
                              style: TextStyle(
                                color: _neonGreen,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.5,
                                fontFamily: 'monospace',
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Live indicator dot
                            AnimatedBuilder(
                              animation: _ctaGlowController,
                              builder: (_, __) => Container(
                                width: 5,
                                height: 5,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _neonGreen.withOpacity(0.4 + 0.6 * _ctaGlowController.value,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // LAYER 2: Main title
                        const Text(
                          'OFFENSO HACKING\nACADEMY',
                          style: TextStyle(
                            color: _textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            height: 1.2,
                          ),
                        ),

                        const SizedBox(height: 6),

                        // Subtitle
                        const Text(
                          'Master ethical hacking, penetration testing,\nand cybersecurity',
                          style: TextStyle(
                            color: _textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            height: 1.5,
                          ),
                        ),

                        const Spacer(),

                        // LAYER 3: CTA button + stat chips
                        Row(
                          children: [
                            // CTA button with glow pulse
                            GestureDetector(
                              onTapDown: _onCtaTapDown,
                              onTapUp: _onCtaTapUp,
                              onTapCancel: _onCtaTapCancel,
                              child: AnimatedBuilder(
                                animation: _ctaGlowController,
                                builder: (_, __) {
                                  final glowAlpha = 0.15 + 0.25 * _ctaGlowController.value;
                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 150),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _ctaPressed
                                          ? _neonGreen
                                          : Colors.transparent,
                                      borderRadius: BorderRadius.circular(2),
                                      border: Border.all(
                                        color: _neonGreen,
                                        width: 1.5,
                                      ),
                                      boxShadow: _ctaPressed
                                          ? []
                                          : [
                                              BoxShadow(
                                                color: _neonGreen.withOpacity(glowAlpha,
                                                ),
                                                blurRadius: 12,
                                                spreadRadius: 2,
                                              ),
                                            ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'EXPLORE COURSES',
                                          style: TextStyle(
                                            color: _ctaPressed
                                                ? _surfaceDark
                                                : _neonGreen,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Icon(
                                          Icons.arrow_forward,
                                          color: _ctaPressed
                                              ? _surfaceDark
                                              : _neonGreen,
                                          size: 13,
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),

                            const Spacer(),

                            // Stat chips row (7 modules)
                            _statChip(Icons.layers_outlined, '7 Modules'),
                            const SizedBox(width: 6),
                            _statChip(Icons.verified_outlined, 'Certified'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    )
        .animate(controller: _entryController)
        .slideY(begin: 0.15, end: 0, duration: 300.ms, curve: Curves.easeOutCubic)
        .fadeIn(duration: 300.ms);
  }

  Widget _statChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _surfaceElevated,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: _border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _textSecondary, size: 10),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: _textSecondary,
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _bracketCorner() {
    return SizedBox(
      width: 12,
      height: 12,
      child: CustomPaint(painter: _BracketPainter()),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Painters
// ─────────────────────────────────────────────────────────────────────────────

/// Subtle dot-grid / line-grid overlay at 2.5% opacity
class _CyberGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.025)
      ..strokeWidth = 0.5;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_CyberGridPainter old) => false;
}

/// L-shaped corner bracket
class _BracketPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00FF41).withOpacity(0.35)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(_BracketPainter old) => false;
}

/// Translucent partial hexagon silhouette
class _HexPainter extends CustomPainter {
  final Color color;
  const _HexPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;

    final path = Path();
    for (int i = 0; i < 6; i++) {
      final angle = math.pi / 180 * (60 * i - 30);
      final x = cx + r * math.cos(angle);
      final y = cy + r * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_HexPainter old) => old.color != color;
}

