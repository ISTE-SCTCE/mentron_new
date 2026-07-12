import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/app_transitions.dart';
import '../../features/offenso/screens/offenso_academy_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OFFENSO LAUNCH OVERLAY — Full-screen interstitial promo
// ─────────────────────────────────────────────────────────────────────────────

class OffensoLaunchOverlay extends StatefulWidget {
  const OffensoLaunchOverlay({super.key});

  static const Color voidBg      = Color(0xFF050705);
  static const Color panelTop    = Color(0xFF0A140E);
  static const Color panelBottom = Color(0xFF050805);
  static const Color neon        = Color(0xFF43FF8C);
  static const Color neonDim     = Color(0xFF1F7A45);
  static const Color alertRed    = Color(0xFFFF3B5C);
  static const Color inkWhite    = Color(0xFFEAF5EE);
  static const Color inkDim      = Color(0xFF6E9E80);
  static const Color descGrey    = Color(0xFFB7C9BE);

  // In-memory flag to ensure it only shows once per app session (cold start)
  static bool _hasShownThisSession = false;

  /// Utility to trigger the overlay if session and enrollment conditions are met
  static Future<void> showIfNeeded(BuildContext context) async {
    if (_hasShownThisSession) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final isEnrolled = prefs.getBool('offenso_enrolled_or_completed') ?? false;
      if (isEnrolled) return;

      final hasShownPersist = prefs.getBool('offenso_launch_overlay_shown_persist') ?? false;
      if (hasShownPersist) return;

      await prefs.setBool('offenso_launch_overlay_shown_persist', true);
    } catch (e) {
      debugPrint('Error reading Offenso enrollment state: $e');
    }

    _hasShownThisSession = true;

    if (!context.mounted) return;

    Navigator.of(context).push(PageRouteBuilder(
      opaque: true,
      pageBuilder: (_, __, ___) => const OffensoLaunchOverlay(),
      transitionsBuilder: (_, anim, __, child) =>
          FadeTransition(opacity: anim, child: child),
      transitionDuration: const Duration(milliseconds: 350),
    ));
  }

  @override
  State<OffensoLaunchOverlay> createState() => _OffensoLaunchOverlayState();
}

