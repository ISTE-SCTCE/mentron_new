import 'dart:async';
import 'package:flutter/material.dart';
import 'account_repository.dart';
import '../core/theme/world_theme.dart';
import 'account_screen.dart';
import 'live_shell.dart';

class MentronLiveApp extends StatelessWidget {
  const MentronLiveApp({super.key, required this.configured});
  final bool configured;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Mentron+',
    debugShowCheckedModeBanner: false,
    theme: campusTheme(CampusWorld.learn),
    home: configured
        ? const LiveGate()
        : const Scaffold(
            body: SafeArea(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(30),
                  child: Text(
                    'Unable to connect. Please contact ISTE support.',
                  ),
                ),
              ),
            ),
          ),
  );
}

class LiveGate extends StatefulWidget {
  const LiveGate({super.key});
  @override
  State<LiveGate> createState() => _LiveGateState();
}

class _LiveGateState extends State<LiveGate> with WidgetsBindingObserver {
  StreamSubscription<AccountChange>? subscription;
  Map<String, dynamic>? profile;
  String? error;
  bool loading = true;
  bool recovering = false;
  int generation = 0;
  final account = AccountRepository();
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    subscription = account.changes.listen((event) {
      if (event.signedOut) {
        setState(() => recovering = false);
      }
      if (event.recovery) {
        setState(() => recovering = true);
        return;
      }
      Future.microtask(refresh);
    });
    refresh();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) refresh();
  }

  Future<void> refresh() async {
    final version = ++generation;
    if (!account.hasSession) {
      if (mounted) {
        setState(() {
          profile = null;
          loading = false;
          error = null;
        });
      }
      return;
    }
    try {
      final row = await account.profile();
      if (mounted && version == generation) {
        setState(() {
          profile = row;
          loading = false;
          error = null;
        });
      }
    } catch (failure) {
      if (mounted && version == generation) {
        setState(() {
          loading = false;
          profile = null;
          error = failure is AccountFailure
              ? failure.message
              : 'Unable to load your account. Please try again or log out.';
        });
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    generation++;
    subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (recovering) {
      return AccountScreen(
        recovery: true,
        onRecovered: () {
          setState(() => recovering = false);
          refresh();
        },
      );
    }
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(error!),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: refresh,
                  child: const Text('Try again'),
                ),
                TextButton(
                  onPressed: () => account.signOut(),
                  child: const Text('Log out'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    if (profile == null) return const AccountScreen();
    return LiveShell(profile: profile!, refreshProfile: refresh);
  }
}
