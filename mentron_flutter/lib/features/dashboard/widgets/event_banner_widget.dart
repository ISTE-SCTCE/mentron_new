import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';

class EventBannerWidget extends StatefulWidget {
  const EventBannerWidget({super.key});

  @override
  State<EventBannerWidget> createState() => _EventBannerWidgetState();
}

class _EventBannerWidgetState extends State<EventBannerWidget> {
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  final PageController _pageController = PageController(viewportFraction: 0.88);
  int _currentPage = 0;

  static const List<List<Color>> _gradients = [
    [Color(0xFF1A0533), Color(0xFF3D1A7A), Color(0xFF6B3FA0)],
    [Color(0xFF031A33), Color(0xFF0A3D7A), Color(0xFF1565C0)],
    [Color(0xFF0D2818), Color(0xFF1A5C35), Color(0xFF2E7D52)],
    [Color(0xFF330D0D), Color(0xFF7A1A1A), Color(0xFFC0392B)],
    [Color(0xFF1A1200), Color(0xFF7A5600), Color(0xFFB08000)],
    [Color(0xFF001A2E), Color(0xFF003366), Color(0xFF0055A4)],
  ];

  static const List<String> _emojis = ['⚡', '🎯', '🚀', '🏆', '🎓', '🌟', '📡', '🎪'];
  static const List<String> _bannerTypes = [
    'Workshop', 'Seminar', 'Cultural Fest', 'Tech Talk', 'Hackathon',
    'Competition', 'Exhibition', 'Webinar',
  ];

  @override
  void initState() {
    super.initState();
    _fetchEvents();
    _startAutoScroll();
  }

  Future<void> _fetchEvents() async {
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false).client;
      final now = DateTime.now().toIso8601String().substring(0, 10);
      final response = await supabase
          .from('event_cal')
          .select('id, event_name, event_date, venue')
          .gte('event_date', now)
          .order('event_date', ascending: true)
          .limit(10);

      if (mounted) {
        setState(() {
          _events = List<Map<String, dynamic>>.from(response);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startAutoScroll() {
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted || _events.isEmpty) return;
      _autoScroll();
    });
  }

  void _autoScroll() {
    if (!mounted) return;
    Future.delayed(const Duration(seconds: 4), () {
      if (!mounted) return;
      final nextPage = (_currentPage + 1) % (_events.isEmpty ? 1 : _events.length);
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
      _autoScroll();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final date = DateTime.parse(isoDate);
      return DateFormat('EEE, d MMM').format(date);
    } catch (_) {
      return isoDate;
    }
  }

  String _getDaysUntil(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final date = DateTime.parse(isoDate);
      final diff = date.difference(DateTime.now()).inDays;
      if (diff == 0) return 'TODAY';
      if (diff == 1) return 'TOMORROW';
      if (diff < 0) return 'PAST';
      return 'IN $diff DAYS';
    } catch (_) {
      return '';
    }
  }

  Color _getDaysColor(String? isoDate) {
    if (isoDate == null) return Colors.grey;
    try {
      final date = DateTime.parse(isoDate);
      final diff = date.difference(DateTime.now()).inDays;
      if (diff == 0) return Colors.redAccent;
      if (diff <= 3) return Colors.orangeAccent;
      if (diff <= 7) return Colors.yellowAccent;
      return Colors.greenAccent;
    } catch (_) {
      return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return _buildSkeleton();
    }

    if (_events.isEmpty) {
      return _buildEmptyState();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section label
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Row(
            children: [
              Container(
                width: 3,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.accentSecondary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'UPCOMING EVENTS',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentSecondary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.accentSecondary.withOpacity(0.4)),
                ),
                child: Text(
                  '${_events.length}',
                  style: TextStyle(
                    color: AppTheme.accentSecondary,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Banner cards as a pager
        SizedBox(
          height: 200,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemCount: _events.length,
            itemBuilder: (context, index) {
              final event = _events[index];
              final gradient = _gradients[index % _gradients.length];
              final emoji = _emojis[index % _emojis.length];
              final daysLabel = _getDaysUntil(event['event_date']);
              final daysColor = _getDaysColor(event['event_date']);

              return AnimatedScale(
                scale: _currentPage == index ? 1.0 : 0.94,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: LinearGradient(
                      colors: gradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: gradient[1].withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Background pattern
                      Positioned(
                        right: -20,
                        top: -20,
                        child: Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.04),
                          ),
                        ),
                      ),
                      Positioned(
                        right: 20,
                        bottom: -30,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.03),
                          ),
                        ),
                      ),
                      // Neon top bar
                      Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                            gradient: LinearGradient(
                              colors: [Colors.transparent, gradient[2], Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                      // Content
                      Padding(
                        padding: const EdgeInsets.all(22),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Top row: emoji + countdown badge
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  width: 46,
                                  height: 46,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                                  ),
                                  child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: daysColor.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: daysColor.withOpacity(0.5)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 5, height: 5,
                                        decoration: BoxDecoration(
                                          color: daysColor,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        daysLabel,
                                        style: TextStyle(
                                          color: daysColor,
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            // Event name
                            Text(
                              event['event_name'] ?? 'Event',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                                height: 1.2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            // Date + venue
                            Row(
                              children: [
                                Icon(Icons.calendar_today_rounded, size: 11, color: Colors.white54),
                                const SizedBox(width: 4),
                                Text(
                                  _formatDate(event['event_date']),
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                if (event['venue'] != null && (event['venue'] as String).isNotEmpty) ...[
                                  const SizedBox(width: 12),
                                  Icon(Icons.location_on_rounded, size: 11, color: Colors.white38),
                                  const SizedBox(width: 3),
                                  Expanded(
                                    child: Text(
                                      event['venue'] as String,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white38,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Dot indicators
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_events.length, (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: _currentPage == i ? 16 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: _currentPage == i ? AppTheme.accentSecondary : Colors.white24,
              borderRadius: BorderRadius.circular(3),
            ),
          )),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildSkeleton() {
    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Center(
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
    );
  }

  Widget _buildEmptyState() {
    return GlassContainer(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          const Text('🗓️', style: TextStyle(fontSize: 36)),
          const SizedBox(height: 12),
          const Text(
            'No upcoming events',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Check back later',
            style: TextStyle(
              color: Colors.white.withOpacity(0.2),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
