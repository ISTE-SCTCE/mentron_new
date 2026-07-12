import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';

// ─────────────────────────────────────────────────────────────────────────────
// CategoryChipBar — horizontal scrollable filter chips.
// Unselected = white pill with shadow; selected = purple→coral gradient fill.
// ─────────────────────────────────────────────────────────────────────────────

class CategoryChipBar extends StatelessWidget {
  final ListingCategory? selected;
  final ValueChanged<ListingCategory?> onSelected;

  const CategoryChipBar({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  static const _categories = [
    null, // "All"
    ListingCategory.textbook,
    ListingCategory.electronics,
    ListingCategory.projectComponents,
    ListingCategory.stationery,
    ListingCategory.other,
  ];

  static const _labels = [
    'All',
    'Textbooks',
    'Electronics',
    'Project Parts',
    'Stationery',
    'Other',
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final cat = _categories[i];
          final label = _labels[i];
          final isSelected = selected == cat;

          return GestureDetector(
            onTap: () => onSelected(cat),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected ? MarketplaceTheme.heroGradient : null,
                color: isSelected ? null : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: isSelected
                        ? MarketplaceTheme.purple.withOpacity(0.25)
                        : Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : MarketplaceTheme.body,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
