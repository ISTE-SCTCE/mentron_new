import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/marketplace_order.dart';

class BuyersService {
  final SupabaseClient _client;

  BuyersService(this._client);

  /// Fetch all marketplace orders with joined product and buyer profile information
  Future<List<MarketplaceOrder>> fetchAllOrders() async {
    final response = await _client
        .from('marketplace_orders')
        .select('*, marketplace_listings(*, profiles!marketplace_listings_seller_id_fkey(*)), profiles!marketplace_orders_buyer_id_fkey(*)')
        .order('created_at', ascending: false);

    final list = response as List? ?? [];
    return list.map((json) => MarketplaceOrder.fromJson(json as Map<String, dynamic>)).toList();
  }
}
