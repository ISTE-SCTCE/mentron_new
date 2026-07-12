import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../services/marketplace_service.dart';
import '../widgets/marketplace_gradient_header.dart';
import '../widgets/category_chip_bar.dart';
import '../widgets/listing_card.dart';
import '../widgets/featured_listing_card.dart';
import '../widgets/listing_bottom_sheet.dart';
import 'add_marketplace_item_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceScreen — Home Feed
// Gradient hero header, category chip bar, bento grid (featured + 2-col grid).
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  late MarketplaceService _svc;

  List<MarketplaceListing> _listings = [];
  bool _isLoading = true;
  ListingCategory? _selectedCategory;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = MarketplaceService(client);
      _loadListings();
    });
  }

  Future<void> _loadListings() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final results = await _svc.fetchLiveListings(category: _selectedCategory);
      if (mounted) setState(() => _listings = results);
    } catch (e) {
      debugPrint('[MarketplaceScreen] loadListings error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<MarketplaceListing> get _filtered {
    if (_searchQuery.isEmpty) return _listings;
    final q = _searchQuery.toLowerCase();
    return _listings
        .where((l) =>
            l.title.toLowerCase().contains(q) ||
            l.description.toLowerCase().contains(q))
        .toList();
  }

  /// Open the listing in a Blinkit-style draggable bottom sheet.
  /// This replaces the previous full Navigator.push approach so the user
  /// stays in context of the grid and can swipe-down to dismiss.
  void _openDetail(MarketplaceListing listing) {
    showListingBottomSheet(context, listing);
  }

  void _openUpload() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const AddMarketplaceItemScreen()),
    ).then((_) => _loadListings());
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final featured  = filtered.isNotEmpty ? filtered.first : null;
    final rest       = filtered.length > 1 ? filtered.sublist(1) : <MarketplaceListing>[];

    return Scaffold(
      backgroundColor: MarketplaceTheme.background,
      body: RefreshIndicator(
        color: MarketplaceTheme.purple,
        onRefresh: _loadListings,
        child: CustomScrollView(
          slivers: [
            // ── Gradient hero header ─────────────────────────────────────
            SliverToBoxAdapter(
              child: MarketplaceGradientHeader(
                onUploadTap: _openUpload,
                onSearchChanged: (q) => setState(() => _searchQuery = q),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // ── Category chips ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: CategoryChipBar(
                selected: _selectedCategory,
                onSelected: (cat) {
                  setState(() => _selectedCategory = cat);
                  _loadListings();
                },
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // ── Section label ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Fresh Listings',
                  style: MarketplaceTheme.heading(18),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: Color(0xFF7B6EF6)),
                ),
              )
            else if (filtered.isEmpty)
              SliverFillRemaining(child: _buildEmptyState())
            else ...[
              // ── Featured card ──────────────────────────────────────────
              if (featured != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: FeaturedListingCard(
                      listing: featured,
                      onTap: () => _openDetail(featured),
                    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // ── 2-column grid ──────────────────────────────────────────
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => ListingCard(
                      listing: rest[i],
                      onTap: () => _openDetail(rest[i]),
                    )
                        .animate(delay: Duration(milliseconds: 60 * i))
                        .fadeIn(duration: 300.ms)
                        .slideY(begin: 0.1),
                    childCount: rest.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: MarketplaceTheme.heroGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shopping_bag_outlined,
                color: Colors.white, size: 36),
          ),
          const SizedBox(height: 20),
          Text('No listings yet', style: MarketplaceTheme.heading(18)),
          const SizedBox(height: 8),
          Text(
            'Be the first to list something!',
            style: MarketplaceTheme.body_(14),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: _openUpload,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                gradient: MarketplaceTheme.heroGradient,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Sell Something',
                style: MarketplaceTheme.heading(14, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
