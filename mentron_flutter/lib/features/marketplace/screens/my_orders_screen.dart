import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_order.dart';
import '../../../services/marketplace_service.dart';
import '../widgets/order_status_stepper.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MyOrdersScreen — Buyer-facing order tracking
// ─────────────────────────────────────────────────────────────────────────────

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  late MarketplaceService _svc;
  List<MarketplaceOrder> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = MarketplaceService(client);
      _loadOrders();
    });
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final supa   = Provider.of<SupabaseService>(context, listen: false);
      final userId = supa.currentUser?.id;
      if (userId == null) return;
      final orders = await _svc.fetchMyOrders(userId);
      if (mounted) setState(() => _orders = orders);
    } catch (e) {
      debugPrint('[MyOrdersScreen] loadOrders error: $e');
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
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: Colors.white, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('MARKETPLACE',
                            style: GoogleFonts.inter(
                                fontSize: 9,
                                color: Colors.white70,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2)),
                        Text('My Orders',
                            style: MarketplaceTheme.heading(20,
                                color: Colors.white)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Orders list ─────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF7B6EF6)))
                : _orders.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        color: MarketplaceTheme.purple,
                        onRefresh: _loadOrders,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                          itemCount: _orders.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, i) {
                            final order = _orders[i];
                            return order.orderStatus.isTerminal
                                ? _TerminalOrderCard(order: order)
                                    .animate(delay: Duration(milliseconds: 50 * i))
                                    .fadeIn()
                                    .slideY(begin: 0.05)
                                : _ActiveOrderCard(order: order)
                                    .animate(delay: Duration(milliseconds: 50 * i))
                                    .fadeIn()
                                    .slideY(begin: 0.05);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              gradient: MarketplaceTheme.heroGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.receipt_long_outlined,
                color: Colors.white, size: 32),
          ),
          const SizedBox(height: 16),
          Text("No orders yet", style: MarketplaceTheme.heading(16)),
          const SizedBox(height: 8),
          Text("Items you buy will appear here",
              style: MarketplaceTheme.body_(13)),
        ],
      ),
    );
  }
}

// ── Active Order Card (with stepper) ──────────────────────────────────────────

class _ActiveOrderCard extends StatelessWidget {
  final MarketplaceOrder order;
  const _ActiveOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: MarketplaceTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              // Thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 52,
                  height: 52,
                  color: MarketplaceTheme.purpleSoft,
                  child: order.firstListingImage.isNotEmpty
                      ? Image.network(order.firstListingImage, fit: BoxFit.cover)
                      : const Icon(Icons.image_outlined,
                          color: Color(0xFF7B6EF6), size: 24),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.listingTitle ?? 'Item',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: MarketplaceTheme.heading(14),
                    ),
                    const SizedBox(height: 2),
                    MarketplaceTheme.pricePill(order.formattedPrice),
                  ],
                ),
              ),
            ],
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1, color: Color(0xFFF0EFF8)),
          ),

          // Stepper
          OrderStatusStepper(order: order),
        ],
      ),
    );
  }
}

// ── Terminal Order Card (collapsed) ──────────────────────────────────────────

class _TerminalOrderCard extends StatelessWidget {
  final MarketplaceOrder order;
  const _TerminalOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: MarketplaceTheme.cardShadow,
      ),
      child: Row(
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 44,
              height: 44,
              color: MarketplaceTheme.purpleSoft,
              child: order.firstListingImage.isNotEmpty
                  ? Image.network(order.firstListingImage, fit: BoxFit.cover)
                  : const Icon(Icons.image_outlined,
                      color: Color(0xFF7B6EF6), size: 20),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order.listingTitle ?? 'Item',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: MarketplaceTheme.heading(13),
                ),
                Text(order.formattedPrice,
                    style: MarketplaceTheme.body_(12)),
              ],
            ),
          ),
          // Status badge
          _terminalBadge(order.orderStatus),
        ],
      ),
    );
  }

  Widget _terminalBadge(OrderStatus status) {
    Color bg, fg;
    String label;
    switch (status) {
      case OrderStatus.delivered:
        bg = const Color(0xFFDCFCE7); fg = const Color(0xFF16A34A); label = 'Delivered';
        break;
      case OrderStatus.refunded:
        bg = MarketplaceTheme.purpleSoft; fg = MarketplaceTheme.purple; label = 'Refunded';
        break;
      default:
        bg = MarketplaceTheme.coralSoft; fg = MarketplaceTheme.coral; label = 'Cancelled';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(label,
          style: GoogleFonts.inter(
              fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}
