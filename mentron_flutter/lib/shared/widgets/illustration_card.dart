import 'package:flutter/material.dart';

/// A large course/feature card with a gradient background and illustration image.
class IllustrationCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? imagePath;
  final Gradient gradient;
  final VoidCallback? onTap;
  final String? buttonLabel;
  final Widget? customIllustration;

  const IllustrationCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.imagePath,
    required this.gradient,
    this.onTap,
    this.buttonLabel,
    this.customIllustration,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 200,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: (gradient as LinearGradient).colors.last.withValues(alpha: 0.3),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Decorative circles
            Positioned(
              right: -20,
              top: -20,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              right: 40,
              bottom: -30,
              child: Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(22),
              child: Row(
                children: [
                  // Text side
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.82),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 16),
                        if (buttonLabel != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.play_arrow_rounded,
                                  color: (gradient as LinearGradient).colors.last,
                                  size: 16,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  buttonLabel!,
                                  style: TextStyle(
                                    color: (gradient as LinearGradient).colors.last,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Illustration side
                  Expanded(
                    flex: 2,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: customIllustration ??
                          (imagePath != null
                              ? Image.asset(
                                  imagePath!,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, e, s) =>
                                      _FallbackIllustration(
                                        color: Colors.white.withValues(
                                          alpha: 0.3,
                                        ),
                                      ),
                                )
                              : _FallbackIllustration(
                                  color: Colors.white.withValues(alpha: 0.3),
                                )),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FallbackIllustration extends StatelessWidget {
  final Color color;
  const _FallbackIllustration({required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Icon(
          Icons.school_rounded,
          color: Colors.white.withValues(alpha: 0.6),
          size: 48,
        ),
      ),
    );
  }
}
