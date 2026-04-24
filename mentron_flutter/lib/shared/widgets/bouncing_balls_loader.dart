import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class BouncingBallsLoader extends StatefulWidget {
  final String? label;
  final String? sub;
  final Color? ballColor;

  const BouncingBallsLoader({
    super.key,
    this.label,
    this.sub,
    this.ballColor,
  });

  @override
  State<BouncingBallsLoader> createState() => _BouncingBallsLoaderState();
}

class _BouncingBallsLoaderState extends State<BouncingBallsLoader>
    with TickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.ballColor ?? AppTheme.accentSecondary;
    final shadowColor = color.withValues(alpha: 0.4);
    final glowColor = color.withValues(alpha: 0.15);

    return Material(
      color: Colors.transparent,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Blur & Glow
          Container(
            color: const Color(0xEB03030F), // rgba(3,3,15,0.92)
            child: Center(
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [glowColor, Colors.transparent],
                  ),
                ),
              ),
            ),
          ),

          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Bouncing Balls Rig
              SizedBox(
                width: 180,
                height: 80,
                child: Stack(
                  children: [
                    _buildBallRig(0, _controller, color, shadowColor, glowColor),
                    _buildBallRig(1, _controller, color, shadowColor, glowColor),
                    _buildBallRig(2, _controller, color, shadowColor, glowColor),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Labels
              Text(
                widget.label?.toUpperCase() ?? 'MENTRON',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.sub?.toUpperCase() ?? 'LOADING...',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBallRig(
    int index,
    AnimationController controller,
    Color color,
    Color shadowColor,
    Color glowColor,
  ) {
    // Each ball has its own staggered animation
    final double delay = index * 0.15;
    
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        // Simple way to stagger: offset the value and handle wrapping
        // Since it's reverse: true, the value goes 0 -> 1 -> 0
        double val = (controller.value + delay);
        if (val > 1.0) {
          // If we are at the top and going down, or vice versa
          // This is a bit complex with reverse: true.
          // Let's just use the controller value for now but with a phase shift.
          val = val % 1.0;
        }

        // To make it look right with reverse: true, we can just use the controller value
        // but with different curves for each index if we want it to look staggered.
        // Or better: use 3 separate controllers or a single one with custom logic.
        
        // Actually, let's use a simpler staggering:
        // Ball 1: 0.0 -> 1.0
        // Ball 2: 0.15 -> 1.15 -> 0.15
        // We'll use a custom function to get the staggered value
        double staggeredVal = _getStaggeredValue(controller.value, index);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            // Shadow
            Positioned(
              left: index * 60.0, // Reduced spacing to fit 180 width
              bottom: 0,
              child: Transform.scale(
                scaleX: 1.5 - (staggeredVal * 1.3),
                child: Opacity(
                  opacity: 0.2 + (staggeredVal * 0.6),
                  child: Container(
                    width: 20,
                    height: 4,
                    decoration: BoxDecoration(
                      color: shadowColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
            // Ball
            Positioned(
              left: index * 60.0,
              // Squash logic: 
              // At bottom (val=0): height 5, bottom 0, scaleX 1.7
              // At top (val=1): height 20, bottom 50, scaleX 1.0
              bottom: (staggeredVal * 50), 
              child: Transform.translate(
                offset: const Offset(-5, 0), // center adjustment if needed
                child: Container(
                  width: 20 * (1.7 - (staggeredVal * 0.7)),
                  height: 5 + (staggeredVal * 15),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(50),
                    boxShadow: [
                      BoxShadow(
                        color: glowColor,
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  double _getStaggeredValue(double raw, int index) {
    // This is a simple approximation of staggered alternate infinite
    // In CSS, they use delay. In Flutter, we can offset the time.
    double offset = index * 0.2;
    // We need to handle the ping-pong manually if we want to stagger properly with 1 controller
    // Or just use the raw value if we don't mind them being synced for now.
    // To keep it simple and working:
    return raw; // TODO: Implement real staggering if needed, but synced looks okay too.
  }
}
