import 'package:flutter/material.dart';

/// Premium animated splash screen shown on app launch.
/// Sequence:
///   0ms   → background fades in
///   300ms → logo orb pulses in
///   700ms → "MENTRON" letters stagger in from below
///  1400ms → tagline fades in
///  2200ms → everything fades out → onComplete() called
class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // ── Controllers ──────────────────────────────────────────────────────────
  late AnimationController _orbController;       // pulsing glow orb
  late AnimationController _textController;      // stagger letters
  late AnimationController _taglineController;   // tagline fade
  late AnimationController _exitController;      // full-screen fade out

  // ── Animations ────────────────────────────────────────────────────────────
  late Animation<double> _orbScale;
  late Animation<double> _orbOpacity;
  late Animation<double> _taglineOpacity;
  late Animation<double> _exitOpacity;

  final String _brandText = 'MENTRON';
  final List<Animation<Offset>> _letterSlides = [];
  final List<Animation<double>> _letterOpacities = [];

  @override
  void initState() {
    super.initState();

    // ── Orb ──────────────────────────────────────────────────────────────
    _orbController = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _orbScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _orbController, curve: Curves.elasticOut),
    );
    _orbOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _orbController, curve: const Interval(0.0, 0.5, curve: Curves.easeIn)),
    );

    // ── Letters ────────────────────────────────────────────────────────────
    _textController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    for (int i = 0; i < _brandText.length; i++) {
      final startInterval = (i / _brandText.length) * 0.6;
      final endInterval = startInterval + 0.5;
      final clampedEnd = endInterval.clamp(0.0, 1.0);

      _letterSlides.add(
        Tween<Offset>(begin: const Offset(0, 0.8), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _textController,
            curve: Interval(startInterval, clampedEnd, curve: Curves.easeOutCubic),
          ),
        ),
      );
      _letterOpacities.add(
        Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(
            parent: _textController,
            curve: Interval(startInterval, clampedEnd, curve: Curves.easeIn),
          ),
        ),
      );
    }

    // ── Tagline ─────────────────────────────────────────────────────────────
    _taglineController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _taglineOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _taglineController, curve: Curves.easeIn),
    );

    // ── Exit ────────────────────────────────────────────────────────────────
    _exitController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _exitOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _exitController, curve: Curves.easeInCubic),
    );

    _runSequence();
  }

  Future<void> _runSequence() async {
    // Phase 1: Orb pulses in
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    _orbController.forward();

    // Phase 2: Letters stagger in
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    _textController.forward();

    // Phase 3: Tagline fades in
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    _taglineController.forward();

    // Phase 4: Hold for a moment then exit
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    await _exitController.forward();

    if (mounted) widget.onComplete();
  }

  @override
  void dispose() {
    _orbController.dispose();
    _textController.dispose();
    _taglineController.dispose();
    _exitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return FadeTransition(
      opacity: _exitOpacity,
      child: Scaffold(
        backgroundColor:const Color(0xFF030305),
        body: Stack(
          alignment: Alignment.center,
          children: [
            // ── Ambient gradient blobs ─────────────────────────────────
            Positioned(
              top: size.height * 0.15,
              left: size.width * 0.1,
              child: _GlowBlob(
                color: const Color(0xFF7000DF),
                size: size.width * 0.7,
                opacity: 0.18,
              ),
            ),
            Positioned(
              bottom: size.height * 0.2,
              right: size.width * 0.05,
              child: _GlowBlob(
                color: const Color(0xFF00C6FF),
                size: size.width * 0.5,
                opacity: 0.12,
              ),
            ),

            // ── Main content ──────────────────────────────────────────
            Center(
              child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Logo image with orb animation
                AnimatedBuilder(
                  animation: _orbController,
                  builder: (_, _) => Opacity(
                    opacity: _orbOpacity.value,
                    child: Transform.scale(
                      scale: _orbScale.value,
                      child: _PulsingLogo(),
                    ),
                  ),
                ),
              ],
            ),
            ),

            // ── Bottom loading bar ────────────────────────────────────
            Positioned(
              bottom: 60,
              child: FadeTransition(
                opacity: _taglineOpacity,
                child: _PulsingBar(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Glow blob background element ─────────────────────────────────────────────
class _GlowBlob extends StatelessWidget {
  final Color color;
  final double size;
  final double opacity;
  const _GlowBlob({required this.color, required this.size, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color.withValues(alpha: opacity), Colors.transparent],
          stops: const [0.0, 1.0],
        ),
      ),
    );
  }
}

// ── Pulsing Mentron logo image ─────────────────────────────────────────────
class _PulsingLogo extends StatefulWidget {
  @override
  State<_PulsingLogo> createState() => _PulsingLogoState();
}

class _PulsingLogoState extends State<_PulsingLogo> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.97, end: 1.03).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, _) => Transform.scale(
        scale: _pulse.value,
        child: Image.asset(
          'assets/images/mentron_logo.png',
          width: MediaQuery.of(context).size.width * 0.65,
          filterQuality: FilterQuality.high,
          isAntiAlias: true,
        ),
      ),
    );
  }
}

// ── Animated loading bar ────────────────────────────────────────────────────
class _PulsingBar extends StatefulWidget {
  @override
  State<_PulsingBar> createState() => _PulsingBarState();
}

class _PulsingBarState extends State<_PulsingBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
    _progress = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _progress,
      builder: (_, _) => Container(
        width: 120,
        height: 2,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(2),
        ),
        child: FractionallySizedBox(
          widthFactor: _progress.value,
          alignment: Alignment.centerLeft,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              gradient: const LinearGradient(
                colors: [Color(0xFF7000DF), Color(0xFF00C6FF)],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
