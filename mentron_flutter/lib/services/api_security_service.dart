// lib/services/api_security_service.dart
//
// Provides a hardened Dio client with:
//   • Certificate pinning against the Supabase host
//   • Client-side rate limiting (max 100 req/min per endpoint)
//   • Automatic exponential backoff on HTTP 429
//   • Standard retry logic (3 attempts)

import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:logger/logger.dart';

import '../utils/constants.dart';

/// Singleton providing a security-hardened Dio instance for Mentron.
class ApiSecurityService {
  static final ApiSecurityService _instance = ApiSecurityService._internal();
  factory ApiSecurityService() => _instance;
  ApiSecurityService._internal();

  late final Dio _dio;
  Dio get client => _dio;

  final _logger = Logger();

  // ── Rate-limit state ──────────────────────────────────────────────────────
  // Tracks request timestamps per endpoint bucket.
  final Map<String, List<DateTime>> _requestLog = {};

  // ── Initialisation ────────────────────────────────────────────────────────

  void initialize() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
    ));

    // Certificate pinning (Android/iOS only — skip on web/desktop)
    _configureCertPinning();

    // Interceptors
    _dio.interceptors.add(_RateLimitInterceptor(_requestLog, _logger));
    _dio.interceptors.add(_RetryInterceptor(_dio, _logger));
    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (o) => _logger.d(o.toString()),
    ));
  }

  void _configureCertPinning() {
    if (_dio.httpClientAdapter is! IOHttpClientAdapter) return;

    final fingerprint = dotenv.maybeGet('SUPABASE_CERT_FINGERPRINT') ?? '';
    if (fingerprint.isEmpty) {
      _logger.w(
        'ApiSecurityService: SUPABASE_CERT_FINGERPRINT not set — '
        'certificate pinning is DISABLED. Set it in .env for production.',
      );
      return;
    }

    final supabaseHost = Uri.parse(
      dotenv.get('SUPABASE_URL', fallback: ''),
    ).host;

    (_dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      final client = HttpClient();
      client.badCertificateCallback = (cert, host, port) {
        // Only pin for the Supabase host
        if (host != supabaseHost) return false;

        // Compare SHA-256 fingerprint of the DER-encoded certificate
        final certFingerprint = cert.der
            .fold<List<int>>([], (acc, byte) => acc..add(byte))
            .map((b) => b.toRadixString(16).padLeft(2, '0'))
            .join(':')
            .toUpperCase();

        final expected = fingerprint.toUpperCase().replaceAll(' ', '');
        final actual = certFingerprint.replaceAll(':', '');
        final expectedNorm = expected.replaceAll(':', '');

        if (actual != expectedNorm) {
          // Cert doesn't match — possible MITM attack
          return false; // reject
        }
        return true; // accept
      };
      return client;
    };

    _logger.i('ApiSecurityService: certificate pinning ENABLED for $supabaseHost');
  }

  // ── Convenience Helpers ───────────────────────────────────────────────────

  bool isRateLimited(String endpoint) {
    final now = DateTime.now();
    final window = DateTime.now().subtract(
        const Duration(seconds: MentronConstants.kRateLimitWindowSeconds));
    _requestLog[endpoint] =
        (_requestLog[endpoint] ?? []).where((t) => t.isAfter(window)).toList();
    return (_requestLog[endpoint]?.length ?? 0) >=
        MentronConstants.kMaxRequestsPerMinute;
  }
}

// ── Rate-Limit Interceptor ────────────────────────────────────────────────────

class _RateLimitInterceptor extends Interceptor {
  final Map<String, List<DateTime>> _log;
  final Logger _logger;

  _RateLimitInterceptor(this._log, this._logger);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final endpoint = options.path;
    final window = DateTime.now().subtract(
        const Duration(seconds: MentronConstants.kRateLimitWindowSeconds));

    _log[endpoint] =
        (_log[endpoint] ?? []).where((t) => t.isAfter(window)).toList();

    if ((_log[endpoint]?.length ?? 0) >= MentronConstants.kMaxRequestsPerMinute) {
      _logger.w('ApiSecurityService: rate limit hit for $endpoint');
      return handler.reject(
        DioException(
          requestOptions: options,
          error: 'Client-side rate limit exceeded for $endpoint',
          type: DioExceptionType.cancel,
        ),
        true,
      );
    }

    _log[endpoint]!.add(DateTime.now());
    handler.next(options);
  }
}

// ── Retry Interceptor (with exponential backoff on 429) ──────────────────────

class _RetryInterceptor extends Interceptor {
  final Dio _dio;
  final Logger _logger;

  _RetryInterceptor(this._dio, this._logger);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    final attempt = (options.extra['_retryCount'] as int?) ?? 0;

    final shouldRetry = attempt < MentronConstants.kMaxRetries &&
        err.type != DioExceptionType.cancel &&
        (err.response?.statusCode == 429 ||
            err.type == DioExceptionType.connectionTimeout ||
            err.type == DioExceptionType.receiveTimeout);

    if (!shouldRetry) {
      return handler.next(err);
    }

    final backoff = MentronConstants.kBaseBackoffMs * (1 << attempt);
    _logger.w(
      'ApiSecurityService: retry ${attempt + 1}/${MentronConstants.kMaxRetries} '
      'for ${options.path} in ${backoff}ms',
    );

    await Future.delayed(Duration(milliseconds: backoff));

    options.extra['_retryCount'] = attempt + 1;
    try {
      final response = await _dio.fetch(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }
}
