import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import 'event_detail_screen.dart';
import '../../../core/utils/app_transitions.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});
  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('event_cal')
          .select('*')
          .order('created_at', ascending: false);
      if (mounted) setState(() { _events = List<Map<String, dynamic>>.from(response); _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(children: [
          const Text('EXPERIENCES', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Upcoming Events', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            : _events.isEmpty
                ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Text('📅', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 16),
                    const Text('Stay Tuned for New Events', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                  ]).animate().fadeIn())
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(24, 120, 24, 100),
                    itemCount: _events.length,
                    itemBuilder: (context, index) => RepaintBoundary(child: _buildEventCard(_events[index], index)),
                  ),
      ),
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => Navigator.push(context, AppTransitions.slideLeft(
          EventDetailScreen(eventId: event['id'].toString()),
        )),
        child: GlassContainer(
          padding: const EdgeInsets.all(28),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppTheme.accentPrimary.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: const Icon(Icons.event_rounded, color: AppTheme.accentPrimary, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(child: Text(event['event_name'] ?? 'Event', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white))),
              const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 14),
            ]),
            if (event['venue'] != null) ...[
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.location_on_rounded, color: AppTheme.accentSecondary, size: 14),
                const SizedBox(width: 6),
                Text(event['venue'], style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
              ]),
            ],
            if (event['description'] != null && event['description'].toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(event['description'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.5)),
            ],
            const SizedBox(height: 16),
            const Text('VIEW EVENT →', style: TextStyle(color: AppTheme.accentPrimary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
          ]),
        ),
      ),
    ).animate().fadeIn(delay: (index * 80).ms).slideY(begin: 0.05);
  }
}
