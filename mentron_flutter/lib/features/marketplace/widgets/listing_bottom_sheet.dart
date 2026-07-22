import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../services/marketplace_service.dart';
import 'disclaimer_consent_sheet.dart';
import 'full_screen_image_viewer.dart';

// ─────────────────────────────────────────────────────────────────────────────
// showListingBottomSheet — entry point
//
// Call this instead of Navigator.push(MarketplaceDetailScreen) to open a
// Blinkit/Zepto-style draggable product sheet that slides up over the grid.
// ─────────────────────────────────────────────────────────────────────────────

void showListingBottomSheet(BuildContext context, MarketplaceListing listing) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withOpacity(0.45),
    builder: (_) => ListingBottomSheet(listing: listing),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ListingBottomSheet
// ─────────────────────────────────────────────────────────────────────────────

class ListingBottomSheet extends StatefulWidget {
  final MarketplaceListing listing;

  const ListingBottomSheet({super.key, required this.listing});

  @override
  State<ListingBottomSheet> createState() => _ListingBottomSheetState();
}

class _ListingBottomSheetState extends State<ListingBottomSheet> {
  int _imageIndex = 0;
  final PageController _pageController = PageController();
  bool _isExecOrSeller = false;
  bool _isDeleting = false;

  @override
  void initState() {
    super.initState();
    // Log view (non-blocking)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _logView();
      _checkDeletePermission();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _checkDeletePermission() async {
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final user = supa.currentUser;
      if (user == null) return;

      if (user.id == widget.listing.sellerId) {
        if (mounted) setState(() => _isExecOrSeller = true);
        return;
      }

      final res = await supa.client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

      if (res != null) {
        final role = res['role'] as String?;
        if (role == 'exec' || role == 'core' || role == 'admin') {
          if (mounted) setState(() => _isExecOrSeller = true);
        }
      }
    } catch (_) {}
  }

