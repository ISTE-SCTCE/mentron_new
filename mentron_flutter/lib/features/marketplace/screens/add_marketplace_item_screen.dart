import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_listing.dart';
import '../../../services/marketplace_service.dart';
import 'ad_activity_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// AddMarketplaceItemScreen — Sell Mode + My Listings tab
// ─────────────────────────────────────────────────────────────────────────────

class AddMarketplaceItemScreen extends StatefulWidget {
  const AddMarketplaceItemScreen({super.key});

  @override
  State<AddMarketplaceItemScreen> createState() => _AddMarketplaceItemScreenState();
}

class _AddMarketplaceItemScreenState extends State<AddMarketplaceItemScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late MarketplaceService _svc;

  // ── Form state ─────────────────────────────────────────────────────────────
  final _titleCtrl       = TextEditingController();
  final _descCtrl        = TextEditingController();
  final _priceCtrl       = TextEditingController();
  ListingCategory  _category  = ListingCategory.other;
  ListingCondition _condition = ListingCondition.used;
  final List<File> _images = [];
  bool _isSubmitting = false;

  // ── My Listings state ──────────────────────────────────────────────────────
  List<MarketplaceListing> _myListings = [];
  bool _isLoadingListings = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && _myListings.isEmpty) {
        _loadMyListings();
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final client = Provider.of<SupabaseService>(context, listen: false).client;
      _svc = MarketplaceService(client);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 80);
    if (picked.isNotEmpty && mounted) {
      setState(() {
        _images.addAll(picked.map((x) => File(x.path)));
      });
    }
  }

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty) {
      _showSnack('Title is required.');
      return;
    }
    if (_priceCtrl.text.trim().isEmpty) {
      _showSnack('Price is required.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final supa   = Provider.of<SupabaseService>(context, listen: false);
      final userId = supa.currentUser?.id;
      if (userId == null) throw Exception('Not signed in');

      final imageUrls = _images.isNotEmpty
          ? await _svc.uploadListingImages(_images, userId)
          : <String>[];

      await _svc.createListing(
        sellerId:    userId,
        title:       _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        category:    _category,
        condition:   _condition,
        price:       double.parse(_priceCtrl.text.trim()),
        imageUrls:   imageUrls,
      );

      if (mounted) {
        _showSnack('Listing submitted for review! 🎉');
        _tabController.animateTo(1);
        _loadMyListings();
        _titleCtrl.clear();
        _descCtrl.clear();
        _priceCtrl.clear();
        setState(() => _images.clear());
      }
    } catch (e) {
      if (mounted) _showSnack('Error: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _loadMyListings() async {
    final supa   = Provider.of<SupabaseService>(context, listen: false);
    final userId = supa.currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoadingListings = true);
    try {
      final results = await _svc.fetchMyListings(userId);
      if (mounted) setState(() => _myListings = results);
    } catch (e) {
      debugPrint('[AddMarketplace] loadMyListings error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingListings = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

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
              child: Column(
                children: [
                  // Back + title
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded,
                              color: Colors.white, size: 18),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('MARKETPLACE',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 2,
                                  )),
                              Text('Sell Mode',
                                  style: MarketplaceTheme.heading(20,
                                      color: Colors.white)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Tab bar
                  TabBar(
                    controller: _tabController,
                    indicatorColor: Colors.white,
                    indicatorWeight: 3,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white54,
                    labelStyle: GoogleFonts.inter(
                        fontWeight: FontWeight.w700, fontSize: 13),
                    tabs: const [
                      Tab(text: 'List an Item'),
                      Tab(text: 'My Listings'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ── Tab views ───────────────────────────────────────────────────
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildSellForm(),
                _buildMyListings(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Sell Form tab ──────────────────────────────────────────────────────────

  Widget _buildSellForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image picker
          _buildImagePicker(),
          const SizedBox(height: 20),

          _buildCard(children: [
            _buildLabel('ITEM TITLE'),
            _buildTextField(_titleCtrl, 'e.g. Engineering Maths S3', Icons.title_rounded),
            const SizedBox(height: 14),

            _buildLabel('DESCRIPTION'),
            _buildTextField(
              _descCtrl,
              'Edition, notes inside, any details...',
              Icons.description_outlined,
              maxLines: 3,
            ),
            const SizedBox(height: 14),

            _buildLabel('CATEGORY'),
            _buildDropdown<ListingCategory>(
              value: _category,
              items: ListingCategory.values,
              labelOf: (c) => c.displayName,
              onChanged: (v) => setState(() => _category = v!),
            ),
            const SizedBox(height: 14),

            _buildLabel('CONDITION'),
            _buildDropdown<ListingCondition>(
              value: _condition,
              items: ListingCondition.values,
              labelOf: (c) => c.displayName,
              onChanged: (v) => setState(() => _condition = v!),
            ),
            const SizedBox(height: 14),

            _buildLabel('PRICE (₹)'),
            _buildTextField(
              _priceCtrl,
              'e.g. 250',
              Icons.currency_rupee_rounded,
              inputType: TextInputType.number,
            ),
            const SizedBox(height: 24),

            // Submit button
            GestureDetector(
              onTap: _isSubmitting ? null : _submit,
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  gradient: MarketplaceTheme.heroGradient,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: [
                    BoxShadow(
                      color: MarketplaceTheme.purple.withOpacity(0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Center(
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : Text('Submit for Review',
                          style: GoogleFonts.baloo2(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Colors.white)),
                ),
              ),
            ),
          ]).animate().fadeIn(delay: 100.ms).slideY(begin: 0.05),
        ],
      ),
    );
  }

  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Photos', style: MarketplaceTheme.heading(15)),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ..._images.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.file(f, width: 100, height: 100, fit: BoxFit.cover),
                  ),
                ),
              ),
              GestureDetector(
                onTap: _pickImages,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: MarketplaceTheme.purpleSoft,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: MarketplaceTheme.purple.withOpacity(0.3)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_photo_alternate_outlined,
                          color: MarketplaceTheme.purple, size: 28),
                      const SizedBox(height: 4),
                      Text('Add',
                          style: MarketplaceTheme.label(11,
                              color: MarketplaceTheme.purple)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── My Listings tab ────────────────────────────────────────────────────────

  Widget _buildMyListings() {
    if (_isLoadingListings) {
      return const Center(
          child: CircularProgressIndicator(color: Color(0xFF7B6EF6)));
    }
    if (_myListings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storefront_outlined,
                color: MarketplaceTheme.body, size: 48),
            const SizedBox(height: 16),
            Text("You haven't listed anything yet",
                style: MarketplaceTheme.label(15)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: MarketplaceTheme.purple,
      onRefresh: _loadMyListings,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: _myListings.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final listing = _myListings[i];
          return _MyListingRow(
            listing: listing,
            onActivityTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AdActivityScreen(listing: listing),
                ),
              );
            },
            onDeleteTap: () => _deleteListing(listing.id),
          ).animate(delay: Duration(milliseconds: 50 * i)).fadeIn().slideY(begin: 0.05);
        },
      ),
    );
  }

  Future<void> _deleteListing(String id) async {
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

    try {
      setState(() => _isLoadingListings = true);
      await _svc.deleteListing(id);
      _showSnack('Listing deleted.');
      _loadMyListings();
    } catch (e) {
      if (mounted) _showSnack('Failed to delete: $e');
      if (mounted) setState(() => _isLoadingListings = false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  Widget _buildCard({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: MarketplaceTheme.cardShadow,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 2),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: MarketplaceTheme.purple,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController ctrl,
    String hint,
    IconData icon, {
    int maxLines = 1,
    TextInputType inputType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: MarketplaceTheme.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E3F0)),
      ),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: inputType,
        style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: MarketplaceTheme.ink),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: MarketplaceTheme.body_(13),
          prefixIcon: maxLines == 1
              ? Icon(icon, color: MarketplaceTheme.body, size: 18)
              : null,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildDropdown<T>({
    required T value,
    required List<T> items,
    required String Function(T) labelOf,
    required ValueChanged<T?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: MarketplaceTheme.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E3F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              color: Color(0xFF8D8AA0)),
          style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: MarketplaceTheme.ink),
          items: items
              .map((v) => DropdownMenuItem<T>(
                    value: v,
                    child: Text(labelOf(v)),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

// ── My Listing Row ─────────────────────────────────────────────────────────

class _MyListingRow extends StatelessWidget {
  final MarketplaceListing listing;
  final VoidCallback onActivityTap;
  final VoidCallback onDeleteTap;

  const _MyListingRow({required this.listing, required this.onActivityTap, required this.onDeleteTap});

  @override
  Widget build(BuildContext context) {
    Color statusBg;
    Color statusFg;
    switch (listing.status) {
      case ListingStatus.live:
        statusBg = const Color(0xFFDCFCE7); statusFg = const Color(0xFF16A34A);
        break;
      case ListingStatus.pendingReview:
        statusBg = MarketplaceTheme.coralSoft; statusFg = MarketplaceTheme.coral;
        break;
      case ListingStatus.sold:
        statusBg = MarketplaceTheme.purpleSoft; statusFg = MarketplaceTheme.purple;
        break;
      default:
        statusBg = const Color(0xFFF3F4F6); statusFg = const Color(0xFF6B7280);
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: MarketplaceTheme.cardShadow,
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 64,
              height: 64,
              color: MarketplaceTheme.purpleSoft,
              child: listing.firstImageUrl.isNotEmpty
                  ? Image.network(listing.firstImageUrl, fit: BoxFit.cover)
                  : const Icon(Icons.image_outlined,
                      color: Color(0xFF7B6EF6), size: 28),
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
                    style: MarketplaceTheme.heading(13)),
                const SizedBox(height: 4),
                Text(listing.formattedPrice,
                    style: MarketplaceTheme.label(12,
                        color: MarketplaceTheme.purple)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    listing.status.displayName,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: statusFg,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // View Activity button
          if (listing.status == ListingStatus.live)
            GestureDetector(
              onTap: onActivityTap,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: MarketplaceTheme.purpleSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Icon(Icons.bar_chart_rounded,
                        color: MarketplaceTheme.purple, size: 18),
                    Text('Activity',
                        style: MarketplaceTheme.label(9,
                            color: MarketplaceTheme.purple)),
                  ],
                ),
              ),
            ),
            
          const SizedBox(width: 8),

          // Delete button
          GestureDetector(
            onTap: onDeleteTap,
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: MarketplaceTheme.coralSoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  Icon(Icons.delete_outline_rounded,
                      color: MarketplaceTheme.coral, size: 18),
                  Text('Delete',
                      style: MarketplaceTheme.label(9,
                          color: MarketplaceTheme.coral)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
