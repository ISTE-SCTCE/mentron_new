// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceListing — data model for marketplace_listings table
// ─────────────────────────────────────────────────────────────────────────────

enum ListingCategory {
  textbook,
  electronics,
  projectComponents,
  stationery,
  other;

  static ListingCategory fromString(String? value) {
    switch (value) {
      case 'textbook':           return textbook;
      case 'electronics':        return electronics;
      case 'project_components': return projectComponents;
      case 'stationery':         return stationery;
      default:                   return other;
    }
  }

  String toDbString() {
    switch (this) {
      case textbook:           return 'textbook';
      case electronics:        return 'electronics';
      case projectComponents:  return 'project_components';
      case stationery:         return 'stationery';
      case other:              return 'other';
    }
  }

  String get displayName {
    switch (this) {
      case textbook:           return 'Textbook';
      case electronics:        return 'Electronics';
      case projectComponents:  return 'Project Components';
      case stationery:         return 'Stationery';
      case other:              return 'Other';
    }
  }
}

enum ListingCondition {
  newCondition,
  likeNew,
  used;

  static ListingCondition fromString(String? value) {
    switch (value) {
      case 'new':      return newCondition;
      case 'like_new': return likeNew;
      default:         return used;
    }
  }

  String toDbString() {
    switch (this) {
      case newCondition: return 'new';
      case likeNew:      return 'like_new';
      case used:         return 'used';
    }
  }

  String get displayName {
    switch (this) {
      case newCondition: return 'New';
      case likeNew:      return 'Like New';
      case used:         return 'Used';
    }
  }
}

enum ListingStatus {
  pendingReview,
  live,
  sold,
  removed;

  static ListingStatus fromString(String? value) {
    switch (value) {
      case 'pending_review': return pendingReview;
      case 'live':           return live;
      case 'sold':           return sold;
      case 'removed':        return removed;
      default:               return pendingReview;
    }
  }

  String toDbString() {
    switch (this) {
      case pendingReview: return 'pending_review';
      case live:          return 'live';
      case sold:          return 'sold';
      case removed:       return 'removed';
    }
  }

  String get displayName {
    switch (this) {
      case pendingReview: return 'Pending Review';
      case live:          return 'Live';
      case sold:          return 'Sold';
      case removed:       return 'Removed';
    }
  }
}

class MarketplaceListing {
  final String id;
  final String sellerId;
  final String title;
  final String description;
  final ListingCategory category;
  final ListingCondition condition;
  final double price;
  final List<String> images;
  final ListingStatus status;
  final DateTime createdAt;

  // Joined fields (from profile query)
  final String? sellerName;
  final String? sellerDepartment;
  final int? sellerAdmissionYear;

  const MarketplaceListing({
    required this.id,
    required this.sellerId,
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
    required this.price,
    required this.images,
    required this.status,
    required this.createdAt,
    this.sellerName,
    this.sellerDepartment,
    this.sellerAdmissionYear,
  });

  factory MarketplaceListing.fromJson(Map<String, dynamic> json) {
    final profileJson = json['profiles'] as Map<String, dynamic>?;
    return MarketplaceListing(
      id:                 json['id'] as String,
      sellerId:           json['seller_id'] as String,
      title:              json['title'] as String,
      description:        json['description'] as String? ?? '',
      category:           ListingCategory.fromString(json['category'] as String?),
      condition:          ListingCondition.fromString(json['condition'] as String?),
      price:              (json['price'] as num).toDouble(),
      images:             List<String>.from(json['images'] as List? ?? []),
      status:             ListingStatus.fromString(json['status'] as String?),
      createdAt:          DateTime.parse(json['created_at'] as String),
      sellerName:         profileJson?['full_name'] as String?,
      sellerDepartment:   profileJson?['department'] as String?,
      sellerAdmissionYear: profileJson?['admission_year'] as int?,
    );
  }

  Map<String, dynamic> toInsertJson() => {
    'seller_id':   sellerId,
    'title':       title,
    'description': description,
    'category':    category.toDbString(),
    'condition':   condition.toDbString(),
    'price':       price,
    'images':      images,
    'status':      status.toDbString(),
  };

  String get firstImageUrl => images.isNotEmpty ? images.first : '';

  String get formattedPrice => '₹${price.toStringAsFixed(0)}';
}
