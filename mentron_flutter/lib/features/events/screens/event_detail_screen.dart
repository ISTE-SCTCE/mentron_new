import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});
  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Map<String, dynamic>? _event;
  bool _isRegistered = false;
  bool _isLoading = true;
  bool _isRegistering = false;

  @override
  void initState() {
    super.initState();
    _fetchEvent();
  }

  Future<void> _fetchEvent() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    try {
      final event = await supabase.client.from('event_cal').select('*').eq('id', widget.eventId).maybeSingle();
      bool registered = false;
      if (userId != null) {
        final reg = await supabase.client.from('registrations').select('*').eq('event_id', widget.eventId).eq('user_id', userId).maybeSingle();
        registered = reg != null;
      }
      if (mounted) setState(() { _event = event; _isRegistered = registered; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    setState(() => _isRegistering = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) return;
    try {
      await supabase.client.from('registrations').insert({'event_id': widget.eventId, 'user_id': userId});
      if (mounted) setState(() { _isRegistered = true; _isRegistering = false; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text("You're registered! We'll see you there 🎉")));
    } catch (e) {
      if (mounted) { setState(() => _isRegistering = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e)))); }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _event == null
                ? const Center(child: Text('Event not found', style: TextStyle(color: AppTheme.textMuted)))
                : SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 100, 24, 100),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('EVENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)).animate().fadeIn(),
                      const SizedBox(height: 8),
                      Text(_event!['event_name'] ?? '', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, height: 1.1)).animate().fadeIn(delay: 100.ms),
                      const SizedBox(height: 16),
                      if (_event!['venue'] != null)
                        Row(children: [
                          const Icon(Icons.location_on_rounded, color: AppTheme.accentSecondary, size: 14),
                          const SizedBox(width: 6),
                          Text(_event!['venue'], style: const TextStyle(color: AppTheme.accentSecondary, fontWeight: FontWeight.bold)),
                        ]).animate().fadeIn(delay: 150.ms),
                      const SizedBox(height: 24),
                      GlassContainer(
                        padding: const EdgeInsets.all(24),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('ABOUT EVENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
                          const SizedBox(height: 12),
                          Text(_event!['description'] ?? 'Join us for this exciting event! More details will be shared soon.', style: const TextStyle(color: AppTheme.textMuted, height: 1.7, fontSize: 14)),
                        ]),
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 24),
                      // Registration Card
                      GlassContainer(
                        padding: const EdgeInsets.all(28),
                        border: Border.all(color: _isRegistered ? Colors.green.withOpacity(0.4) : AppTheme.accentPrimary.withOpacity(0.3)),
                        child: _isRegistered
                            ? Column(children: [
                                const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 48),
                                const SizedBox(height: 16),
                                const Text("You're In!", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)),
                                const SizedBox(height: 8),
                                const Text('You have successfully registered.\nWe look forward to seeing you there!', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textMuted, height: 1.6)),
                                const SizedBox(height: 16),
                                Container(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8), decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.green.withOpacity(0.2))),
                                  child: const Text('STATUS: CONFIRMED', style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2))),
                              ])
                            : Column(children: [
                                const Text('Join the Event', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
                                const SizedBox(height: 8),
                                const Text('Secure your spot today.\nRegistration is free for all members.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textMuted, height: 1.6)),
                                const SizedBox(height: 24),
                                SizedBox(width: double.infinity, child: ElevatedButton(
                                  onPressed: _isRegistering ? null : _register,
                                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentPrimary, foregroundColor: Colors.white),
                                  child: _isRegistering ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('REGISTER NOW'),
                                )),
                              ]),
                      ).animate().fadeIn(delay: 300.ms),
                    ]),
                  ),
      ),
    );
  }
}
