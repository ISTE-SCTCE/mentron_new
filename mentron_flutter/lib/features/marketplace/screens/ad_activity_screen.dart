import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../models/marketplace_listing_view.dart';
import '../../../services/marketplace_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// AdActivityScreen — Per-listing analytics (seller-facing)
// Shows Total Views, Unique Visitors, Interested count, and Recent Visitors list.
// ─────────────────────────────────────────────────────────────────────────────

class AdActivityScreen extends StatefulWidget {
  final MarketplaceListing listing;

  const AdActivityScreen({super.key, required this.listing});

  @override
  State<AdActivityScreen> createState() => _AdActivityScreenState();
}

class _AdActivityScreenState extends State<AdActivityScreen> {
  late MarketplaceService _svc;
  List<MarketplaceListingView> _views = [];
  bool _isLoading = true;

  int get _totalViews      => _views.length;
  int get _uniqueVisitors  => _views.map((v) => v.viewerId).toSet().length;
  // "Interested" = viewers who opened the listing more than once
  int get _interested {
    final counts = <String, int>{};
    for (final v in _views) {
      counts[v.viewerId] = (counts[v.viewerId] ?? 0) + 1;
    }
    return counts.values.where((c) => c > 1).length;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = MarketplaceService(client);
      _loadViews();
    });
  }

  Future<void> _loadViews() async {
    setState(() => _isLoading = true);
    try {
      final views = await _svc.fetchListingViews(widget.listing.id);
      if (mounted) setState(() => _views = views);
    } catch (e) {
      debugPrint('[AdActivityScreen] loadViews error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MarketplaceTheme.background,
      body: Column(
        children: [
          // ── Gradient header ─────────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: MarketplaceTheme.heroGradient,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded,
                              color: Colors.white, size: 18),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('AD ACTIVITY',
                                style: GoogleFonts.inter(
                                    fontSize: 9,
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 2)),
                            Text("Who's looking?",
                                style: MarketplaceTheme.heading(18,
                                    color: Colors.white)),
                          ],
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 16),
                      child: Text(
                        widget.listing.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: Colors.white70,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: Color(0xFF7B6EF6)))
                : RefreshIndicator(
                    color: MarketplaceTheme.purple,
                    onRefresh: _loadViews,
                    child: ListView(
                      padding:
                          const EdgeInsets.fromLTRB(20, 20, 20, 100),
                      children: [
                        // ── Stat cards row ─────────────────────────────
                        Row(
                          children: [
                            Expanded(
                              child: MarketplaceTheme.statCard(
                                label: 'Total Views',
                                value: '$_totalViews',
                                type: 'purple',
                                icon: Icons.visibility_outlined,
                              ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: MarketplaceTheme.statCard(
                                label: 'Unique Visitors',
                                value: '$_uniqueVisitors',
                                type: 'coral',
                                icon: Icons.people_outline_rounded,
                              ).animate(delay: 80.ms).fadeIn(duration: 400.ms).slideY(begin: 0.1),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: MarketplaceTheme.statCard(
                                label: 'Interested',
                                value: '$_interested',
                                type: 'ink',
                                icon: Icons.star_outline_rounded,
                              ).animate(delay: 160.ms).fadeIn(duration: 400.ms).slideY(begin: 0.1),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // ── Recent Visitors ────────────────────────────
                        Text('Recent Visitors',
                            style: MarketplaceTheme.heading(16)),
                        const SizedBox(height: 12),

                        if (_views.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 32),
                              child: Column(
                                children: [
                                  Icon(Icons.remove_red_eye_outlined,
                                      color: MarketplaceTheme.body,
                                      size: 40),
                                  const SizedBox(height: 12),
                                  Text('No views yet',
                                      style: MarketplaceTheme.body_(14)),
                                  Text('Share your listing to attract buyers!',
                                      style: MarketplaceTheme.body_(12)),
                                ],
                              ),
                            ),
                          )
                        else
                          ..._views.asMap().entries.map((entry) {
                            final i    = entry.key;
                            final view = entry.value;
                            return _VisitorRow(view: view)
                                .animate(
                                    delay: Duration(milliseconds: 40 * i))
                                .fadeIn()
                                .slideX(begin: 0.05);
                          }),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── Visitor Row ───────────────────────────────────────────────────────────────

class _VisitorRow extends StatelessWidget {
  final MarketplaceListingView view;
  const _VisitorRow({required this.view});

  @override
  Widget build(BuildContext context) {
    final name  = view.viewerName ?? 'Anonymous';
    final batch = view.viewerAdmissionYear != null
        ? "'${view.viewerAdmissionYear.toString().substring(2)}"
        : null;
    final dept  = view.viewerDepartment;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: MarketplaceTheme.cardShadow,
      ),
      child: Row(
        children: [
          // Avatar initials
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              gradient: MarketplaceTheme.heroGradient,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: GoogleFonts.baloo2(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: MarketplaceTheme.heading(14)),
                if (dept != null || batch != null)
                  Text(
                    [dept, batch].whereType<String>().join(' · '),
                    style: MarketplaceTheme.body_(11),
                  ),
              ],
            ),
          ),
          Text(
            view.relativeTime,
            style: MarketplaceTheme.body_(11),
          ),
        ],
      ),
    );
  }
}
