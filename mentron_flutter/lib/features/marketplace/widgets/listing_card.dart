import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ListingCard — standard 2-column grid card for regular listings
// ─────────────────────────────────────────────────────────────────────────────

class ListingCard extends StatelessWidget {
  final MarketplaceListing listing;
  final VoidCallback onTap;

  const ListingCard({super.key, required this.listing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: MarketplaceTheme.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: MarketplaceTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image ───────────────────────────────────────────────────────
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: AspectRatio(
                aspectRatio: 1.1,
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
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Condition badge
                  MarketplaceTheme.conditionBadge(listing.condition.toDbString()),
                  const SizedBox(height: 6),

                  // Title
                  Text(
                    listing.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: MarketplaceTheme.heading(13, color: MarketplaceTheme.ink),
                  ),
                  const SizedBox(height: 8),

                  // Price pill + seller
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      MarketplaceTheme.pricePill(listing.formattedPrice),
                      if (listing.sellerAdmissionYear != null)
                        Text(
                          "'${listing.sellerAdmissionYear.toString().substring(2)}",
                          style: MarketplaceTheme.label(10),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      color: MarketplaceTheme.purpleSoft,
      child: const Center(
        child: Icon(Icons.image_outlined, color: Color(0xFF7B6EF6), size: 32),
      ),
    );
  }
}
