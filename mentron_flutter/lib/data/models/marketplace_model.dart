class MarketplaceItem {
  final String id;
  final String title;
  final String description;
  final double price;
  final String imageUrl;
  final String sellerId;
  final bool isSold;
  final DateTime createdAt;
  final String? sellerName;

  MarketplaceItem({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.sellerId,
    required this.isSold,
    required this.createdAt,
    this.sellerName,
  });

  factory MarketplaceItem.fromJson(Map<String, dynamic> json) {
    return MarketplaceItem(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      price: (json['price'] as num).toDouble(),
      imageUrl: json['image_url'],
      sellerId: json['seller_id'],
      isSold: json['is_sold'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
      sellerName: json['profiles']?['full_name'],
    );
  }
}
