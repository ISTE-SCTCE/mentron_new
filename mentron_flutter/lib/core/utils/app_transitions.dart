import 'package:flutter/material.dart';

/// Consistent directional movement for drill-downs and a paper lift for overlays.
class AppTransitions {
  AppTransitions._();
  static PageRouteBuilder<T> _route<T>(
    Widget page,
    Offset offset, {
    bool scale = false,
    Duration duration = const Duration(milliseconds: 360),
  }) {
    return PageRouteBuilder<T>(
      opaque: false,
      transitionDuration: duration,
      reverseTransitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        if (MediaQuery.disableAnimationsOf(context)) return child;
        final progress = animation.drive(
          CurveTween(curve: Curves.easeOutCubic),
        );
        return FadeTransition(
          opacity: progress,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: offset,
              end: Offset.zero,
            ).animate(progress),
            child: scale
                ? ScaleTransition(
                    scale: Tween<double>(begin: .97, end: 1).animate(progress),
                    child: child,
                  )
                : child,
          ),
        );
      },
    );
  }

  static PageRouteBuilder<T> slideUp<T>(Widget page) =>
      _route(page, const Offset(0, .045));
  static PageRouteBuilder<T> slideLeft<T>(Widget page) =>
      _route(page, const Offset(.06, 0));
  static PageRouteBuilder<T> slideRight<T>(Widget page) =>
      _route(page, const Offset(-.06, 0));
  static PageRouteBuilder<T> fade<T>(Widget page) => _route(page, Offset.zero);
  static PageRouteBuilder<T> scaleFade<T>(
    Widget page, {
    Duration duration = const Duration(milliseconds: 280),
  }) => _route(page, const Offset(0, .02), scale: true, duration: duration);
}
