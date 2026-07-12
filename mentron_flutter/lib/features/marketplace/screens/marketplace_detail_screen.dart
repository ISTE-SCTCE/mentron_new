import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../services/marketplace_service.dart';
import '../widgets/disclaimer_consent_sheet.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceDetailScreen — Product Detail Page
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceDetailScreen extends StatefulWidget {
  final MarketplaceListing listing;

  const MarketplaceDetailScreen({super.key, required this.listing});

  @override
  State<MarketplaceDetailScreen> createState() => _MarketplaceDetailScreenState();
}

class _MarketplaceDetailScreenState extends State<MarketplaceDetailScreen> {
  int _imageIndex = 0;

  @override
  void initState() {
    super.initState();
    // Log view (non-blocking; RLS + dedup handled server-side)
    WidgetsBinding.instance.addPostFrameCallback((_) => _logView());
  }

  Future<void> _logView() async {
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final user = supa.currentUser;
      if (user == null) return;
      // Don't log seller viewing their own listing
      if (user.id == widget.listing.sellerId) return;
      final svc = MarketplaceService(supa.client);
      await svc.logView(widget.listing.id, user.id);
    } catch (_) {}
  }

  void _openBuySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true, // ensures sheet appears above nested Navigators
      backgroundColor: Colors.transparent,
      builder: (_) => DisclaimerConsentSheet(
        listingId:    widget.listing.id,
        listingTitle: widget.listing.title,
        price:        widget.listing.price,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final images  = listing.images;

    return Scaffold(
      backgroundColor: MarketplaceTheme.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // ── Gradient hero with image ────────────────────────────────
              SliverToBoxAdapter(child: _buildHero(images)),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badges row
                      Wrap(
                        spacing: 8,
                        children: [
                          MarketplaceTheme.conditionBadge(
                              listing.condition.toDbString()),
                          MarketplaceTheme.categoryBadge(
                              listing.category.toDbString()),
                        ],
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 12),

                      // Title
                      Text(
                        listing.title,
                        style: MarketplaceTheme.heading(22),
                      ).animate().fadeIn(delay: 250.ms),
                      const SizedBox(height: 16),

                      // Description
                      if (listing.description.isNotEmpty) ...[
                        Text('About this item',
                            style: MarketplaceTheme.heading(14,
                                color: MarketplaceTheme.body)),
                        const SizedBox(height: 8),
                        Text(
                          listing.description,
                          style: MarketplaceTheme.body_(14),
                        ).animate().fadeIn(delay: 300.ms),
                        const SizedBox(height: 20),
                      ],

                      // Seller row
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: MarketplaceTheme.cardShadow,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                gradient: MarketplaceTheme.heroGradient,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.person_rounded,
                                  color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    listing.sellerName ?? 'Seller',
                                    style: MarketplaceTheme.heading(14),
                                  ),
                                  if (listing.sellerDepartment != null ||
                                      listing.sellerAdmissionYear != null)
                                    Text(
                                      [
                                        listing.sellerDepartment,
                                        if (listing.sellerAdmissionYear != null)
                                          "'${listing.sellerAdmissionYear.toString().substring(2)}",
                                      ].whereType<String>().join(' · '),
                                      style: MarketplaceTheme.body_(12),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 350.ms),

                      // Space for the fixed Buy Now button
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Back button ────────────────────────────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.25),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white, size: 16),
              ),
            ),
          ),

          // ── Fixed "Buy Now" button ─────────────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                20, 12, 20,
                MediaQuery.of(context).padding.bottom + 12,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: GestureDetector(
                onTap: _openBuySheet,
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: MarketplaceTheme.heroGradient,
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: [
                      BoxShadow(
                        color: MarketplaceTheme.purple.withOpacity(0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      'Buy Now  ·  ${listing.formattedPrice}',
                      style: GoogleFonts.baloo2(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Gradient hero with floating price card ─────────────────────────────────

  Widget _buildHero(List<String> images) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Gradient background + image
        Container(
          height: 320,
          decoration: const BoxDecoration(
            gradient: MarketplaceTheme.heroGradient,
            borderRadius:
                BorderRadius.vertical(bottom: Radius.circular(32)),
          ),
          child: images.isNotEmpty
              ? PageView.builder(
                  itemCount: images.length,
                  onPageChanged: (i) => setState(() => _imageIndex = i),
                  itemBuilder: (_, i) => ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        bottom: Radius.circular(32)),
                    child: CachedNetworkImage(
                      imageUrl: images[i],
                      fit: BoxFit.contain,
                      placeholder: (_, __) => const Center(
                        child: CircularProgressIndicator(
                            color: Colors.white54),
                      ),
                    ),
                  ),
                )
              : const Center(
                  child: Icon(Icons.image_outlined,
                      color: Colors.white38, size: 80),
                ),
        ),

        // Dots indicator
        if (images.length > 1)
          Positioned(
            bottom: 28,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(images.length, (i) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _imageIndex == i ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _imageIndex == i
                        ? Colors.white
                        : Colors.white38,
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),

        // Floating price card — overlaps bottom of hero by ~20px
        Positioned(
          bottom: -20,
          right: 20,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: MarketplaceTheme.purple.withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Text(
              widget.listing.formattedPrice,
              style: MarketplaceTheme.price(20,
                  color: MarketplaceTheme.purple),
            ),
          ),
        ),
      ],
    );
  }
}