class _OffensoLaunchOverlayState extends State<OffensoLaunchOverlay>
    with TickerProviderStateMixin {
  late AnimationController _sweepController;
  late AnimationController _redDotController;
  late Animation<double> _redDotOpacity;
  late AnimationController _cursorController;

  // Entry stagger animation controllers
  late AnimationController _entryController;
  late Animation<double> _eyebrowHeadlineFade;
  late Animation<Offset> _eyebrowHeadlineSlide;
  late Animation<double> _terminalDescFade;
  late Animation<Offset> _terminalDescSlide;
  late Animation<double> _ctaBadgeFade;
  late Animation<Offset> _ctaBadgeSlide;

  @override
  void initState() {
    super.initState();

    // 1. Ambient Scan Sweep: 5 seconds looping
    _sweepController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000),
    )..repeat();

    // 2. Ambient Red Dot Opacity: 1.6 seconds looping
    _redDotController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _redDotOpacity = Tween<double>(begin: 1.0, end: 0.25).animate(
      CurvedAnimation(parent: _redDotController, curve: Curves.easeInOut),
    );

    // 3. Ambient Cursor: 1 second step blink
    _cursorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();

    // 4. Staggered Entry Animation: 500ms
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    // Group 1 (Eyebrow & Headline): 0% to 60% of duration (0ms to 300ms)
    _eyebrowHeadlineFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic),
      ),
    );
    _eyebrowHeadlineSlide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic),
      ),
    );

    // Group 2 (Terminal & Description): 20% to 80% of duration (100ms to 400ms)
    _terminalDescFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOutCubic),
      ),
    );
    _terminalDescSlide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    // Group 3 (CTA & Badges): 40% to 100% of duration (200ms to 500ms)
    _ctaBadgeFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOutCubic),
      ),
    );
    _ctaBadgeSlide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    _entryController.forward();
  }

  @override
  void dispose() {
    _sweepController.dispose();
    _redDotController.dispose();
    _cursorController.dispose();
    _entryController.dispose();
    super.dispose();
  }

  void _onExploreCourses(BuildContext context) async {
    HapticFeedback.lightImpact();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('offenso_enrolled_or_completed', true);
    } catch (e) {
      debugPrint('Error saving Offenso enrollment state: $e');
    }

    if (!context.mounted) return;

    // Pop the overlay, then push the academy screen
    Navigator.of(context).pop();
    Navigator.push(
      context,
      AppTransitions.slideUp(const OffensoAcademyScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final disableAnimations = MediaQuery.of(context).disableAnimations;

    // Build the visual stack
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: OffensoLaunchOverlay.voidBg,
        body: Stack(
          children: [
            // 1. Layer 1: Diagonal LinearGradient Background
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: const [OffensoLaunchOverlay.panelTop, OffensoLaunchOverlay.panelBottom],
                    begin: Alignment.topLeft,
                    end: const Alignment(0.36, 1.0), // ~160deg diagonal
                  ),
                ),
              ),
            ),

            // 2. Layer 2: Radial Glow top-right
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.topRight,
                    radius: 0.55,
                    colors: [
                      OffensoLaunchOverlay.neon.withOpacity(0.10),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // 3. Layer 3: Scanline CustomPainter (ambient, disabled if reduced-motion)
            if (!disableAnimations)
              Positioned.fill(
                child: RepaintBoundary(
                  child: CustomPaint(
                    painter: const _ScanlinePainter(),
                  ),
                ),
              ),

            // 4. Layer 4: Scan Sweep (ambient, disabled if reduced-motion)
            if (!disableAnimations)
              AnimatedBuilder(
                animation: _sweepController,
                builder: (context, child) {
                  final top = -70 + (size.height + 70) * _sweepController.value;
                  return Positioned(
                    top: top,
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
                        OffensoLaunchOverlay.neon.withOpacity(0.08),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),

            // 5. Layer 5: Large Corner Brackets (24x24, inset 20px)
            Positioned(
              top: 20 + MediaQuery.paddingOf(context).top,
              left: 20,
              child: const SizedBox(
                width: 24,
                height: 24,
                child: CustomPaint(painter: _BracketPainter()),
              ),
            ),
            Positioned(
              top: 20 + MediaQuery.paddingOf(context).top,
              right: 20,
              child: SizedBox(
                width: 24,
                height: 24,
                child: Transform.scale(
                  scaleX: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),
            Positioned(
              bottom: 20 + MediaQuery.paddingOf(context).bottom,
              left: 20,
              child: SizedBox(
                width: 24,
                height: 24,
                child: Transform.scale(
                  scaleY: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),
            Positioned(
              bottom: 20 + MediaQuery.paddingOf(context).bottom,
              right: 20,
              child: SizedBox(
                width: 24,
                height: 24,
                child: Transform.scale(
                  scaleX: -1,
                  scaleY: -1,
                  child: const CustomPaint(painter: _BracketPainter()),
                ),
              ),
            ),

            // 6. Layer 6: Close "X" Button top-right
            Positioned(
              top: 12 + MediaQuery.paddingOf(context).top,
              right: 12,
              child: IconButton(
                icon: const Icon(
                  Icons.close_rounded,
                  color: OffensoLaunchOverlay.inkDim,
                  size: 24,
                ),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop();
                },
              ),
            ),

            // 7. Layer 7: Centered Content Column (with staggers)
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 340),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Group 1: Eyebrow + Headline
                      _buildStagger(
                        disableAnimations: disableAnimations,
                        fadeAnim: _eyebrowHeadlineFade,
                        slideAnim: _eyebrowHeadlineSlide,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.shield_outlined,
                                  size: 14,
                                  color: OffensoLaunchOverlay.neon,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'ELITE ACADEMY',
                                  style: GoogleFonts.jetBrainsMono(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.5,
                                    color: OffensoLaunchOverlay.neon,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                AnimatedBuilder(
                                  animation: _redDotOpacity,
                                  builder: (context, child) {
                                    return Opacity(
                                      opacity: disableAnimations ? 1.0 : _redDotOpacity.value,
                                      child: child,
                                    );
                                  },
                                  child: Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: OffensoLaunchOverlay.alertRed,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: GoogleFonts.jetBrainsMono(
                                    fontSize: 42,
                                    fontWeight: FontWeight.w800,
                                    height: 1.1,
                                    letterSpacing: -0.5,
                                  ),
                                  children: const [
                                    TextSpan(
                                      text: 'OFFENSO\n',
                                      style: TextStyle(color: OffensoLaunchOverlay.inkWhite),
                                    ),
                                    TextSpan(
                                      text: 'HACKING ACADEMY',
                                      style: TextStyle(color: OffensoLaunchOverlay.neon),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 22),

                      // Group 2: Terminal + Description
                      _buildStagger(
                        disableAnimations: disableAnimations,
                        fadeAnim: _terminalDescFade,
                        slideAnim: _terminalDescSlide,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'root@offenso:~\$ initiate_breach --mode=ethical',
                                  style: GoogleFonts.jetBrainsMono(
                                    fontSize: 12,
                                    color: OffensoLaunchOverlay.inkDim,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                AnimatedBuilder(
                                  animation: _cursorController,
                                  builder: (context, child) {
                                    final isVisible = disableAnimations || _cursorController.value < 0.5;
                                    return Opacity(
                                      opacity: isVisible ? 1.0 : 0.0,
                                      child: child,
                                    );
                                  },
                                  child: Container(
                                    width: 7,
                                    height: 13,
                                    color: OffensoLaunchOverlay.neon,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 22),
                            Text(
                              'Master ethical hacking, penetration testing, and cybersecurity from first exploit to full report.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.ibmPlexSans(
                                fontSize: 15.5,
                                height: 1.5,
                                color: OffensoLaunchOverlay.descGrey,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 36),

                      // Group 3: CTA + Badge + Skip Text
                      _buildStagger(
                        disableAnimations: disableAnimations,
                        fadeAnim: _ctaBadgeFade,
                        slideAnim: _ctaBadgeSlide,
                        child: Column(
                          children: [
                            GestureDetector(
                              onTap: () => _onExploreCourses(context),
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                decoration: BoxDecoration(
                                  color: OffensoLaunchOverlay.neon,
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: OffensoLaunchOverlay.neon.withOpacity(0.40),
                                      blurRadius: 8,
                                    ),
                                    BoxShadow(
                                      color: OffensoLaunchOverlay.neon.withOpacity(0.20),
                                      blurRadius: 24,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'EXPLORE COURSES',
                                      style: GoogleFonts.jetBrainsMono(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: OffensoLaunchOverlay.voidBg,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(
                                      Icons.arrow_forward_rounded,
                                      size: 16,
                                      color: OffensoLaunchOverlay.voidBg,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
                                    color: OffensoLaunchOverlay.neon,
                                    size: 13,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'CERTIFIED',
                                    style: GoogleFonts.jetBrainsMono(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: OffensoLaunchOverlay.inkWhite,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),
                            GestureDetector(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                Navigator.of(context).pop();
                              },
                              child: Text(
                                'SKIP FOR NOW →',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 11,
                                  color: OffensoLaunchOverlay.inkDim,
                                  decoration: TextDecoration.underline,
                                  decorationColor: OffensoLaunchOverlay.inkDim,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStagger({
    required bool disableAnimations,
    required Animation<double> fadeAnim,
    required Animation<Offset> slideAnim,
    required Widget child,
  }) {
    if (disableAnimations) return child;
    return FadeTransition(
      opacity: fadeAnim,
      child: SlideTransition(
        position: slideAnim,
        child: child,
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
      ..color = OffensoLaunchOverlay.neon.withOpacity(0.035)
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
      ..color = OffensoLaunchOverlay.neon
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(_BracketPainter oldDelegate) => false;
}
