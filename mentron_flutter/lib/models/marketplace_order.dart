// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceOrder — data model for marketplace_orders table
// ─────────────────────────────────────────────────────────────────────────────

enum OrderStatus {
  pendingVerification,
  paymentConfirmed,
  delivered,
  refunded,
  cancelled;

  static OrderStatus fromString(String? value) {
    switch (value) {
      case 'pending_verification': return pendingVerification;
      case 'payment_confirmed':    return paymentConfirmed;
      case 'delivered':            return delivered;
      case 'refunded':             return refunded;
      case 'cancelled':            return cancelled;
      default:                     return pendingVerification;
    }
  }

  String toDbString() {
    switch (this) {
      case pendingVerification: return 'pending_verification';
      case paymentConfirmed:    return 'payment_confirmed';
      case delivered:           return 'delivered';
      case refunded:            return 'refunded';
      case cancelled:           return 'cancelled';
    }
  }

  String get displayName {
    switch (this) {
      case pendingVerification: return 'Pending Verification';
      case paymentConfirmed:    return 'Payment Confirmed';
      case delivered:           return 'Delivered';
      case refunded:            return 'Refunded';
      case cancelled:           return 'Cancelled';
    }
  }

  bool get isTerminal => this == delivered || this == refunded || this == cancelled;
}

class MarketplaceOrder {
  final String id;
  final String listingId;
  final String buyerId;
  final double amount;
  final String? paymentProofUrl;
  final String? utrNumber;
  final DateTime? disclaimerAcceptedAt;
  final OrderStatus orderStatus;
  final DateTime createdAt;
  final DateTime deliveryDeadline;
  final String? verifiedBy;
  final DateTime? verifiedAt;

  // Joined fields
  final String? listingTitle;
  final List<String>? listingImages;
  final String? buyerName;
  final String? buyerDepartment;
  final int? buyerAdmissionYear;

  const MarketplaceOrder({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.amount,
    this.paymentProofUrl,
    this.utrNumber,
    this.disclaimerAcceptedAt,
    required this.orderStatus,
    required this.createdAt,
    required this.deliveryDeadline,
    this.verifiedBy,
    this.verifiedAt,
    this.listingTitle,
    this.listingImages,
    this.buyerName,
    this.buyerDepartment,
    this.buyerAdmissionYear,
  });

  factory MarketplaceOrder.fromJson(Map<String, dynamic> json) {
    final listingJson = json['marketplace_listings'] as Map<String, dynamic>?;
    final buyerJson   = json['profiles'] as Map<String, dynamic>?;

    return MarketplaceOrder(
      id:                    json['id'] as String,
      listingId:             json['listing_id'] as String,
      buyerId:               json['buyer_id'] as String,
      amount:                (json['amount'] as num).toDouble(),
      paymentProofUrl:       json['payment_proof_url'] as String?,
      utrNumber:             json['utr_number'] as String?,
      disclaimerAcceptedAt:  json['disclaimer_accepted_at'] != null
                               ? DateTime.parse(json['disclaimer_accepted_at'] as String)
                               : null,
      orderStatus:           OrderStatus.fromString(json['order_status'] as String?),
      createdAt:             DateTime.parse(json['created_at'] as String),
      deliveryDeadline:      DateTime.parse(json['delivery_deadline'] as String),
      verifiedBy:            json['verified_by'] as String?,
      verifiedAt:            json['verified_at'] != null
                               ? DateTime.parse(json['verified_at'] as String)
                               : null,
      listingTitle:          listingJson?['title'] as String?,
      listingImages:         listingJson != null
                               ? List<String>.from(listingJson['images'] as List? ?? [])
                               : null,
      buyerName:             buyerJson?['full_name'] as String?,
      buyerDepartment:       buyerJson?['department'] as String?,
      buyerAdmissionYear:    buyerJson?['admission_year'] as int?,
    );
  }

  String get formattedPrice => '₹${amount.toStringAsFixed(0)}';

  String get firstListingImage =>
      (listingImages != null && listingImages!.isNotEmpty) ? listingImages!.first : '';

  Duration get timeUntilDeadline => deliveryDeadline.difference(DateTime.now());

  bool get isOverdue => DateTime.now().isAfter(deliveryDeadline);
}
