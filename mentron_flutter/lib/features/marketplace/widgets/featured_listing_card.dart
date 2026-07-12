import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';

// ─────────────────────────────────────────────────────────────────────────────
// FeaturedListingCard — full-width dark bento card for the featured listing.
// Dark ink background (#2C2A45), image on the left (~42%), info on the right.
// ─────────────────────────────────────────────────────────────────────────────

class FeaturedListingCard extends StatelessWidget {
  final MarketplaceListing listing;
  final VoidCallback onTap;

  const FeaturedListingCard({super.key, required this.listing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          color: MarketplaceTheme.ink,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: MarketplaceTheme.ink.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // ── Image (~42%) ─────────────────────────────────────────────────
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(24)),
              child: SizedBox(
                width: MediaQuery.of(context).size.width * 0.42 - 24,
                height: 160,
                child: listing.firstImageUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: listing.firstImageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => _imagePlaceholder(),
                        errorWidget: (_, __, ___) => _imagePlaceholder(),
                      )
                    : _imagePlaceholder(),
              ),
            ),

            // ── Info ─────────────────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // "FEATURED" label
                    Text(
                      'FEATURED',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: MarketplaceTheme.coral,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Title
                    Text(
                      listing.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: MarketplaceTheme.heading(15, color: Colors.white),
                    ),
                    const SizedBox(height: 4),

                    // Condition badge
                    MarketplaceTheme.conditionBadge(listing.condition.toDbString()),
                    const Spacer(),

                    // Price pill
                    MarketplaceTheme.pricePill(listing.formattedPrice, fontSize: 13),

                    if (listing.sellerName != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.person_outline_rounded,
                              color: Color(0xFF8D8AA0), size: 12),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              listing.sellerName!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: MarketplaceTheme.label(10,
                                  color: const Color(0xFF8D8AA0)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      color: Colors.white.withOpacity(0.08),
      child: const Center(
        child: Icon(Icons.image_outlined, color: Colors.white38, size: 40),
      ),
    );
  }
}
