import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../models/marketplace_order.dart';
import '../../../services/buyers_service.dart';
import '../../../shared/widgets/exec_glass_container.dart';
import '../../../shared/widgets/exec_liquid_background.dart';

class BuyersListPage extends StatefulWidget {
  const BuyersListPage({super.key});

  @override
  State<BuyersListPage> createState() => _BuyersListPageState();
}

class _BuyersListPageState extends State<BuyersListPage> {
  late BuyersService _svc;
  List<MarketplaceOrder> _allOrders = [];
  List<MarketplaceOrder> _filteredOrders = [];
  bool _isLoading = true;

  // Controllers
  final TextEditingController _searchCtrl = TextEditingController();

  // Filter states
  String _searchQuery = '';
  OrderStatus? _statusFilter;
  String? _productFilter;

  // Cache list of unique products for filtering
  List<String> _uniqueProducts = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = BuyersService(client);
      _loadData();
    });

    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text;
        _applyFilters();
      });
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _svc.fetchAllOrders();
      if (mounted) {
        setState(() {
          _allOrders = data;
          _uniqueProducts = data
              .map((o) => o.listingTitle ?? 'Unknown Product')
              .toSet()
              .toList();
          _isLoading = false;
          _applyFilters();
        });
      }
    } catch (e) {
      debugPrint('[BuyersListPage] fetch error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _showSnack('Failed to load buyers: $e');
      }
    }
  }

  void _applyFilters() {
    List<MarketplaceOrder> temp = List.from(_allOrders);

    // 1. Search Query (Buyer Name, Product Title, or Phone Number)
    if (_searchQuery.trim().isNotEmpty) {
      final query = _searchQuery.toLowerCase().trim();
      temp = temp.where((o) {
        final buyerName = (o.buyerName ?? '').toLowerCase();
        final prodTitle = (o.listingTitle ?? '').toLowerCase();
        final phone = (o.phoneNumber ?? '').toLowerCase();
        return buyerName.contains(query) ||
            prodTitle.contains(query) ||
            phone.contains(query);
      }).toList();
    }

    // 2. Status Filter
    if (_statusFilter != null) {
      temp = temp.where((o) => o.orderStatus == _statusFilter).toList();
    }

    // 3. Product Filter
    if (_productFilter != null) {
      temp = temp.where((o) => o.listingTitle == _productFilter).toList();
    }

    _filteredOrders = temp;
  }

  Future<void> _exportToCsv() async {
    if (_filteredOrders.isEmpty) {
      _showSnack('No data to export.');
      return;
    }

    try {
      // Create CSV structure
      final List<List<dynamic>> csvData = [
        ['Buyer Name', 'Phone Number', 'Product', 'Purchase Date', 'Quantity', 'Amount', 'Payment Status'],
        ..._filteredOrders.map((o) => [
              o.buyerName ?? 'N/A',
              o.phoneNumber ?? 'N/A',
              o.listingTitle ?? 'N/A',
              o.createdAt.toLocal().toString(),
              1, // Quantity (all marketplace transactions default to 1)
              o.amount,
              o.orderStatus.displayName,
            ])
      ];

      // Convert to CSV string
      final csvString = Csv().asCodec().encoder.convert(csvData);

      // Save file
      final directory = await getTemporaryDirectory();
      final path = '${directory.path}/buyers_list_${DateTime.now().millisecondsSinceEpoch}.csv';
      final file = File(path);
      await file.writeAsString(csvString);

      if (mounted) {
        _showSnack('CSV export generated successfully ✓');
        // Share via share_plus
        await Share.shareXFiles([XFile(path)], subject: 'Mentron Buyers List Export');
      }
    } catch (e) {
      _showSnack('Failed to export CSV: $e');
    }
  }

  Future<void> _makeCall(String phoneNumber) async {
    final url = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      _showSnack('Could not launch dialer.');
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    _showSnack('$label copied to clipboard ✓');
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(color: Colors.white)),
        behavior: SnackBarBehavior.floating,
        backgroundColor: ExecTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ── Build Details Modal ──────────────────────────────────────────────────
  void _openDetailsSheet(MarketplaceOrder order) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return ExecGlassContainer(
          isNavElement: true,
          borderRadius: 30,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pull Bar indicator
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Product Info Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 80,
                      height: 80,
                      color: Colors.white.withOpacity(0.05),
                      child: order.firstListingImage.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: order.firstListingImage,
                              fit: BoxFit.cover,
                            )
                          : const Icon(Icons.image_outlined, color: Colors.white24, size: 40),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.listingTitle ?? 'Unknown Product',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: ExecTheme.textMain,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          order.formattedPrice,
                          style: GoogleFonts.plusJakartaSans(
                            color: ExecTheme.accentSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),
              const Divider(color: Colors.white10),
              const SizedBox(height: 16),

              // Buyer Details Section
              Text(
                'BUYER DETAILS',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  color: ExecTheme.accentPrimary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              _buildDetailRow('Name', order.buyerName ?? 'N/A'),
              _buildDetailRow('Roll Number', '${order.buyerDepartment ?? 'N/A'} (Year: ${order.buyerAdmissionYear ?? 'N/A'})'),
              _buildDetailRow(
                'Phone',
                order.phoneNumber ?? 'N/A',
                action: order.phoneNumber != null
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.phone_rounded, color: Colors.greenAccent, size: 18),
                            onPressed: () => _makeCall(order.phoneNumber!),
                          ),
                          IconButton(
                            icon: const Icon(Icons.copy_rounded, color: Colors.white54, size: 18),
                            onPressed: () => _copyToClipboard(order.phoneNumber!, 'Phone'),
                          ),
                        ],
                      )
                    : null,
              ),
              _buildDetailRow(
                'Email',
                order.buyerEmail ?? 'N/A (Auth Secured)',
                action: order.buyerEmail != null && order.buyerEmail != 'N/A'
                    ? IconButton(
                        icon: const Icon(Icons.copy_rounded, color: Colors.white54, size: 18),
                        onPressed: () => _copyToClipboard(order.buyerEmail!, 'Email'),
                      )
                    : null,
              ),

              const SizedBox(height: 20),
              const Divider(color: Colors.white10),
              const SizedBox(height: 16),

              // Seller Details Section
              Text(
                'SELLER DETAILS',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  color: ExecTheme.accentSecondary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              _buildDetailRow('Name', order.sellerName ?? 'N/A'),
              _buildDetailRow('Roll Number', '${order.sellerDepartment ?? 'N/A'} (Year: ${order.sellerAdmissionYear ?? 'N/A'})'),
              _buildDetailRow(
                'Phone',
                order.sellerPhone ?? 'N/A',
                action: order.sellerPhone != null && order.sellerPhone != 'N/A'
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.phone_rounded, color: Colors.greenAccent, size: 18),
                            onPressed: () => _makeCall(order.sellerPhone!),
                          ),
                          IconButton(
                            icon: const Icon(Icons.copy_rounded, color: Colors.white54, size: 18),
                            onPressed: () => _copyToClipboard(order.sellerPhone!, 'Phone'),
                          ),
                        ],
                      )
                    : null,
              ),

              const SizedBox(height: 20),
              const Divider(color: Colors.white10),
              const SizedBox(height: 16),

              // Transaction details
              Text(
                'TRANSACTION DETAILS',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  color: ExecTheme.accentPrimary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              _buildDetailRow('Order ID', order.id),
              _buildDetailRow(
                'UPI UTR / Trans ID',
                order.utrNumber ?? 'N/A',
                action: order.utrNumber != null
                    ? IconButton(
                        icon: const Icon(Icons.copy_rounded, color: Colors.white54, size: 18),
                        onPressed: () => _copyToClipboard(order.utrNumber!, 'UTR'),
                      )
                    : null,
              ),
              _buildDetailRow(
                'Status',
                order.orderStatus.displayName,
                statusColor: _getStatusColor(order.orderStatus),
              ),
              _buildDetailRow(
                'Purchase Date',
                DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt.toLocal()),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value, {Widget? action, Color? statusColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(color: ExecTheme.textMuted, fontSize: 13),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Flexible(
                  child: Text(
                    value,
                    textAlign: TextAlign.end,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      color: statusColor ?? ExecTheme.textMain,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (action != null) action,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.paymentConfirmed:
        return Colors.greenAccent;
      case OrderStatus.delivered:
        return Colors.blueAccent;
      case OrderStatus.pendingVerification:
        return Colors.amberAccent;
      case OrderStatus.cancelled:
      case OrderStatus.refunded:
        return Colors.redAccent;
    }
  }

  // ── Build List ───────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ExecLiquidBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: ExecTheme.textMain, size: 18),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'EXECOM',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 9,
                              color: ExecTheme.accentPrimary,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2,
                            ),
                          ),
                          Text(
                            'Buyers List',
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: ExecTheme.textMain,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.ios_share_rounded, color: ExecTheme.textMain),
                      tooltip: 'Export CSV',
                      onPressed: _exportToCsv,
                    ),
                  ],
                ),
              ),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ExecGlassContainer(
                  borderRadius: 100,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _searchCtrl,
                    style: GoogleFonts.plusJakartaSans(color: ExecTheme.textMain),
                    decoration: InputDecoration(
                      hintText: 'Search buyers, products, or phones...',
                      hintStyle: GoogleFonts.plusJakartaSans(color: ExecTheme.textMuted, fontSize: 13),
                      border: InputBorder.none,
                      icon: const Icon(Icons.search_rounded, color: ExecTheme.textMuted, size: 20),
                    ),
                  ),
                ),
              ),

              // Filters Row
              _buildFiltersRow(),

              // Buyers List View
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _loadData,
                  color: ExecTheme.accentPrimary,
                  backgroundColor: ExecTheme.surfaceColor,
                  child: _isLoading
                      ? _buildSkeletonState()
                      : _filteredOrders.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                              itemCount: _filteredOrders.length,
                              itemBuilder: (ctx, i) {
                                final order = _filteredOrders[i];
                                return _buildBuyerCard(order)
                                    .animate()
                                    .fadeIn(duration: 200.ms, delay: (i * 30).ms)
                                    .slideY(begin: 0.05);
                              },
                            ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Filter Widget row ────────────────────────────────────────────────────
  Widget _buildFiltersRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Filter by status dropdown/popup
          PopupMenuButton<OrderStatus?>(
            initialValue: _statusFilter,
            onSelected: (status) {
              setState(() {
                _statusFilter = status;
                _applyFilters();
              });
            },
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: ExecTheme.surfaceColor,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.filter_list_rounded,
                    size: 14,
                    color: _statusFilter != null ? ExecTheme.accentPrimary : ExecTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _statusFilter == null ? 'All Statuses' : _statusFilter!.displayName,
                    style: GoogleFonts.plusJakartaSans(
                      color: _statusFilter != null ? ExecTheme.textMain : ExecTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: ExecTheme.textMuted, size: 18),
                ],
              ),
            ),
            itemBuilder: (context) => [
              const PopupMenuItem(value: null, child: Text('All Statuses')),
              ...OrderStatus.values.map(
                (s) => PopupMenuItem(
                  value: s,
                  child: Text(s.displayName),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),

          // Filter by product dropdown/popup
          PopupMenuButton<String?>(
            initialValue: _productFilter,
            onSelected: (prod) {
              setState(() {
                _productFilter = prod;
                _applyFilters();
              });
            },
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: ExecTheme.surfaceColor,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 14,
                    color: _productFilter != null ? ExecTheme.accentSecondary : ExecTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Container(
                    constraints: const BoxConstraints(maxWidth: 120),
                    child: Text(
                      _productFilter ?? 'All Products',
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        color: _productFilter != null ? ExecTheme.textMain : ExecTheme.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down, color: ExecTheme.textMuted, size: 18),
                ],
              ),
            ),
            itemBuilder: (context) => [
              const PopupMenuItem(value: null, child: Text('All Products')),
              ..._uniqueProducts.map(
                (p) => PopupMenuItem(
                  value: p,
                  child: Text(p),
                ),
              ),
            ],
          ),

          // Clear filters button
          if (_statusFilter != null || _productFilter != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                setState(() {
                  _statusFilter = null;
                  _productFilter = null;
                  _applyFilters();
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Clear Filters',
                  style: GoogleFonts.plusJakartaSans(
                    color: Colors.redAccent,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Card Widget ──────────────────────────────────────────────────────────
  Widget _buildBuyerCard(MarketplaceOrder order) {
    final statusColor = _getStatusColor(order.orderStatus);

    return InkWell(
      onTap: () => _openDetailsSheet(order),
      borderRadius: BorderRadius.circular(18),
      child: ExecGlassContainer(
        borderRadius: 18,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Product thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 60,
                height: 60,
                color: Colors.white.withOpacity(0.04),
                child: order.firstListingImage.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: order.firstListingImage,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) =>
                            const Icon(Icons.image_outlined, color: Colors.white24, size: 30),
                      )
                    : const Icon(Icons.image_outlined, color: Colors.white24, size: 30),
              ),
            ),
            const SizedBox(width: 14),

            // Content details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Buyer Name
                  Text(
                    order.buyerName ?? 'Anonymous Buyer',
                    style: GoogleFonts.plusJakartaSans(
                      color: ExecTheme.textMain,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Phone number
                  if (order.phoneNumber != null)
                    GestureDetector(
                      onTap: () => _makeCall(order.phoneNumber!),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.phone_rounded, color: Colors.greenAccent, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            order.phoneNumber!,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.greenAccent,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Text(
                      'No Phone',
                      style: GoogleFonts.plusJakartaSans(color: ExecTheme.textMuted, fontSize: 12),
                    ),
                  const SizedBox(height: 4),

                  // Product & Time
                  Text(
                    '${order.listingTitle ?? 'Unknown'} • ${DateFormat('dd MMM, hh:mm a').format(order.createdAt.toLocal())}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      color: ExecTheme.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Status chip + price
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  order.formattedPrice,
                  style: GoogleFonts.plusJakartaSans(
                    color: ExecTheme.accentSecondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withOpacity(0.2), width: 0.8),
                  ),
                  child: Text(
                    order.orderStatus.displayName,
                    style: GoogleFonts.plusJakartaSans(
                      color: statusColor,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── States ───────────────────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.people_outline_rounded, size: 60, color: Colors.white24),
            ),
            const SizedBox(height: 16),
            Text(
              'No buyers found',
              style: GoogleFonts.jetBrainsMono(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: ExecTheme.textMain,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'No purchases match current search/filters.',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                color: ExecTheme.textMuted,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeletonState() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: 5,
      itemBuilder: (ctx, i) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 85,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
        );
      },
    );
  }
}
