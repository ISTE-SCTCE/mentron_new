enum PlatformProduct { mlynq, mentron }
extension ProductDetails on PlatformProduct {
  String get label => this == PlatformProduct.mlynq ? 'Mlynq' : 'Mentron';
  String get key => name;
  String get flag => 'is_${key}_user';
}
bool isActiveProfile(Map<String, dynamic>? profile, {DateTime? now}) {
  if (profile == null || profile['status'] != 'active') return false;
  final until = DateTime.tryParse(profile['suspended_until']?.toString() ?? '');
  return until == null || !until.isAfter(now ?? DateTime.now());
}
bool canOpenProduct(Map<String, dynamic>? profile, PlatformProduct product) {
  return isActiveProfile(profile) && profile?[product.flag] == true;
}
