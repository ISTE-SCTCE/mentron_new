import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class GlassContainer extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final double blur;
  final Color? color;
  final Gradient? gradient;
  final BoxBorder? border;
  final bool isNavElement;

  const GlassContainer({
    super.key,
    required this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 22.0,
    this.blur = AppTheme.glassBlur,
    this.color,
    this.gradient,
    this.border,
    this.isNavElement = false,
  });

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius);
    final shadowColor = AppTheme.accentPrimary.withValues(alpha: isNavElement ? 0.10 : 0.06);

    final decoration = BoxDecoration(
      color: color ?? Colors.white,
      gradient: gradient,
      borderRadius: radius,
      border: border ?? Border.all(color: AppTheme.glassBorder, width: 1),
      boxShadow: [
        BoxShadow(
          color: shadowColor,
          blurRadius: isNavElement ? 20 : 16,
          offset: Offset(0, isNavElement ? 8 : 6),
        ),
      ],
    );

    final content = Container(
      width: width,
      height: height,
      margin: margin,
      decoration: decoration,
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          children: [
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                height: borderRadius * 0.55,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(borderRadius)),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.white.withValues(alpha: 0.70),
                      Colors.white.withValues(alpha: 0.0),
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

    if (!isNavElement) return content;

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: content,
      ),
    );
  }
}
