import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:async';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/bouncing_balls_loader.dart';

class DashboardCarousel extends StatefulWidget {
  const DashboardCarousel({super.key});

  @override
  State<DashboardCarousel> createState() => _DashboardCarouselState();
}

class _DashboardCarouselState extends State<DashboardCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _autoScrollTimer;
  
  List<Map<String, dynamic>> _carouselItems = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _autoScrollTimer?.cancel();
    if (_carouselItems.isEmpty) return;
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_pageController.hasClients) {
        final nextPage = (_currentPage + 1) % _carouselItems.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        );
      }
    });
  }

  Future<void> _fetchData() async {
    try {
      final items = <Map<String, dynamic>>[];

      // 1. Fetch Events from website
      try {
        final res = await http.get(Uri.parse('https://istesctce.in/events.html')).timeout(const Duration(seconds: 8));
        if (res.statusCode == 200) {
          final html = res.body;
          
          // Basic parser using RegEx to extract titles, descriptions, and statuses
          final cardRegex = RegExp(
            r'class="event-card-item"[^>]*>.*?<div class="meta-top">([^<]+)</div>.*?<h3>([^<]+)</h3>.*?<p>([^<]+)</p>',
            dotAll: true,
          );
          
          final matches = cardRegex.allMatches(html);
          for (final m in matches) {
            final status = m.group(1)?.trim() ?? '';
            final title = m.group(2)?.trim() ?? '';
            final desc = m.group(3)?.trim() ?? '';

            if (status.toUpperCase() == 'ONGOING' || status.toUpperCase() == 'UPCOMING') {
              items.add({
                'type': 'event',
                'title': title,
                'desc': desc,
                'status': status.toUpperCase(),
                'icon': status.toUpperCase() == 'ONGOING' ? '🔥' : '⏳',
              });
            }
          }
        }
      } catch (e) {
        debugPrint('Error fetching website events: $e');
      }

      // Fallback for events if network fails or scraper gets empty results
      if (items.isEmpty) {
        items.addAll([
          {
            'type': 'event',
            'title': 'Internship Initiative',
            'desc': 'ISTE SCT SC Internship Initiative presented by SWAS. Your internship hub awaits.',
            'status': 'ONGOING',
            'icon': '🚀',
          },
          {
            'type': 'event',
            'title': 'Mentron 2.0',
            'desc': 'The ultimate mentorship program returns.',
            'status': 'ONGOING',
            'icon': '🔥',
          },
        ]);
      }

      // 2. Fetch Most Viewed Subject
      if (mounted) {
        try {
          final supabase = Provider.of<SupabaseService>(context, listen: false).client;
          final res = await supabase.rpc('get_most_viewed_subject');
          
          if (res != null && (res as List).isNotEmpty) {
            final first = res[0] as Map<String, dynamic>;
            final subjectName = first['subject_name'] ?? 'General';
            final totalViews = first['total_views'] ?? 0;
            final noteCount = first['note_count'] ?? 0;

            items.add({
              'type': 'subject',
              'title': subjectName,
              'desc': 'This is the most viewed subject with $totalViews views across $noteCount notes!',
              'status': 'TRENDING',
              'icon': '📚',
              'views': totalViews,
              'notes': noteCount,
            });
          }
        } catch (e) {
          debugPrint('Error fetching trending subject: $e');
        }
      }

      if (mounted) {
        setState(() {
          _carouselItems = items;
          _loading = false;
        });
        _startAutoScroll();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Container(
          height: 180,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: const Center(
            child: BouncingBallsLoader(),
          ),
        ),
      );
    }

    if (_carouselItems.isEmpty) return const SizedBox();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        children: [
          SizedBox(
            height: 190,
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (idx) => setState(() => _currentPage = idx),
              itemCount: _carouselItems.length,
              itemBuilder: (context, index) {
                final item = _carouselItems[index];
                final isEvent = item['type'] == 'event';
                
                final cardColor = isEvent
                    ? (item['status'] == 'ONGOING' ? AppTheme.accentPrimary : AppTheme.accentTertiary)
                    : AppTheme.accentSecondary;

                return AnimatedBuilder(
                  animation: _pageController,
                  builder: (context, child) {
                    return child!;
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      gradient: LinearGradient(
                        colors: isEvent
                            ? [
                                cardColor.withOpacity(0.8),
                                cardColor.darken(0.3).withOpacity(0.9),
                              ]
                            : [
                                const Color(0xFF6C63FF),
                                const Color(0xFF3F3D56),
                              ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: cardColor.withOpacity(0.25),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        // Decorative mesh background
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: Opacity(
                              opacity: 0.08,
                              child: GridPaper(
                                color: Theme.of(context).colorScheme.onSurface,
                                interval: 30,
                                subdivisions: 1,
                                child: Container(),
                              ),
                            ),
                          ),
                        ),
                        // Corner badge
                        Positioned(
                          top: 16,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withOpacity(0.25)),
                            ),
                            child: Text(
                              item['status'],
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ),
                        // Content
                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    item['icon'],
                                    style: const TextStyle(fontSize: 24),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      isEvent ? 'ISTE EVENT' : 'TRENDING SUBJECT',
                                      style: TextStyle(
                                        color: Colors.white.withOpacity(0.6),
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                item['title'],
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSurface,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['desc'],
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  height: 1.4,
                                ),
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
          const SizedBox(height: 12),
          // Page indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_carouselItems.length, (idx) {
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentPage == idx ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: _currentPage == idx ? AppTheme.accentSecondary : Colors.white24,
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05);
  }
}

extension on Color {
  Color darken(double amount) {
    assert(amount >= 0 && amount <= 1);
    final f = 1 - amount;
    return Color.fromARGB(
      alpha,
      (red * f).round(),
      (green * f).round(),
      (blue * f).round(),
    );
  }
}

