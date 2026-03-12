import 'package:flutter/material.dart';

/// Shared page transition utilities for smooth 60fps navigation.
/// All transitions are 250ms with hardware-accelerated curves.
class AppTransitions {
  AppTransitions._();

  static const Duration _duration = Duration(milliseconds: 250);
  static const Curve _curve = Curves.easeOutCubic;

  /// Fade + slide up transition (default for most screens)
  static PageRouteBuilder<T> slideUp<T>(Widget page) {
    return PageRouteBuilder<T>(
      transitionDuration: _duration,
      reverseTransitionDuration: _duration,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(parent: animation, curve: _curve);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.0, 0.06),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
    );
  }

  /// Pure fade transition (for modal-style screens)
  static PageRouteBuilder<T> fade<T>(Widget page) {
    return PageRouteBuilder<T>(
      transitionDuration: _duration,
      reverseTransitionDuration: _duration,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: _curve),
          child: child,
        );
      },
    );
  }

  /// Horizontal slide (for drill-down navigation)
  static PageRouteBuilder<T> slideLeft<T>(Widget page) {
    return PageRouteBuilder<T>(
      transitionDuration: _duration,
      reverseTransitionDuration: _duration,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(parent: animation, curve: _curve);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.08, 0.0),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
    );
  }
}