  Future<void> _deleteListing() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Listing?', style: MarketplaceTheme.heading(18)),
        content: Text('Are you sure you want to delete this listing permanently? This cannot be undone.', style: MarketplaceTheme.body_(14)),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: MarketplaceTheme.label(14, color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete', style: MarketplaceTheme.label(14, color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isDeleting = true);
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final svc = MarketplaceService(supa.client);
      await svc.deleteListing(widget.listing.id);
      
      if (mounted) {
        Navigator.pop(context); // Close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Listing deleted successfully.'), behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDeleting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _logView() async {
    try {
      final supa = Provider.of<SupabaseService>(context, listen: false);
      final user = supa.currentUser;
      if (user == null) return;
      if (user.id == widget.listing.sellerId) return;
      final svc = MarketplaceService(supa.client);
      await svc.logView(widget.listing.id, user.id);
    } catch (_) {}
  }

  void _openBuySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DisclaimerConsentSheet(
        listingId: widget.listing.id,
        listingTitle: widget.listing.title,
        price: widget.listing.price,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final images = listing.images;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.45,
      maxChildSize: 0.97,
      snap: true,
      snapSizes: const [0.72, 0.97],
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              // ── Drag handle ──────────────────────────────────────────────
              _DragHandle(),

              // ── Scrollable body ──────────────────────────────────────────
              Expanded(
                child: CustomScrollView(
                  controller: scrollController,
                  physics: const BouncingScrollPhysics(),
                  slivers: [
                    // Image carousel
                    SliverToBoxAdapter(child: _buildCarousel(images)),

                    // Content
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Badges
                            Wrap(
                              spacing: 8,
                              children: [
                                MarketplaceTheme.conditionBadge(
                                    listing.condition.toDbString()),
                                MarketplaceTheme.categoryBadge(
                                    listing.category.toDbString()),
                              ],
                            ).animate().fadeIn(delay: 80.ms),
                            const SizedBox(height: 12),

                            // Title
                            Text(
                              listing.title,
                              style: MarketplaceTheme.heading(22),
                            ).animate().fadeIn(delay: 100.ms),
                            const SizedBox(height: 6),

                            // Price below title (secondary)
                            Text(
                              listing.formattedPrice,
                              style: MarketplaceTheme.price(20,
                                  color: MarketplaceTheme.purple),
                            ).animate().fadeIn(delay: 120.ms),
                            const SizedBox(height: 20),

                            // Description
                            if (listing.description.isNotEmpty) ...[
                              Text('About this item',
                                  style: MarketplaceTheme.heading(14,
                                      color: MarketplaceTheme.body)),
                              const SizedBox(height: 6),
                              Text(
                                listing.description,
                                style: MarketplaceTheme.body_(14),
                              ).animate().fadeIn(delay: 150.ms),
                              const SizedBox(height: 20),
                            ],

                            // Seller card
                            _buildSellerCard(listing),
                            if (_isExecOrSeller) ...[
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _isDeleting ? null : _deleteListing,
                                  icon: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent),
                                  label: Text(
                                    _isDeleting ? 'Deleting...' : 'Delete Listing',
                                    style: MarketplaceTheme.heading(14, color: Colors.redAccent),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red.withOpacity(0.08),
                                    side: BorderSide(color: Colors.red.withOpacity(0.2)),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    elevation: 0,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                          ],
                        ),
                      ),
                    ),

                    // Bottom spacer so sticky bar doesn't cover last content
                    const SliverToBoxAdapter(child: SizedBox(height: 96)),
                  ],
                ),
              ),

              // ── Sticky bottom bar ────────────────────────────────────────
              _buildStickyBar(listing, bottomPad),
            ],
          ),
        );
      },
    );
  }

  // ── Image carousel with dots ───────────────────────────────────────────────

  Widget _buildCarousel(List<String> images) {
    return SizedBox(
      height: 260,
      child: Stack(
        children: [
          // Gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: MarketplaceTheme.heroGradient,
            ),
          ),

          // Page view
          if (images.isNotEmpty)
            PageView.builder(
              controller: _pageController,
              itemCount: images.length,
              onPageChanged: (i) => setState(() => _imageIndex = i),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => FullScreenImageViewer(
                        images: images,
                        initialIndex: i,
                      ),
                    ),
                  );
                },
                child: CachedNetworkImage(
                  imageUrl: images[i],
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                    child:
                        CircularProgressIndicator(color: Colors.white54),
                  ),
                  errorWidget: (_, __, ___) => const Center(
                    child: Icon(Icons.image_outlined,
                        color: Colors.white38, size: 60),
                  ),
                ),
              ),
            )
          else
            const Center(
              child: Icon(Icons.image_outlined,
                  color: Colors.white38, size: 80),
            ),

          // Dot indicators
          if (images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (i) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: _imageIndex == i ? 20 : 6,
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
        ],
      ),
    );
  }

  // ── Seller card ────────────────────────────────────────────────────────────

  Widget _buildSellerCard(MarketplaceListing listing) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: MarketplaceTheme.background,
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
    ).animate().fadeIn(delay: 200.ms);
  }

  // ── Sticky buy bar ─────────────────────────────────────────────────────────

  Widget _buildStickyBar(MarketplaceListing listing, double bottomPad) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, bottomPad + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Price pill
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: MarketplaceTheme.purpleSoft,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              listing.formattedPrice,
              style: MarketplaceTheme.price(17,
                  color: MarketplaceTheme.purple),
            ),
          ),
          const SizedBox(width: 12),

          // Buy Now button (expands to fill remaining space)
          Expanded(
            child: GestureDetector(
              onTap: _openBuySheet,
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  gradient: MarketplaceTheme.heroGradient,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: MarketplaceTheme.purple.withOpacity(0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    'Buy Now',
                    style: GoogleFonts.baloo2(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// _DragHandle — the little pill at the top of the sheet
// ─────────────────────────────────────────────────────────────────────────────

class _DragHandle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 4),
      child: Center(
        child: Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: const Color(0xFFDDDAF0),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ),
    );
  }
}
