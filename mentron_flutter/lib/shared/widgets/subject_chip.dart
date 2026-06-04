import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// A horizontally scrollable subject chip for filtering courses.
class SubjectChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final int colorIndex;

  const SubjectChip({
    super.key,
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.colorIndex = 0,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isSelected
        ? AppTheme.accentPrimary
        : AppTheme.chipColors[colorIndex % AppTheme.chipColors.length];
    final textColor = isSelected
        ? Colors.white
        : AppTheme.chipTextColors[colorIndex % AppTheme.chipTextColors.length];

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(50),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.accentPrimary.withValues(alpha: 0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            height: 1,
          ),
        ),
      ),
    );
  }
}
