import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../core/utils/error_handler.dart';

class EventBannerBottomSheet extends StatefulWidget {
  final List<Map<String, dynamic>> events;
  const EventBannerBottomSheet({super.key, required this.events});

  @override
  State<EventBannerBottomSheet> createState() => _EventBannerBottomSheetState();
}

class _EventBannerBottomSheetState extends State<EventBannerBottomSheet> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _inactivityTimer;
  final Set<String> _registeredEventIds = {};
  bool _isCheckingRegistrations = true;
  bool _isRegistering = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _resetInactivityTimer();
    _checkExistingRegistrations();
  }

  @override
  void dispose() {
    _inactivityTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _resetInactivityTimer() {
    _inactivityTimer?.cancel();
    _inactivityTimer = Timer(const Duration(milliseconds: 3500), () {
      if (mounted) {
        Navigator.of(context).pop();
      }
    });
  }

  Future<void> _checkExistingRegistrations() async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabaseService.currentUser?.id;
    if (userId == null) {
      if (mounted) setState(() => _isCheckingRegistrations = false);
      return;
    }

    try {
      final eventIds = widget.events.map((e) => e['id'].toString()).toList();
      final response = await supabaseService.client
          .from('registrations')
          .select('event_id')
          .eq('user_id', userId)
          .inFilter('event_id', eventIds);

      final registered = (response as List).map((r) => r['event_id'].toString()).toSet();
      if (mounted) {
        setState(() {
          _registeredEventIds.addAll(registered);
          _isCheckingRegistrations = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking registrations: $e');
      if (mounted) setState(() => _isCheckingRegistrations = false);
    }
  }

  Future<void> _handleRegister(Map<String, dynamic> event) async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabaseService.currentUser?.id;

    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to register for events.')),
      );
      return;
    }

    final eventId = event['id'].toString();
    if (_registeredEventIds.contains(eventId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.blueAccent,
          content: Text('You are already registered for "${event['title']}"!'),
        ),
      );
      return;
    }

    setState(() => _isRegistering = true);
    _inactivityTimer?.cancel(); // Freeze timer during active transaction

    try {
      await supabaseService.client.from('registrations').insert({
        'event_id': eventId,
        'user_id': userId,
      });

      HapticFeedback.mediumImpact();
      if (mounted) {
        setState(() {
          _registeredEventIds.add(eventId);
          _isRegistering = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.green,
            content: Text('Registered successfully for "${event['title']}"! 🎉'),
          ),
        );
        _resetInactivityTimer(); // Resume auto-hide countdown
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isRegistering = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Registration failed: ${ErrorHandler.friendly(e)}'),
          ),
        );
        _resetInactivityTimer();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _resetInactivityTimer(),
      onPointerMove: (_) => _resetInactivityTimer(),
      child: GestureDetector(
        onTap: _resetInactivityTimer,
        child: DraggableScrollableSheet(
          initialChildSize: 0.52,
          minChildSize: 0.35,
          maxChildSize: 0.75,
          builder: (context, scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0C0C1E),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  )
                ],
              ),
              child: Stack(
                children: [
                  // Cyberpunk mesh background
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      child: CustomPaint(
                        painter: _GridPainter(Colors.white.withOpacity(0.015)),
                      ),
                    ),
                  ),
                  
                  // Drag Handle & Scroll content
                  Column(
                    children: [
                      const SizedBox(height: 12),
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      
                      // Heading
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'ACTIVE EVENTS',
                                  style: GoogleFonts.shareTechMono(
                                    color: ExecTheme.accentSecondary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 2,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Happening Now',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Carousel View
                      Expanded(
                        child: PageView.builder(
                          controller: _pageController,
                          onPageChanged: (index) {
                            setState(() => _currentPage = index);
                            _resetInactivityTimer();
                          },
                          itemCount: widget.events.length,
                          itemBuilder: (context, index) {
                            final event = widget.events[index];
                            final title = event['title'] ?? 'Untitled';
                            final desc = event['description'] ?? 'No description provided.';
                            final venue = event['venue'] ?? 'TBA';
                            final isRegistered = _registeredEventIds.contains(event['id'].toString());

                            return SingleChildScrollView(
                              controller: scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 24.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.03),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white.withOpacity(0.06)),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                            height: 1.25,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          desc,
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 13,
                                            height: 1.5,
                                          ),
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            Icon(Icons.place_rounded, color: ExecTheme.accentSecondary, size: 14),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                venue,
                                                style: const TextStyle(
                                                  color: Colors.white54,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  
                                  const SizedBox(height: 20),
                                  
                                  // Book Now (RSVP) Button
                                  SizedBox(
                                    width: double.infinity,
                                    height: 52,
                                    child: ElevatedButton(
                                      onPressed: _isRegistering || _isCheckingRegistrations
                                          ? null
                                          : () => _handleRegister(event),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.white,
                                        foregroundColor: Colors.black,
                                        disabledBackgroundColor: Colors.white24,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        elevation: 8,
                                        shadowColor: Colors.white.withOpacity(0.2),
                                      ),
                                      child: _isRegistering
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.5,
                                                color: Colors.black,
                                              ),
                                            )
                                          : Text(
                                              isRegistered ? 'ALREADY SECURED ✓' : 'BOOK NOW',
                                              style: GoogleFonts.outfit(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 1.5,
                                              ),
                                            ),
                                    ),
                                  ).animate().shimmer(duration: 1800.ms, color: Colors.white24),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      
                      // Pagination Dots Indicator
                      if (widget.events.length > 1) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            widget.events.length,
                            (index) => AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 16),
                              width: _currentPage == index ? 16 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: _currentPage == index ? ExecTheme.accentSecondary : Colors.white24,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 24),
                      ],
                    ],
                  ),
                  
                  // Skip button (Top Right)
                  Positioned(
                    top: 12,
                    right: 16,
                    child: IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white60, size: 24),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  final Color color;
  _GridPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.5;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_GridPainter old) => false;
}
