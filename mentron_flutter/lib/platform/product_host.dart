import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' show ProviderScope;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main.dart' show MentronApp;
import '../mlynq/member_app.dart';
import '../core/services/supabase_service.dart';
import '../services/auth_security_service.dart';
import '../services/fcm_service.dart';
import 'product_access.dart';
import 'product_switcher.dart';

class ProductHost extends StatefulWidget {
  const ProductHost({super.key});
  @override
  State<ProductHost> createState() => _ProductHostState();
}

class _ProductHostState extends State<ProductHost> {
  final _client = Supabase.instance.client;
  StreamSubscription<AuthState>? _subscription;
  PlatformProduct _product = PlatformProduct.mentron;
  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _joining = false;
  String? _error;
  int _request = 0;
  @override
  void initState() {
    super.initState();
    _initialize();
    _subscription = _client.auth.onAuthStateChange.listen((state) {
      if (state.event == AuthChangeEvent.signedOut) {
        unawaited(AuthSecurityService().clearAllSecureStorage());
        unawaited(FCMService.instance.unsubscribeFromAllUsersTopic());
      }
      // Do not call Auth methods from inside its event delivery callback.
      Future(() => _loadProfile());
    });
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    _product = prefs.getString('platform_product') == 'mlynq'
        ? PlatformProduct.mlynq
        : PlatformProduct.mentron;
    await _loadProfile();
  }

  Future<void> _loadProfile() async {
    if (!mounted) return;
    final request = ++_request;
    final user = _client.auth.currentUser;
    try {
      final profile = user == null
          ? null
          : await _client
                .from('profiles')
                .select(
                  'id,status,suspended_until,is_mlynq_user,is_mentron_user,is_iste_member',
                )
                .eq('id', user.id)
                .single();
      if (!mounted || request != _request) return;
      setState(() {
        _profile = profile;
        _loading = false;
        _error = null;
      });
    } catch (_) {
      if (mounted && request == _request) {
        setState(() {
          _profile = null;
          _loading = false;
          _error = 'Your account could not be loaded. Please retry.';
        });
      }
    }
  }

  Future<void> _switchTo(PlatformProduct product) async {
    if (_joining || product == _product) return;
    final from = _product.key;
    setState(() {
      _joining = true;
      _error = null;
    });
    try {
      // Claim Mentron's device session before mounting its guarded navigation.
      // Switching products preserves the existing Supabase Auth session.
      if (canOpenProduct(_profile, product) &&
          product == PlatformProduct.mentron) {
        await SupabaseService().sessionGuard.claimSession();
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('platform_product', product.key);
      if (!mounted) return;
      setState(() {
        _product = product;
      });
      if (canOpenProduct(_profile, product))
        await _record('product_switch', {'from': from});
    } catch (_) {
      if (mounted)
        setState(() => _error = 'Could not switch products. Please retry.');
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  Future<void> _join() async {
    setState(() {
      _joining = true;
      _error = null;
    });
    try {
      await _client.rpc(
        'enroll_current_user',
        params: {'p_product': _product.key},
      );
      if (_product == PlatformProduct.mentron)
        await SupabaseService().sessionGuard.claimSession();
      await _loadProfile();
      await _record('enrollment', {});
    } catch (_) {
      if (mounted)
        setState(
          () => _error = 'Could not join. Please try again or contact ISTE.',
        );
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  Future<void> _record(String event, Map<String, dynamic> properties) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    try {
      await _client.from('analytics_events').insert({
        'profile_id': user.id,
        'product': _product.key,
        'event_name': event,
        'properties': {'client': 'flutter', ...properties},
      });
    } catch (_) {
      /* Analytics never prevents product navigation. */
    }
  }

  @override
  void dispose() {
    ++_request;
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = _client.auth.currentUser != null;
    Widget content;
    if (_loading) {
      content = const Center(child: CircularProgressIndicator());
    } else if (signedIn && (_profile == null || !isActiveProfile(_profile))) {
      content = _message(
        _error ?? 'Your account is unavailable. Please contact ISTE.',
        retry: true,
      );
    } else if (signedIn && !canOpenProduct(_profile, _product)) {
      content = Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Join ${_product.label}',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Use your shared ISTE account. Joining this product does not grant ISTE membership.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _joining ? null : _join,
                  child: Text(
                    _joining ? 'Please wait…' : 'Continue to ${_product.label}',
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
                TextButton(
                  onPressed: () => _client.auth.signOut(),
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      );
    } else {
      content = _product == PlatformProduct.mlynq
          ? const ProviderScope(child: MemberApp())
          : const MentronApp();
    }
    return MaterialApp(
      title: 'ISTE · Mlynq & Mentron',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff5f85a2)),
      ),
      home: Scaffold(
        backgroundColor: const Color(0xffebf3fc),
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              ProductSwitcher(
                selected: _product,
                busy: _joining,
                onChanged: _switchTo,
              ),
              Expanded(child: content),
            ],
          ),
        ),
      ),
    );
  }

  Widget _message(String message, {bool retry = false}) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, textAlign: TextAlign.center),
          if (retry)
            TextButton(onPressed: _loadProfile, child: const Text('Retry')),
          TextButton(
            onPressed: () => _client.auth.signOut(),
            child: const Text('Sign out'),
          ),
        ],
      ),
    ),
  );
}
