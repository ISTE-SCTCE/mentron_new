import 'package:flutter_test/flutter_test.dart';
import 'package:campus_app/live/profile_rules.dart';

void main() {
  final profile = {
    'id': 'user',
    'status': 'active',
    'is_iste_member': true,
    'iste_membership_id': 'ISTE-1',
    'expiry_date': '2026-10-18',
  };
  test('membership expires at the end of the India calendar day', () {
    expect(
      activeMembership(profile, now: DateTime.parse('2026-10-18T18:29:59Z')),
      isTrue,
    );
    expect(
      activeMembership(profile, now: DateTime.parse('2026-10-18T18:30:00Z')),
      isFalse,
    );
    expect(activeMembership({...profile, 'iste_membership_id': ''}), isFalse);
  });
  test('inactive and suspended profiles cannot claim membership', () {
    expect(activeMembership({...profile, 'status': 'suspended'}), isFalse);
    expect(
      activeMembership({...profile, 'suspended_until': '2099-01-01T00:00:00Z'}),
      isFalse,
    );
  });
  test('profile editing strips authority claims and rejects empty names', () {
    expect(
      profilePatch({
        'name': ' Alex ',
        'role': 'chairman',
        'is_iste_member': true,
        'email': 'other@example.test',
      }),
      {'name': 'Alex'},
    );
    expect(() => profilePatch({'name': '  '}), throwsArgumentError);
  });
}
