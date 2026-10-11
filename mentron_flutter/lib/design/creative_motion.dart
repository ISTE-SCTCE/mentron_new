import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;

/// A short paper-like entrance. Reduced motion always renders the final state.
class CreativeEntrance extends StatelessWidget {
  const CreativeEntrance({super.key, required this.child, this.distance = 18});
  final Widget child;
  final double distance;
  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return child;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 480),
      curve: Curves.easeOutCubic,
      child: child,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, distance * (1 - value)),
          child: child,
        ),
      ),
    );
  }
}

class CreativePageTransitions extends PageTransitionsBuilder {
  const CreativePageTransitions();
  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Preserve native interactive back gestures on Apple platforms.
    if (Theme.of(context).platform == TargetPlatform.iOS ||
        Theme.of(context).platform == TargetPlatform.macOS) {
      return const CupertinoPageTransitionsBuilder().buildTransitions(
        route,
        context,
        animation,
        secondaryAnimation,
        child,
      );
    }
    return creativeRouteTransition(
      context,
      animation,
      secondaryAnimation,
      child,
    );
  }
}

Widget creativeRouteTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  if (MediaQuery.disableAnimationsOf(context)) return child;
  final progress = animation.drive(CurveTween(curve: Curves.easeOutCubic));
  return FadeTransition(
    opacity: progress,
    child: SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(.035, .018),
        end: Offset.zero,
      ).animate(progress),
      child: child,
    ),
  );
}

const creativePageTransitions = PageTransitionsTheme(
  builders: {
    TargetPlatform.android: CreativePageTransitions(),
    TargetPlatform.iOS: CreativePageTransitions(),
    TargetPlatform.macOS: CreativePageTransitions(),
    TargetPlatform.windows: CreativePageTransitions(),
    TargetPlatform.linux: CreativePageTransitions(),
  },
);
