// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceListingView — data model for marketplace_listing_views table
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceListingView {
  final String id;
  final String listingId;
  final String viewerId;
  final DateTime viewedAt;

  // Joined from profiles
  final String? viewerName;
  final String? viewerDepartment;
  final int? viewerAdmissionYear;

  const MarketplaceListingView({
    required this.id,
    required this.listingId,
    required this.viewerId,
    required this.viewedAt,
    this.viewerName,
    this.viewerDepartment,
    this.viewerAdmissionYear,
  });

  factory MarketplaceListingView.fromJson(Map<String, dynamic> json) {
    final profileJson = json['profiles'] as Map<String, dynamic>?;
    return MarketplaceListingView(
      id:                  json['id'] as String,
      listingId:           json['listing_id'] as String,
      viewerId:            json['viewer_id'] as String,
      viewedAt:            DateTime.parse(json['viewed_at'] as String),
      viewerName:          profileJson?['full_name'] as String?,
      viewerDepartment:    profileJson?['department'] as String?,
      viewerAdmissionYear: profileJson?['admission_year'] as int?,
    );
  }

  /// Returns a human-readable relative timestamp, e.g. "Viewed 2 hours ago"
  String get relativeTime {
    final diff = DateTime.now().difference(viewedAt);
    if (diff.inMinutes < 1)  return 'Viewed just now';
    if (diff.inMinutes < 60) return 'Viewed ${diff.inMinutes}m ago';
    if (diff.inHours < 24)   return 'Viewed ${diff.inHours}h ago';
    return 'Viewed ${diff.inDays}d ago';
  }
}
