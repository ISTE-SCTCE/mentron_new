bool activeProfile(Map<String, dynamic> profile, {DateTime? now}) {
  final until = DateTime.tryParse(profile['suspended_until']?.toString() ?? '');
  return profile['id'] != null &&
      profile['status'] == 'active' &&
      (until == null || !until.isAfter(now ?? DateTime.now()));
}

bool activeMembership(Map<String, dynamic> profile, {DateTime? now}) {
  final current = now ?? DateTime.now();
  final india = current.toUtc().add(const Duration(hours: 5, minutes: 30));
  final day =
      '${india.year.toString().padLeft(4, '0')}-${india.month.toString().padLeft(2, '0')}-${india.day.toString().padLeft(2, '0')}';
  final expiry = profile['expiry_date']?.toString();
  return activeProfile(profile, now: current) &&
      profile['is_iste_member'] == true &&
      (profile['iste_membership_id']?.toString().trim().isNotEmpty ?? false) &&
      (expiry == null || expiry.isEmpty || expiry.compareTo(day) >= 0);
}

Map<String, dynamic> profilePatch(Map<String, dynamic> input) {
  final result = <String, dynamic>{};
  for (final key in [
    'name',
    'phone',
    'roll_number',
    'branch',
    'year',
    'college',
  ]) {
    if (!input.containsKey(key)) continue;
    final text = input[key]?.toString().trim() ?? '';
    final max = key == 'name' ? 120 : 200;
    result[key] = text.length > max ? text.substring(0, max) : text;
  }
  if (result.containsKey('name') && result['name'].isEmpty) {
    throw ArgumentError('Please enter your name.');
  }
  return result;
}
