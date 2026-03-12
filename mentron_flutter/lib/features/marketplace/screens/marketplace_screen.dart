import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/marketplace_model.dart';
import 'add_marketplace_item_screen.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/app_transitions.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});
  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  List<MarketplaceItem> _items = [];
  bool _isLoading = true;
  String? _currentUserId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadUserAndItems();
  }

  Future<void> _loadUserAndItems() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    _currentUserId = supabase.currentUser?.id;
    if (_currentUserId != null) {
      try {
        final profile = await supabase.client.from('profiles').select('role').eq('id', _currentUserId!).maybeSingle();
        if (mounted && profile != null) setState(() => _currentUserRole = profile['role']);
      } catch (_) {}
    }
    await _fetchItems();
    _setupRealtime();
  }

  Future<void> _fetchItems() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase.from('marketplace_items').select('*, profiles(full_name)').order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _items = (response as List).map((json) => MarketplaceItem.fromJson(json)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _setupRealtime() {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    supabase.subscribeToTable(table: 'marketplace_items', onUpdate: (_) => _fetchItems());
  }

  bool _canDelete(MarketplaceItem item) {
    if (_currentUserId == null) return false;
    return item.sellerId == _currentUserId || _currentUserRole == 'exec';
  }

  Future<void> _deleteItem(MarketplaceItem item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Listing?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Delete "${item.title}"? This cannot be undone.', style: const TextStyle(color: AppTheme.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirm != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false);
    try {
      // Delete image from storage if it's stored in Supabase
      if (item.imageUrl.contains('marketplace_bucket')) {
        final path = item.imageUrl.split('marketplace_bucket/').last;
        await supabase.client.storage.from('marketplace_bucket').remove([path]);
      }
      await supabase.client.from('marketplace_items').delete().eq('id', item.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text('Listing deleted')));
        setState(() => _items.removeWhere((i) => i.id == item.id));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, AppTransitions.slideUp(const AddMarketplaceItemScreen())).then((_) => _fetchItems()),
        backgroundColor: AppTheme.accentPrimary,
        icon: const Icon(Icons.add_rounded),
        label: const Text('SELL ITEM', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
      ).animate().scale(delay: 500.ms),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Column(children: [
          const Text('STUDENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Marketplace', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _items.isEmpty
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Text('🛒', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 16),
                    const Text('No items listed yet.', style: TextStyle(color: AppTheme.textMuted)),
                    const SizedBox(height: 8),
                    const Text('Sell your first item!', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                  ]).animate().fadeIn())
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.62),
                    itemCount: _items.length,
                    itemBuilder: (context, index) => RepaintBoundary(child: _buildItemCard(_items[index], index)),
                  ),
      ),
    );
  }

  Widget _buildItemCard(MarketplaceItem item, int index) {
    final canDelete = _canDelete(item);
    return GlassContainer(
      padding: EdgeInsets.zero,
      child: Stack(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(
            flex: 3,
            child: Stack(fit: StackFit.expand, children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: CachedNetworkImage(
                  imageUrl: item.imageUrl.startsWith('/') ? 'https://ysllolnoyezfdllqocgv.supabase.co${item.imageUrl}' : item.imageUrl,
                  fit: BoxFit.cover, memCacheWidth: 400,
                  placeholder: (context, url) => Container(color: Colors.white10),
                  errorWidget: (context, url, error) => Container(color: Colors.white10, child: const Icon(Icons.image_outlined, color: Colors.white24)),
                ),
              ),
              if (item.isSold) Container(color: Colors.black54, child: const Center(child: Text('SOLD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2)))),
              Positioned(top: 8, left: 8,
                child: Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  child: Text('₹${item.price.toInt()}', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                ),
              ),
            ]),
          ),
          Expanded(
            flex: 2,
            child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white)),
              const SizedBox(height: 4),
              Text(item.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
              const Spacer(),
              Row(children: [
                CircleAvatar(radius: 8, backgroundColor: AppTheme.accentPrimary.withOpacity(0.2),
                  child: Text(item.sellerName?[0].toUpperCase() ?? 'S', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold))),
                const SizedBox(width: 6),
                Expanded(child: Text(item.sellerName ?? 'Student Seller', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold))),
              ]),
            ])),
          ),
        ]),
        // Delete button overlay — only for owner/exec
        if (canDelete)
          Positioned(top: 8, right: 8,
            child: GestureDetector(
              onTap: () => _deleteItem(item),
              child: Container(padding: const EdgeInsets.all(6), decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 14)),
            ),
          ),
      ]),
    ).animate().fadeIn(delay: (index * 50).ms).scale(begin: const Offset(0.95, 0.95));
  }
}
