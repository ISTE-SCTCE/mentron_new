import 'package:animations/animations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/services.dart';

abstract final class Motion {
  static const instant = Duration(milliseconds: 90);
  static const quick = Duration(milliseconds: 160);
  static const base = Duration(milliseconds: 240);
  static const calm = Duration(milliseconds: 360);
  static const hero = Duration(milliseconds: 480);
  static const world = Duration(milliseconds: 420);
  static const spring = SpringDescription(mass: 1, stiffness: 220, damping: 24);
  static bool reduce(BuildContext context) =>
      MediaQuery.disableAnimationsOf(context);
  static Duration duration(BuildContext context, Duration value) =>
      reduce(context) ? instant : value;
}

class PressableScale extends StatefulWidget {
  const PressableScale({
    super.key,
    required this.child,
    required this.onTap,
    this.label,
  });
  final Widget child;
  final VoidCallback onTap;
  final String? label;
  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController.unbounded(
    vsync: this,
    value: 1,
  );
  void _press(bool down) {
    if (Motion.reduce(context)) return;
    _controller.animateWith(
      SpringSimulation(Motion.spring, _controller.value, down ? .97 : 1, 0),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: _controller,
    child: Semantics(
      button: true,
      label: widget.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onHighlightChanged: _press,
          onTap: () {
            HapticFeedback.selectionClick();
            widget.onTap();
          },
          child: widget.child,
        ),
      ),
    ),
  );
}

class StaggerEntrance extends StatefulWidget {
  const StaggerEntrance({super.key, required this.index, required this.child});
  final int index;
  final Widget child;
  @override
  State<StaggerEntrance> createState() => _StaggerEntranceState();
}

class _StaggerEntranceState extends State<StaggerEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: 360 + widget.index.clamp(0, 7) * 40),
  );
  late final Animation<double> _fade = CurvedAnimation(
    parent: _controller,
    curve: Interval(
      widget.index.clamp(0, 7) * 40 / (360 + widget.index.clamp(0, 7) * 40),
      1,
      curve: Curves.easeOutCubic,
    ),
  );
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (Motion.reduce(context) || widget.index >= 8) {
      _controller.value = 1;
    } else if (_controller.status == AnimationStatus.dismissed) {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _fade,
    child: AnimatedBuilder(
      animation: _fade,
      child: widget.child,
      builder: (context, child) => Transform.translate(
        offset: Offset(0, Motion.reduce(context) ? 0 : 12 * (1 - _fade.value)),
        child: child,
      ),
    ),
  );
}

class CampusRoute<T> extends PageRouteBuilder<T> {
  CampusRoute({
    required WidgetBuilder builder,
    required bool reduced,
    super.settings,
  }) : super(
         opaque: true,
         transitionDuration: reduced ? Motion.instant : Motion.base,
         reverseTransitionDuration: reduced ? Motion.instant : Motion.quick,
         pageBuilder: (context, animation, secondary) => builder(context),
         transitionsBuilder: (context, animation, secondary, child) => reduced
             ? FadeTransition(opacity: animation, child: child)
             : SharedAxisTransition(
                 animation: animation,
                 secondaryAnimation: secondary,
                 transitionType: SharedAxisTransitionType.horizontal,
                 child: child,
               ),
       );
}

class DetailContainer extends StatelessWidget {
  const DetailContainer({super.key, required this.closed, required this.open});
  final Widget closed;
  final WidgetBuilder open;
  @override
  Widget build(BuildContext context) => OpenContainer(
    transitionDuration: Motion.duration(context, Motion.calm),
    transitionType: ContainerTransitionType.fadeThrough,
    closedElevation: 0,
    openElevation: 0,
    closedShape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    closedBuilder: (context, action) => closed,
    openBuilder: (context, action) => open(context),
  );
}
