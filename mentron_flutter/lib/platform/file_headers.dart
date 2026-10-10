import 'package:supabase_flutter/supabase_flutter.dart';

String platformFileUrl(String url) => url.startsWith('/api/files/')
    ? 'https://mentron.istesctce.in$url' : url;

/// Only send the shared account token to our authenticated file endpoint.
Map<String, String> platformFileHeaders(String url, {String? accessToken}) {
  final uri = Uri.tryParse(platformFileUrl(url));
  if (uri == null || uri.scheme != 'https' ||
      uri.host != 'mentron.istesctce.in' || uri.port != 443 ||
      uri.userInfo.isNotEmpty || !uri.path.startsWith('/api/files/')) {
    return const {};
  }
  final token = accessToken ?? Supabase.instance.client.auth.currentSession?.accessToken;
  return token == null || token.isEmpty ? const {} : {'Authorization': 'Bearer $token'};
}
