import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../models/marketplace_order.dart';
import '../../../services/marketplace_service.dart';
import '../../../shared/widgets/exec_glass_container.dart';
import '../../../shared/widgets/exec_liquid_background.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PaymentManagementScreen — EXECOM-only marketplace management.
// 4 tabs: Pending Payments | Pending Listings | Active Deliveries | Payment Settings
// ─────────────────────────────────────────────────────────────────────────────

class PaymentManagementScreen extends StatefulWidget {
  const PaymentManagementScreen({super.key});

  @override
  State<PaymentManagementScreen> createState() => _PaymentManagementScreenState();
}

class _PaymentManagementScreenState extends State<PaymentManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late MarketplaceService _svc;

  // ── Tab state ──────────────────────────────────────────────────────────────
  List<MarketplaceOrder>  _pendingOrders  = [];
  List<MarketplaceListing> _pendingListings = [];
  List<MarketplaceOrder>  _deliveries     = [];

  bool _loadingOrders   = false;
  bool _loadingListings = false;
  bool _loadingDeliveries = false;

  // Realtime stream subscription for pending orders (Tab 0)
  StreamSubscription<List<MarketplaceOrder>>? _ordersSubscription;
  StreamSubscription<List<MarketplaceListing>>? _listingsSubscription;

  // ── Payment Settings tab state ─────────────────────────────────────────────
  String? _qrUrl;
  String? _upiId;
  bool _loadingSettings = false;
  bool _savingSettings  = false;
  final _upiCtrl = TextEditingController();
  File? _newQrFile;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = MarketplaceService(client);
      _subscribeToOrders(); // Realtime stream instead of one-shot fetch
      _subscribeToListings(); // Realtime stream for listings
    });
  }

  void _onTabChanged() {
    switch (_tabController.index) {
      case 0: break;
      case 1: if (_pendingListings.isEmpty) _loadPendingListings(); break;
      case 2: if (_deliveries.isEmpty)     _loadDeliveries();       break;
      case 3: if (_qrUrl == null)          _loadSettings();          break;
    }
  }

  @override
  void dispose() {
    _ordersSubscription?.cancel();
    _listingsSubscription?.cancel();
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _upiCtrl.dispose();
    super.dispose();
  }

  // ── Data loaders ───────────────────────────────────────────────────────────

  /// Subscribe to the Supabase Realtime stream for pending orders.
  /// New buyer submissions appear instantly without manual refresh.
  void _subscribeToOrders() {
    setState(() => _loadingOrders = true);
    _ordersSubscription = _svc.streamPendingOrders().listen(
      (orders) {
        if (mounted) {
          setState(() {
            _pendingOrders = orders;
            _loadingOrders = false;
          });
        }
      },
      onError: (Object e) {
        debugPrint('[PayMgmt] streamPendingOrders error: $e');
        if (mounted) setState(() => _loadingOrders = false);
      },
    );
  }

  /// Subscribe to the Supabase Realtime stream for pending listings.
  void _subscribeToListings() {
    setState(() => _loadingListings = true);
    _listingsSubscription = _svc.streamPendingListings().listen(
      (listings) {
        if (mounted) {
          setState(() {
            _pendingListings = listings;
            _loadingListings = false;
          });
        }
      },
      onError: (Object e) {
        debugPrint('[PayMgmt] streamPendingListings error: $e');
        if (mounted) setState(() => _loadingListings = false);
      },
    );
  }

  Future<void> _loadPendingOrders() async {
    setState(() => _loadingOrders = true);
    try {
      final results = await _svc.fetchPendingOrders();
      if (mounted) setState(() => _pendingOrders = results);
    } catch (e) { debugPrint('[PayMgmt] pendingOrders error: $e'); }
    finally { if (mounted) setState(() => _loadingOrders = false); }
  }

  Future<void> _loadPendingListings() async {
    setState(() => _loadingListings = true);
    try {
      final results = await _svc.fetchPendingListings();
      if (mounted) setState(() => _pendingListings = results);
    } catch (e) { debugPrint('[PayMgmt] pendingListings error: $e'); }
    finally { if (mounted) setState(() => _loadingListings = false); }
  }

  Future<void> _loadDeliveries() async {
    setState(() => _loadingDeliveries = true);
    try {
      final results = await _svc.fetchActiveDeliveries();
      if (mounted) setState(() => _deliveries = results);
    } catch (e) { debugPrint('[PayMgmt] deliveries error: $e'); }
    finally { if (mounted) setState(() => _loadingDeliveries = false); }
  }

  Future<void> _loadSettings() async {
    setState(() => _loadingSettings = true);
    try {
      final settings = await _svc.fetchPaymentSettings();
      if (mounted) {
        setState(() {
          _qrUrl = settings['qr_image_url'];
          _upiId = settings['upi_id'];
          _upiCtrl.text = _upiId ?? '';
        });
      }
    } catch (e) { debugPrint('[PayMgmt] loadSettings error: $e'); }
    finally { if (mounted) setState(() => _loadingSettings = false); }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  Future<void> _confirmOrder(String orderId) async {
    final supa   = Provider.of<SupabaseService>(context, listen: false);
    final adminId = supa.currentUser?.id ?? '';
    try {
      await _svc.confirmOrder(orderId, adminId);
      _showSnack('Payment confirmed ✓');
      _loadPendingOrders();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _rejectOrder(String orderId) async {
    try {
      await _svc.rejectOrder(orderId);
      _showSnack('Order rejected.');
      _loadPendingOrders();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _approveListing(String id) async {
    try {
      await _svc.approveListing(id);
      _showSnack('Listing approved ✓');
      _loadPendingListings();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _rejectListing(String id) async {
    try {
      await _svc.rejectListing(id);
      _showSnack('Listing rejected.');
      _loadPendingListings();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _markDelivered(String orderId) async {
    try {
      await _svc.markDelivered(orderId);
      _showSnack('Marked as delivered ✓');
      _loadDeliveries();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _markRefunded(String orderId) async {
    try {
      await _svc.markRefunded(orderId);
      _showSnack('Marked as refunded ✓');
      _loadDeliveries();
    } catch (e) { _showSnack('Error: $e'); }
  }

  Future<void> _pickQr() async {
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 100);
    if (xFile != null && mounted) {
      setState(() => _newQrFile = File(xFile.path));
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _savingSettings = true);
    try {
      String? newQrUrl;
      if (_newQrFile != null) {
        newQrUrl = await _svc.uploadQrImage(_newQrFile!);
      }
      await _svc.updatePaymentSettings(
        qrImageUrl: newQrUrl,
        upiId: _upiCtrl.text.trim().isNotEmpty ? _upiCtrl.text.trim() : null,
      );
      if (mounted) {
        setState(() {
          if (newQrUrl != null) _qrUrl = newQrUrl;
          _upiId = _upiCtrl.text.trim();
          _newQrFile = null;
        });
        _showSnack('Payment settings saved ✓');
      }
    } catch (e) { _showSnack('Error: $e'); }
    finally { if (mounted) setState(() => _savingSettings = false); }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: ExecTheme.surfaceColor,
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ExecLiquidBackground(
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────────────────────
            SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded,
                              color: ExecTheme.textMain, size: 18),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('EXECOM',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 9,
                                  color: ExecTheme.accentPrimary,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2,
                                )),
                            Text('Payment Management',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: ExecTheme.textMain,
                                )),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    indicatorColor: ExecTheme.accentPrimary,
                    indicatorWeight: 2,
                    labelColor: ExecTheme.textMain,
                    unselectedLabelColor: ExecTheme.textMuted,
                    labelStyle: GoogleFonts.jetBrainsMono(
                        fontSize: 11, fontWeight: FontWeight.w700),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    tabs: [
                      Tab(text: 'Payments (${_pendingOrders.length})'),
                      Tab(text: 'Listings (${_pendingListings.length})'),
                      Tab(text: 'Deliveries (${_deliveries.length})'),
                      const Tab(text: 'Settings'),
                    ],
                  ),
                  Divider(
                      height: 1,
                      color: ExecTheme.textMuted.withOpacity(0.15)),
                ],
              ),
            ),

            // ── Tab content ─────────────────────────────────────────────────
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildPendingOrdersTab(),
                  _buildPendingListingsTab(),
                  _buildDeliveriesTab(),
                  _buildSettingsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1 — Pending Payments
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildPendingOrdersTab() {
    if (_loadingOrders) return _loader();
    if (_pendingOrders.isEmpty) {
      return _emptyState('No pending payments', 'All clear!',
          Icons.check_circle_outline_rounded);
    }
    return RefreshIndicator(
      color: ExecTheme.accentPrimary,
      onRefresh: _loadPendingOrders, // manual refresh still available
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _pendingOrders.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) =>
            _PendingOrderCard(
              order: _pendingOrders[i],
              onConfirm: () => _confirmOrder(_pendingOrders[i].id),
              onReject: () => _rejectOrder(_pendingOrders[i].id),
            ).animate(delay: Duration(milliseconds: 40 * i)).fadeIn().slideY(begin: 0.05),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2 — Pending Listings
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildPendingListingsTab() {
    if (_loadingListings) return _loader();
    if (_pendingListings.isEmpty) {
      return _emptyState(
          'No listings pending', 'All listings reviewed!', Icons.storefront_outlined);
    }
    return RefreshIndicator(
      color: ExecTheme.accentPrimary,
      onRefresh: _loadPendingListings,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _pendingListings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) => _PendingListingCard(
          listing: _pendingListings[i],
          onApprove: () => _approveListing(_pendingListings[i].id),
          onReject:  () => _rejectListing(_pendingListings[i].id),
        ).animate(delay: Duration(milliseconds: 40 * i)).fadeIn().slideY(begin: 0.05),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3 — Active Deliveries
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildDeliveriesTab() {
    if (_loadingDeliveries) return _loader();
    if (_deliveries.isEmpty) {
      return _emptyState('No active deliveries', 'No items awaiting handover',
          Icons.local_shipping_outlined);
    }
    return RefreshIndicator(
      color: ExecTheme.accentPrimary,
      onRefresh: _loadDeliveries,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _deliveries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) => _DeliveryCard(
          order: _deliveries[i],
          onDelivered: () => _markDelivered(_deliveries[i].id),
          onRefunded:  () => _markRefunded(_deliveries[i].id),
        ).animate(delay: Duration(milliseconds: 40 * i)).fadeIn().slideY(begin: 0.05),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4 — Payment Settings
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSettingsTab() {
    if (_loadingSettings) return _loader();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── GPay QR Section ───────────────────────────────────────────
          Text('GPay QR Code',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: ExecTheme.textMain)),
          const SizedBox(height: 4),
          Text('EXECOM collection account QR. Buyers scan this to pay.',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 10, color: ExecTheme.textMuted)),
          const SizedBox(height: 12),

          ExecGlassContainer(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Preview
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 180,
                    height: 180,
                    color: ExecTheme.textMuted.withOpacity(0.08),
                    child: _newQrFile != null
                        ? Image.file(_newQrFile!, fit: BoxFit.contain)
                        : (_qrUrl != null
                            ? CachedNetworkImage(
                                imageUrl: _qrUrl!,
                                fit: BoxFit.contain,
                                placeholder: (_, __) => const Center(
                                  child: CircularProgressIndicator(
                                      color: Color(0xFF7B6EF6)),
                                ),
                                errorWidget: (_, __, ___) => const Center(
                                  child: Icon(Icons.qr_code_2_rounded,
                                      size: 80, color: Colors.white38),
                                ),
                              )
                            : const Center(
                                child: Icon(Icons.qr_code_2_rounded,
                                    size: 80, color: Colors.white24),
                              )),
                  ),
                ),
                const SizedBox(height: 12),
                _execButton(
                  'Update QR Image',
                  Icons.upload_rounded,
                  ExecTheme.accentSecondary,
                  _pickQr,
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── UPI ID Section ────────────────────────────────────────────
          Text('UPI ID',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: ExecTheme.textMain)),
          const SizedBox(height: 4),
          Text('The UPI address buyers will see and copy.',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 10, color: ExecTheme.textMuted)),
          const SizedBox(height: 12),

          ExecGlassContainer(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _upiCtrl,
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: ExecTheme.textMain,
                  fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: 'e.g. iste.sctce@okicici',
                hintStyle: GoogleFonts.jetBrainsMono(
                    fontSize: 13,
                    color: ExecTheme.textMuted),
                prefixIcon: const Icon(Icons.account_balance_wallet_outlined,
                    color: ExecTheme.textMuted, size: 18),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ── Save button ───────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: _execButton(
              _savingSettings ? 'Saving...' : 'Save Payment Settings',
              Icons.save_rounded,
              ExecTheme.accentPrimary,
              _savingSettings ? null : _saveSettings,
              fullWidth: true,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  Widget _loader() => const Center(
        child: CircularProgressIndicator(color: ExecTheme.accentPrimary),
      );

  Widget _emptyState(String title, String sub, IconData icon) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: ExecTheme.textMuted, size: 48),
            const SizedBox(height: 16),
            Text(title,
                style: GoogleFonts.jetBrainsMono(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: ExecTheme.textMain)),
            Text(sub,
                style: GoogleFonts.jetBrainsMono(
                    fontSize: 11, color: ExecTheme.textMuted)),
          ],
        ),
      );

  Widget _execButton(String label, IconData icon, Color color, VoidCallback? onTap,
      {bool fullWidth = false}) {
    final child = GestureDetector(
      onTap: onTap,
      child: Container(
        padding: fullWidth
            ? const EdgeInsets.symmetric(vertical: 14)
            : const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: color.withOpacity(0.4)),
          borderRadius: BorderRadius.circular(10),
          color: color.withOpacity(0.08),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 8),
            Text(label,
                style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color)),
          ],
        ),
      ),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: child) : child;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-widgets (private cards)
