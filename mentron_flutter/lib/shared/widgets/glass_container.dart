import 'package:flutter/material.dart';
import 'dart:ui';

/// Apple Liquid Glass — correct implementation per official guidelines.
///
/// KEY PRINCIPLE from Apple docs:
///   "Liquid Glass applies to the TOPMOST LAYER — nav/tab bars.
///    Avoid overusing — don't apply to every card.
///    Let CONTENT peek through from beneath the glass layer."
///
/// This widget provides the CONTENT-LAYER card treatment:
///   • Vibrancy tint (not a full blur — that's only for nav bars)
///   • Subtle specular highlight at top edge ("glass sheen")
///   • Concentric corner radii matching device hardware curves
///   • Legibility preserved — content is always readable
class GlassContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double blur; // only used when isNavElement: true
  final Color? color;
  final Gradient? gradient;
  final BoxBorder? border;

  /// Set true ONLY for nav-layer elements (bottom bar, app bar, sheet headers).
  /// Per Apple: "Apply Liquid Glass sparingly — limit to most important functional elements."
  final bool isNavElement;

  const GlassContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 24.0,
    this.blur = 20,
    this.color,
    this.gradient,
    this.border,
    this.isNavElement = false,
  });

  @override
  Widget build(BuildContext context) {
    final baseColor = color ?? Colors.white;

    if (isNavElement) {
      // FULL LIQUID GLASS — only for nav/tab bars per Apple guidelines
      return Container(
        width: width,
        height: height,
        margin: margin,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: padding,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withValues(alpha: 0.14),
                    Colors.white.withValues(alpha: 0.06),
                  ],
                ),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.18),
                  width: 0.8,
                ),
              ),
              child: Stack(
                children: [
                  // Apple-style specular — top highlight streak
                  Positioned(
                    top: 0, left: 0, right: 0,
                    child: Container(
                      height: borderRadius * 0.6,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(borderRadius),
                          topRight: Radius.circular(borderRadius),
                        ),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.centerRight,
                          colors: [
                            Colors.white.withValues(alpha: 0.22),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  child,
                ],
              ),
            ),
          ),
        ),
      );
    }

    // CONTENT-LAYER CARD — vibrancy tint, NO BackdropFilter
    // Per Apple: cards are in the content layer, not the Liquid Glass layer
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: gradient ??
            LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                baseColor.withValues(alpha: 0.11),
                baseColor.withValues(alpha: 0.05),
                baseColor.withValues(alpha: 0.02),
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
        border: border ??
            Border.all(
              color: Colors.white.withValues(alpha: 0.10),
              width: 0.8,
            ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7B2FFF).withValues(alpha: 0.06),
            blurRadius: 20,
            spreadRadius: 0.5,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Stack(
          children: [
            // Specular highlight — glass sheen
            Positioned(
              top: 0, left: 0, right: 0,
              child: Container(
                height: borderRadius * 0.7,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(borderRadius),
                    topRight: Radius.circular(borderRadius),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.white.withValues(alpha: 0.10),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Padding(padding: padding ?? EdgeInsets.zero, child: child),
          ],
        ),
      ),
    );
  }
}
