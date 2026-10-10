import 'package:flutter_test/flutter_test.dart';
import '../lib/platform/file_headers.dart';

void main() {
  test('private platform files receive the account token', () {
    expect(platformFileHeaders('https://mentron.istesctce.in/api/files/notes_bucket/a.pdf', accessToken: 'fixture'),
        {'Authorization': 'Bearer fixture'});
  });
  test('external, insecure, alternate-port and unrelated URLs receive no token', () {
    for (final url in [
      'https://example.com/api/files/a.pdf',
      'https://mentron.istesctce.in.evil.example/api/files/a.pdf',
      'http://mentron.istesctce.in/api/files/a.pdf',
      'https://mentron.istesctce.in:444/api/files/a.pdf',
      'https://mentron.istesctce.in/notes/a.pdf',
      'https://someone@mentron.istesctce.in/api/files/a.pdf',
    ]) {
      expect(platformFileHeaders(url, accessToken: 'fixture'), isEmpty, reason: url);
    }
  });
  test('website-relative migrated files resolve to the trusted host', () {
    expect(platformFileUrl('/api/files/notes_bucket/a.pdf'), 'https://mentron.istesctce.in/api/files/notes_bucket/a.pdf');
    expect(platformFileHeaders('/api/files/notes_bucket/a.pdf', accessToken: 'fixture'), {'Authorization': 'Bearer fixture'});
  });
}