// ═══════════════════════════════════════════════════════════════════════════

class _PendingOrderCard extends StatelessWidget {
  final MarketplaceOrder order;
  final VoidCallback onConfirm;
  final VoidCallback onReject;

  const _PendingOrderCard({
    required this.order,
    required this.onConfirm,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final elapsed = DateTime.now().difference(order.createdAt);
    final elapsedStr = elapsed.inHours > 0
        ? '${elapsed.inHours}h ${elapsed.inMinutes % 60}m ago'
        : '${elapsed.inMinutes}m ago';

    return ExecGlassContainer(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ────────────────────────────────────────────────────
          Row(
            children: [
              Icon(Icons.receipt_long_outlined,
                  color: ExecTheme.accentPrimary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(order.listingTitle ?? 'Item',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: ExecTheme.textMain)),
              ),
              Text(elapsedStr,
                  style: GoogleFonts.jetBrainsMono(
                      fontSize: 10, color: ExecTheme.textMuted)),
            ],
          ),
          const SizedBox(height: 10),

          // ── Details ───────────────────────────────────────────────────
          _row('Buyer', order.buyerName ?? order.buyerId.substring(0, 8)),
          _row('Amount', order.formattedPrice),
          if (order.utrNumber != null) _row('UTR', order.utrNumber!),

          // ── Payment proof thumbnail ───────────────────────────────────
          if (order.paymentProofUrl != null) ...[
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _showProofDialog(context, order.paymentProofUrl!),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: CachedNetworkImage(
                  imageUrl: order.paymentProofUrl!,
                  height: 100,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    height: 100,
                    color: ExecTheme.textMuted.withOpacity(0.1),
                    child: const Center(
                        child: CircularProgressIndicator(
                            color: ExecTheme.accentPrimary, strokeWidth: 2)),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    height: 100,
                    decoration: BoxDecoration(
                      color: ExecTheme.textMuted.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: ExecTheme.accentPrimary.withOpacity(0.3)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.broken_image_outlined,
                            color: ExecTheme.accentPrimary.withOpacity(0.5),
                            size: 28),
                        const SizedBox(height: 6),
                        Text(
                          'Screenshot unavailable\n(bucket may not be public)',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 9,
                              color: ExecTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Tap screenshot to expand',
                  style: GoogleFonts.jetBrainsMono(
                      fontSize: 9, color: ExecTheme.textMuted)),
            ),
          ],

          const SizedBox(height: 12),

          // ── Actions ───────────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: onConfirm,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: ExecTheme.accentSecondary.withOpacity(0.15),
                      border: Border.all(
                          color: ExecTheme.accentSecondary.withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('CONFIRM',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: ExecTheme.accentSecondary)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: onReject,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: ExecTheme.accentPrimary.withOpacity(0.08),
                      border: Border.all(
                          color: ExecTheme.accentPrimary.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('REJECT',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: ExecTheme.accentPrimary)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: Text(label,
                style: GoogleFonts.jetBrainsMono(
                    fontSize: 10, color: ExecTheme.textMuted)),
          ),
          Text(value,
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: ExecTheme.textMain)),
        ],
      ),
    );
  }

  void _showProofDialog(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: CachedNetworkImage(imageUrl: url, fit: BoxFit.contain),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────

class _PendingListingCard extends StatelessWidget {
  final MarketplaceListing listing;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _PendingListingCard({
    required this.listing,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return ExecGlassContainer(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Thumbnail
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 64,
              height: 64,
              color: ExecTheme.textMuted.withOpacity(0.1),
              child: listing.firstImageUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: listing.firstImageUrl,
                      fit: BoxFit.cover)
                  : const Icon(Icons.image_outlined,
                      color: ExecTheme.textMuted, size: 28),
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(listing.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: ExecTheme.textMain)),
                Text(listing.formattedPrice,
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 11, color: ExecTheme.accentPrimary)),
                Text('${listing.condition.displayName} · ${listing.category.displayName}',
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 9, color: ExecTheme.textMuted)),
                if (listing.sellerName != null)
                  Text('Seller: ${listing.sellerName}',
                      style: GoogleFonts.jetBrainsMono(
                          fontSize: 9, color: ExecTheme.textMuted)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _btn('APPROVE', ExecTheme.accentSecondary, onApprove),
                    const SizedBox(width: 8),
                    _btn('REJECT', ExecTheme.accentPrimary, onReject),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _btn(String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          border: Border.all(color: color.withOpacity(0.4)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: GoogleFonts.jetBrainsMono(
                fontSize: 10, fontWeight: FontWeight.w800, color: color)),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────

class _DeliveryCard extends StatelessWidget {
  final MarketplaceOrder order;
  final VoidCallback onDelivered;
  final VoidCallback onRefunded;

  const _DeliveryCard({
    required this.order,
    required this.onDelivered,
    required this.onRefunded,
  });

  @override
  Widget build(BuildContext context) {
    final remaining = order.deliveryDeadline.difference(DateTime.now());
    final isOverdue = remaining.isNegative;
    final color = isOverdue ? ExecTheme.accentPrimary : ExecTheme.accentSecondary;
    final countdownStr = isOverdue
        ? 'OVERDUE by ${(-remaining).inHours}h ${(-remaining).inMinutes % 60}m'
        : '${remaining.inHours}h ${remaining.inMinutes % 60}m remaining';

    return ExecGlassContainer(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_shipping_outlined, color: color, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(order.listingTitle ?? 'Item',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.jetBrainsMono(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: ExecTheme.textMain)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isOverdue ? '⚠ OVERDUE' : '⏱ ON TIME',
                  style: GoogleFonts.jetBrainsMono(
                      fontSize: 9, fontWeight: FontWeight.w800, color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(countdownStr,
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: color)),
          Text('Buyer: ${order.buyerName ?? order.buyerId.substring(0, 8)} · ${order.formattedPrice}',
              style: GoogleFonts.jetBrainsMono(
                  fontSize: 10, color: ExecTheme.textMuted)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: onDelivered,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: ExecTheme.accentSecondary.withOpacity(0.12),
                      border: Border.all(color: ExecTheme.accentSecondary.withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('MARK DELIVERED',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: ExecTheme.accentSecondary)),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: onRefunded,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: ExecTheme.accentPrimary.withOpacity(0.08),
                      border: Border.all(color: ExecTheme.accentPrimary.withOpacity(0.3)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text('MARK REFUNDED',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: ExecTheme.accentPrimary)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
