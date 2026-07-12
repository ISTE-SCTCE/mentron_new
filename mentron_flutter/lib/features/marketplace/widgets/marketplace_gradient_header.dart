import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/marketplace_theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceGradientHeader
// Full-bleed gradient hero banner used at the top of the Marketplace home screen.
// Contains: eyebrow label, title, "+" upload button, decorative blob, search bar.
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceGradientHeader extends StatelessWidget {
  final VoidCallback onUploadTap;
  final ValueChanged<String> onSearchChanged;

  const MarketplaceGradientHeader({
    super.key,
    required this.onUploadTap,
    required this.onSearchChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: MarketplaceTheme.heroGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Stack(
        children: [
          // ── Decorative blob (top-right) ──────────────────────────────────
          Positioned(
            top: -24,
            right: -32,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.08),
              ),
            ),
          ),
          Positioned(
            top: 24,
            right: 12,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.06),
              ),
            ),
          ),

          // ── Content ──────────────────────────────────────────────────────
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top row: eyebrow + upload button
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Eyebrow + title
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'MENTRON',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.white.withOpacity(0.7),
                                letterSpacing: 3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Marketplace',
                              style: MarketplaceTheme.heading(28, color: Colors.white),
                            ),
                          ],
                        ),
                      ),

                      // "+" circular button
                      GestureDetector(
                        onTap: onUploadTap,
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.2),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.4),
                              width: 1.5,
                            ),
                          ),
                          child: const Icon(
                            Icons.add_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Search bar (solid white pill)
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: TextField(
                      onChanged: onSearchChanged,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: MarketplaceTheme.ink,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search textbooks, parts...',
                        hintStyle: GoogleFonts.inter(
                          fontSize: 14,
                          color: MarketplaceTheme.body,
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          color: MarketplaceTheme.body,
                          size: 20,
                        ),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
