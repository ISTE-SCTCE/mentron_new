import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/marketplace_listing.dart';
import '../models/marketplace_order.dart';
import '../models/marketplace_listing_view.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceService — all Supabase calls for the marketplace feature
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceService {
  final SupabaseClient _client;

  MarketplaceService(this._client);

  // ── Storage bucket names ───────────────────────────────────────────────────
  static const String _imagesBucket       = 'marketplace-images';
  static const String _proofsBucket       = 'marketplace-payment-proofs';
  static const String _qrBucket          = 'marketplace-qr';

  // ══════════════════════════════════════════════════════════════════════════
  // LISTINGS — Buyer
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch live listings, optionally filtered by [category].
  /// Returns most recent first.
  Future<List<MarketplaceListing>> fetchLiveListings({
    ListingCategory? category,
    int limit = 40,
  }) async {
    var query = _client
        .from('marketplace_listings')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('status', 'live');

    if (category != null) {
      query = query.eq('category', category.toDbString());
    }

    final response = await query
        .order('created_at', ascending: false)
        .limit(limit);
    return (response as List)
        .map((json) => MarketplaceListing.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LISTINGS — Seller
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch the current user's own listings (all statuses).
  Future<List<MarketplaceListing>> fetchMyListings(String userId) async {
    final response = await _client
        .from('marketplace_listings')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('seller_id', userId)
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => MarketplaceListing.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetch a single listing by ID.
  Future<MarketplaceListing?> fetchListing(String listingId) async {
    final response = await _client
        .from('marketplace_listings')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('id', listingId)
        .maybeSingle();

    if (response == null) return null;
    return MarketplaceListing.fromJson(response as Map<String, dynamic>);
  }

  /// Create a new listing. Returns the created listing's ID.
  Future<String> createListing({
    required String sellerId,
    required String title,
    required String description,
    required ListingCategory category,
    required ListingCondition condition,
    required double price,
    required List<String> imageUrls,
  }) async {
    final response = await _client
        .from('marketplace_listings')
        .insert({
          'seller_id':   sellerId,
          'title':       title,
          'description': description,
          'category':    category.toDbString(),
          'condition':   condition.toDbString(),
          'price':       price,
          'images':      imageUrls,
          'status':      'pending_review',
        })
        .select('id')
        .single();

    return response['id'] as String;
  }

  /// Upload one or more images to Supabase storage.
  /// Returns the list of public URLs.
  Future<List<String>> uploadListingImages(
    List<File> files,
    String sellerId,
  ) async {
    final urls = <String>[];
    for (final file in files) {
      final ext = file.path.split('.').last;
      final path = '$sellerId/${DateTime.now().millisecondsSinceEpoch}.$ext';
      await _client.storage
          .from(_imagesBucket)
          .upload(path, file, fileOptions: const FileOptions(upsert: true));
      final url = _client.storage.from(_imagesBucket).getPublicUrl(path);
      urls.add(url);
    }
    return urls;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LISTING VIEWS
  // ══════════════════════════════════════════════════════════════════════════

  /// Log a view for [listingId] by [viewerId].
  /// Deduped: the unique index on (listing_id, viewer_id, view_date) means
  /// the same viewer opening the same listing twice in one day does not create
  /// a new row — ON CONFLICT DO NOTHING is the intended behaviour.
  Future<void> logView(String listingId, String viewerId) async {
    try {
      await _client.from('marketplace_listing_views').upsert(
        {
          'listing_id': listingId,
          'viewer_id':  viewerId,
          'viewed_at':  DateTime.now().toIso8601String(),
          'viewed_date': DateTime.now().toIso8601String().substring(0, 10), // yyyy-MM-dd
        },
        onConflict: 'listing_id,viewer_id,viewed_date',
        ignoreDuplicates: true,
      );
    } catch (e) {
      // Non-critical: swallow errors silently
      debugPrint('[MarketplaceService] logView error: $e');
    }
  }

  /// Fetch all view rows for a listing (for Ad Activity analytics).
  Future<List<MarketplaceListingView>> fetchListingViews(String listingId) async {
    final response = await _client
        .from('marketplace_listing_views')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('listing_id', listingId)
        .order('viewed_at', ascending: false);

    return (response as List)
        .map((json) => MarketplaceListingView.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ORDERS — Buyer
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch the current buyer's orders, most recent first.
  Future<List<MarketplaceOrder>> fetchMyOrders(String buyerId) async {
    final response = await _client
        .from('marketplace_orders')
        .select(
          '*, marketplace_listings(title, images), profiles!buyer_id(full_name, department, admission_year)',
        )
        .eq('buyer_id', buyerId)
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => MarketplaceOrder.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Upload a payment screenshot. Returns its public URL.
  ///
  /// IMPORTANT: The `marketplace-payment-proofs` Supabase Storage bucket
  /// **must** be set to Public (or have an authenticated-read RLS policy)
  /// so that the EXECOM Payment Manager can render the screenshot inline.
  Future<String> uploadPaymentProof(File file, String buyerId) async {
    final ext = file.path.split('.').last;
    final path = '$buyerId/${DateTime.now().millisecondsSinceEpoch}.$ext';
    await _client.storage
        .from(_proofsBucket)
        .upload(path, file, fileOptions: const FileOptions(upsert: true));
    return _client.storage.from(_proofsBucket).getPublicUrl(path);
  }

  /// Create an order after payment proof is submitted.
  Future<String> createOrder({
    required String listingId,
    required String buyerId,
    required double amount,
    required String paymentProofUrl,
    required String utrNumber,
  }) async {
    final response = await _client
        .from('marketplace_orders')
        .insert({
          'listing_id':             listingId,
          'buyer_id':               buyerId,
          'amount':                 amount,
          'payment_proof_url':      paymentProofUrl,
          'utr_number':             utrNumber,
          'disclaimer_accepted_at': DateTime.now().toIso8601String(),
          'order_status':           'pending_verification',
        })
        .select('id')
        .single();

    return response['id'] as String;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT SETTINGS
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch the single payment settings row.
  Future<Map<String, String?>> fetchPaymentSettings() async {
    final response = await _client
        .from('payment_settings')
        .select('qr_image_url, upi_id')
        .limit(1)
        .maybeSingle();

    if (response == null) return {'qr_image_url': null, 'upi_id': null};
    return {
      'qr_image_url': response['qr_image_url'] as String?,
      'upi_id':       response['upi_id'] as String?,
    };
  }

  /// Upload a new QR image and return its public URL.
  Future<String> uploadQrImage(File file) async {
    const path = 'gpay_qr.png';
    await _client.storage
        .from(_qrBucket)
        .upload(path, file, fileOptions: const FileOptions(upsert: true));
    // Add cache-busting timestamp to force reload
    final url = _client.storage.from(_qrBucket).getPublicUrl(path);
    return '$url?t=${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Update the payment settings row (EXECOM only).
  Future<void> updatePaymentSettings({String? qrImageUrl, String? upiId}) async {
    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (qrImageUrl != null) updates['qr_image_url'] = qrImageUrl;
    if (upiId != null)      updates['upi_id']        = upiId;

    await _client.from('payment_settings').update(updates);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXECOM — Orders
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch orders pending payment verification, oldest first.
  Future<List<MarketplaceOrder>> fetchPendingOrders() async {
    final response = await _client
        .from('marketplace_orders')
        .select(
          '*, marketplace_listings(title, images), profiles!buyer_id(full_name, department, admission_year)',
        )
        .eq('order_status', 'pending_verification')
        .order('created_at', ascending: true);

    return (response as List)
        .map((json) => MarketplaceOrder.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Realtime stream of pending-verification orders.
  ///
  /// Emits a fresh list whenever a row in `marketplace_orders` is
  /// inserted, updated, or deleted. The EXECOM Payment Manager subscribes
  /// to this so new buyer submissions appear instantly without manual refresh.
  ///
  /// NOTE: Supabase Realtime must be enabled on the `marketplace_orders`
  /// table in the Supabase dashboard (Database → Replication → marketplace_orders).
  Stream<List<MarketplaceOrder>> streamPendingOrders() {
    // .stream() returns a broadcast stream; filter client-side because the
    // Supabase Dart SDK's stream() does not support .eq() filtering.
    return _client
        .from('marketplace_orders')
        .stream(primaryKey: ['id'])
        .asyncMap((rows) async {
          // Fetch full data (with joins) for only the pending rows.
          // We re-query when the stream fires so we always have fresh joined data.
          try {
            return await fetchPendingOrders();
          } catch (_) {
            return <MarketplaceOrder>[];
          }
        });
  }

  /// Fetch orders that are payment_confirmed (active deliveries).
  Future<List<MarketplaceOrder>> fetchActiveDeliveries() async {
    final response = await _client
        .from('marketplace_orders')
        .select(
          '*, marketplace_listings(title, images), profiles!buyer_id(full_name, department, admission_year)',
        )
        .eq('order_status', 'payment_confirmed')
        .order('delivery_deadline', ascending: true);

    return (response as List)
        .map((json) => MarketplaceOrder.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Confirm a payment (EXECOM only).
  Future<void> confirmOrder(String orderId, String adminId) async {
    await _client.from('marketplace_orders').update({
      'order_status': 'payment_confirmed',
      'verified_by':  adminId,
      'verified_at':  DateTime.now().toIso8601String(),
    }).eq('id', orderId);
  }

  /// Reject a payment (EXECOM only).
  Future<void> rejectOrder(String orderId) async {
    await _client.from('marketplace_orders').update({
      'order_status': 'cancelled',
    }).eq('id', orderId);
  }

  /// Mark an order as delivered (EXECOM only).
  Future<void> markDelivered(String orderId) async {
    await _client.from('marketplace_orders').update({
      'order_status': 'delivered',
    }).eq('id', orderId);
  }

  /// Mark an order as refunded (EXECOM only).
  Future<void> markRefunded(String orderId) async {
    await _client.from('marketplace_orders').update({
      'order_status': 'refunded',
    }).eq('id', orderId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXECOM — Listings
  // ══════════════════════════════════════════════════════════════════════════

  /// Fetch listings pending EXECOM review.
  Future<List<MarketplaceListing>> fetchPendingListings() async {
    final response = await _client
        .from('marketplace_listings')
        .select('*, profiles(full_name, department, admission_year)')
        .eq('status', 'pending_review')
        .order('created_at', ascending: true);

    return (response as List)
        .map((json) => MarketplaceListing.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Approve a listing (set status to live).
  Future<void> approveListing(String listingId) async {
    await _client.from('marketplace_listings').update({
      'status': 'live',
    }).eq('id', listingId);
  }

  /// Reject a listing (set status to removed).
  Future<void> rejectListing(String listingId) async {
    await _client.from('marketplace_listings').update({
      'status': 'removed',
    }).eq('id', listingId);
  }
}
