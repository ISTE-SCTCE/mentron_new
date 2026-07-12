import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/utils/app_transitions.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/offenso/screens/offenso_academy_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OFFENSO HACKING ACADEMY — Terminal Styled Hero Banner Card
// ─────────────────────────────────────────────────────────────────────────────

class OffensoBannerCard extends StatefulWidget {
  const OffensoBannerCard({super.key});

  // Expose colors to painters if needed
  static const Color voidBg      = Color(0xFF050705);
  static const Color panelTop    = Color(0xFF0A140E);
  static const Color panelBottom = Color(0xFF050805);
  static const Color neon        = Color(0xFF43FF8C);
  static const Color neonDim     = Color(0xFF1F7A45);
  static const Color alertRed    = Color(0xFFFF3B5C);
  static const Color inkWhite    = Color(0xFFEAF5EE);
  static const Color inkDim      = Color(0xFF6E9E80);
  static const Color descGrey    = Color(0xFFB7C9BE);

  @override
  State<OffensoBannerCard> createState() => _OffensoBannerCardState();
}

class _OffensoBannerCardState extends State<OffensoBannerCard>
    with TickerProviderStateMixin {
  late AnimationController _sweepController;
  late Animation<double> _sweepAnimation;

  late AnimationController _redDotController;
  late Animation<double> _redDotOpacity;

  late AnimationController _cursorController;

  @override
  void initState() {
    super.initState();

    // 1. Scan sweep animation: 5s, repeating linear, from -70 to 250
    _sweepController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000),
    )..repeat();
    _sweepAnimation = Tween<double>(begin: -70, end: 250).animate(
      CurvedAnimation(parent: _sweepController, curve: Curves.linear),
    );

    // 2. Red dot blinking: 1.6s repeating reverse, 1.0 -> 0.25
    _redDotController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _redDotOpacity = Tween<double>(begin: 1.0, end: 0.25).animate(
      CurvedAnimation(parent: _redDotController, curve: Curves.easeInOut),
    );

    // 3. Cursor blink: 1s repeating, discrete step blink (no fade)
    _cursorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _sweepController.dispose();
    _redDotController.dispose();
    _cursorController.dispose();
    super.dispose();
  }

  void _onBannerTap() async {
    HapticFeedback.lightImpact();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('offenso_enrolled_or_completed', true);
    } catch (e) {
      debugPrint('Error saving Offenso enrollment state: $e');
    }
    if (!mounted) return;
    Navigator.push(
      context,
      AppTransitions.slideUp(const OffensoAcademyScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 250,
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: OffensoBannerCard.neon.withOpacity(0.18),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: OffensoBannerCard.neon.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: OffensoBannerCard.neon.withOpacity(0.02),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: GestureDetector(
        onTap: _onBannerTap,
        child: Stack(
          children: [
            // Layer 1: Diagonal LinearGradient background (panelTop -> panelBottom)
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: const [OffensoBannerCard.panelTop, OffensoBannerCard.panelBottom],
                    begin: Alignment.topLeft,
                    end: const Alignment(0.36, 1.0), // ~160deg diagonal
                  ),
                ),
              ),
            ),

            // Layer 2: Subtle RadialGradient centered top-right
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.topRight,
                    radius: 0.55,
                    colors: [
                      OffensoBannerCard.neon.withOpacity(0.10),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // Layer 3: Scanline texture CustomPainter
            Positioned.fill(
              child: RepaintBoundary(
                child: CustomPaint(
                  painter: const _ScanlinePainter(),
                ),
              ),
            ),

            // Layer 4: Animated Scan sweep
            AnimatedBuilder(
              animation: _sweepAnimation,
              builder: (context, child) {
                return Positioned(
                  top: _sweepAnimation.value,
                  left: 0,
                  right: 0,
                  height: 70,
                  child: child!,
                );
              },
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      OffensoBannerCard.neon.withOpacity(0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // Layer 5: Corner brackets (16x16, 12px padding)
            Positioned(
              top: 12,
              left: 12,
              child: const SizedBox(
                width: 16,
                height: 16,
                child: CustomPaint(painter: _BracketPainter()),
              ),
            ),
            Positioned(
              top: 12,
              right: 12,
              child: SizedBox(
                width: 16,
                height: 16,
                child: Transform.scale(
                  scaleX: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              left: 12,
              child: SizedBox(
                width: 16,
                height: 16,
                child: Transform.scale(
                  scaleY: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              right: 12,
              child: SizedBox(
                width: 16,
                height: 16,
                child: Transform.scale(
                  scaleX: -1,
                  scaleY: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),

            // Layer 6: Main Content
            Positioned.fill(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Eyebrow row: shield icon + label + blinking red dot
                    Row(
                      children: [
                        const Icon(
                          Icons.shield_outlined,
                          size: 13,
                          color: OffensoBannerCard.neon,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'ELITE ACADEMY',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                            color: OffensoBannerCard.neon,
                          ),
                        ),
                        const Spacer(),
                        AnimatedBuilder(
                          animation: _redDotOpacity,
                          builder: (context, child) {
                            return Opacity(
                              opacity: _redDotOpacity.value,
                              child: child,
                            );
                          },
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: OffensoBannerCard.alertRed,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Headline: uppercase two-tone text
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: RichText(
                        text: TextSpan(
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            height: 1.05,
                            letterSpacing: -0.3,
                          ),
                          children: const [
                            TextSpan(
                              text: 'OFFENSO\n',
                              style: TextStyle(color: OffensoBannerCard.inkWhite),
                            ),
                            TextSpan(
                              text: 'HACKING ACADEMY',
                              style: TextStyle(color: OffensoBannerCard.neon),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Terminal line row
                    Row(
                      children: [
                        Text(
                          'root@offenso:~\$ initiate_breach --mode=ethical',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 12,
                            color: OffensoBannerCard.inkDim,
                          ),
                        ),
                        const SizedBox(width: 4),
                        AnimatedBuilder(
                          animation: _cursorController,
                          builder: (context, child) {
                            final isVisible = _cursorController.value < 0.5;
                            return Opacity(
                              opacity: isVisible ? 1.0 : 0.0,
                              child: child,
                            );
                          },
                          child: Container(
                            width: 7,
                            height: 13,
                            color: OffensoBannerCard.neon,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Description text
                    Container(
                      constraints: const BoxConstraints(maxWidth: 240),
                      child: Text(
                        'Master ethical hacking, penetration testing, and cybersecurity from first exploit to full report.',
                        style: GoogleFonts.ibmPlexSans(
                          fontSize: 14.5,
                          height: 1.5,
                          color: OffensoBannerCard.descGrey,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    const Spacer(),

                    // Action buttons: CTA and Badge
                    Row(
                      children: [
                        // CTA button (neon background + double shadow glow)
                        GestureDetector(
                          onTap: _onBannerTap,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 11,
                            ),
                            decoration: BoxDecoration(
                              color: OffensoBannerCard.neon,
                              borderRadius: BorderRadius.circular(7),
                              boxShadow: [
                                BoxShadow(
                                  color: OffensoBannerCard.neon.withOpacity(0.40),
                                  blurRadius: 8,
                                ),
                                BoxShadow(
                                  color: OffensoBannerCard.neon.withOpacity(0.20),
                                  blurRadius: 24,
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'EXPLORE COURSES',
                                  style: GoogleFonts.jetBrainsMono(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: OffensoBannerCard.voidBg,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 14,
                                  color: OffensoBannerCard.voidBg,
                                ),
                              ],
                            ),
                          ),
                        ),

                        const Spacer(),

                        // Certified Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.03),
                            borderRadius: BorderRadius.circular(7),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.22),
                              width: 1.0,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.verified_outlined,
                                color: OffensoBannerCard.neon,
                                size: 13,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'CERTIFIED',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: OffensoBannerCard.inkWhite,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Painters
// ─────────────────────────────────────────────────────────────────────────────

class _ScanlinePainter extends CustomPainter {
  const _ScanlinePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = OffensoBannerCard.neon.withOpacity(0.035)
      ..strokeWidth = 1.0;

    const double pitch = 3.0;
    for (double y = 0; y < size.height; y += pitch) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_ScanlinePainter oldDelegate) => false;
}

class _BracketPainter extends CustomPainter {
  const _BracketPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = OffensoBannerCard.neon
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(_BracketPainter oldDelegate) => false;
}
