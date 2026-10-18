import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../motion/motion.dart';
import '../theme/world_theme.dart';

class SignatureLoader extends StatefulWidget {
  const SignatureLoader({super.key});
  @override
  State<SignatureLoader> createState() => _SignatureLoaderState();
}

class _SignatureLoaderState extends State<SignatureLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (Motion.reduce(context)) {
      _controller.stop();
    } else {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Loading',
    child: RepaintBoundary(
      child: SizedBox.square(
        dimension: 42,
        child: CustomPaint(
          painter: _OrbitPainter(_controller, WorldTheme.of(context)),
        ),
      ),
    ),
  );
}

class _OrbitPainter extends CustomPainter {
  _OrbitPainter(this.animation, this.world) : super(repaint: animation);
  final Animation<double> animation;
  final WorldTheme world;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(animation.value * math.pi * 2);
    for (var i = 0; i < 3; i++) {
      canvas.save();
      canvas.rotate(i * math.pi * 2 / 3);
      canvas.translate(0, -12);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          const Rect.fromLTWH(-5, -5, 10, 10),
          const Radius.circular(4),
        ),
        Paint()..color = [world.accent, world.secondary, world.mint][i],
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _OrbitPainter old) => old.world != world;
}

/// One controller and one shader for the entire skeleton subtree.
class SkeletonSurface extends StatefulWidget {
  const SkeletonSurface({super.key, required this.child});
  final Widget child;
  @override
  State<SkeletonSurface> createState() => _SkeletonSurfaceState();
}

class _SkeletonSurfaceState extends State<SkeletonSurface>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (Motion.reduce(context)) {
      _controller.stop();
    } else {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Loading content',
    child: ExcludeSemantics(
      child: AnimatedBuilder(
        animation: _controller,
        child: widget.child,
        builder: (context, child) => ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(-3 + _controller.value * 6, 0),
            end: Alignment(-1 + _controller.value * 6, 0),
            colors: [
              Colors.white.withValues(alpha: 0),
              Colors.white.withValues(alpha: .6),
              Colors.white.withValues(alpha: 0),
            ],
          ).createShader(bounds),
          child: child,
        ),
      ),
    ),
  );
}

class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.width, this.height = 16});
  final double? width;
  final double height;
  @override
  Widget build(BuildContext context) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: WorldTheme.of(context).surface,
      borderRadius: BorderRadius.circular(12),
    ),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    required this.onAction,
    this.action = 'Explore notes',
    this.icon = Icons.layers_outlined,
  });
  final String title, message, action;
  final VoidCallback onAction;
  final IconData icon;
  @override
  Widget build(BuildContext context) {
    final w = WorldTheme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(25),
            decoration: BoxDecoration(shape: BoxShape.circle, color: w.surface),
            child: Icon(icon, color: w.accent, size: 36),
          ),
          const SizedBox(height: 25),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(color: w.muted, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          FilledButton(onPressed: onAction, child: Text(action)),
        ],
      ),
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key, required this.visible});
  final bool visible;
  @override
  Widget build(BuildContext context) => AnimatedSize(
    duration: Motion.duration(context, Motion.calm),
    child: visible
        ? Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            color: CampusTokens.butterSurface,
            child: const Row(
              children: [
                Icon(Icons.wifi_off_rounded, size: 17),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'You’re offline. Here’s what you saved.',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          )
        : const SizedBox.shrink(),
  );
}
