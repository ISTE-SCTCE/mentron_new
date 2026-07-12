import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/bouncing_balls_loader.dart';
import '../../../core/utils/error_handler.dart';

class EventsCalendarWidget extends StatefulWidget {
  const EventsCalendarWidget({super.key});

  @override
  State<EventsCalendarWidget> createState() => _EventsCalendarWidgetState();
}

class _EventsCalendarWidgetState extends State<EventsCalendarWidget> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  List<Map<String, dynamic>> _events = [];
  Set<String> _registeredEventIds = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _selectedDay = DateTime.now();
    _fetchEventsAndRegistrations();
  }

  Future<void> _fetchEventsAndRegistrations() async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final supabase = supabaseService.client;
    final userId = supabaseService.currentUser?.id;

    try {
      // 1. Fetch all events with dates
      final eventsResponse = await supabase
          .from('events')
          .select('*')
          .not('event_date', 'is', null)
          .order('event_date', ascending: true);

      // 2. Fetch user registrations
      final Set<String> registeredIds = {};
      if (userId != null) {
        final regResponse = await supabase
            .from('registrations')
            .select('event_id')
            .eq('user_id', userId);
        
        for (var r in regResponse) {
          if (r['event_id'] != null) {
            registeredIds.add(r['event_id'].toString());
          }
        }
      }

      if (mounted) {
        setState(() {
          _events = List<Map<String, dynamic>>.from(eventsResponse);
          _registeredEventIds = registeredIds;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading calendar data: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<Map<String, dynamic>> _getEventsForDay(DateTime day) {
    return _events.where((e) {
      final eDate = DateTime.parse(e['event_date']).toLocal();
      return isSameDay(eDate, day);
    }).toList();
  }

  Color _getEventColor(Map<String, dynamic> event) {
    final colors = [
      const Color(0xFF7B2FFF),
      const Color(0xFF0080FF),
      const Color(0xFF00C870),
      const Color(0xFFFF6600),
      const Color(0xFFFF0088),
      const Color(0xFF5555DD),
    ];
    final idHash = event['id'].hashCode;
    return colors[idHash.abs() % colors.length];
  }

  Future<void> _handleRegister(Map<String, dynamic> event, StateSetter setSheetState) async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final supabase = supabaseService.client;
    final userId = supabaseService.currentUser?.id;

    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to RSVP for events.')),
      );
      return;
    }

    setSheetState(() {
      _isLoading = true; // Temporary spinner in sheet
    });

    try {
      await supabase.from('registrations').insert({
        'event_id': event['id'],
        'user_id': userId,
      });

      HapticFeedback.mediumImpact();
      if (mounted) {
        setState(() {
          _registeredEventIds.add(event['id'].toString());
        });
        setSheetState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.green,
            content: Text('Successfully registered for "${event['title']}"! 🎉'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setSheetState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Failed to register: ${ErrorHandler.friendly(e)}'),
          ),
        );
      }
    }
  }

  void _showDayEventsBottomSheet(DateTime date, List<Map<String, dynamic>> dayEvents) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pull indicator
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Date Title
                  Text(
                    DateFormat('EEEE, MMMM d, y').format(date).toUpperCase(),
                    style: GoogleFonts.jetBrainsMono(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Events Today',
                    style: GoogleFonts.outfit(
                      color: AppTheme.textMain,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Events list
                  Expanded(
                    child: ListView.builder(
                      itemCount: dayEvents.length,
                      itemBuilder: (context, idx) {
                        final event = dayEvents[idx];
                        final time = DateTime.parse(event['event_date']).toLocal();
                        final isRegistered = _registeredEventIds.contains(event['id'].toString());
                        final themeColor = _getEventColor(event);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.glassBorder),
                            boxShadow: [
                              BoxShadow(
                                color: themeColor.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ],
                          ),
                          child: IntrinsicHeight(
                            child: Row(
                              children: [
                                // Colored Accent Bar
                                Container(
                                  width: 5,
                                  decoration: BoxDecoration(
                                    color: themeColor,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(16),
                                      bottomLeft: Radius.circular(16),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                // Content
                                Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          event['title'] ?? 'Untitled Event',
                                          style: GoogleFonts.outfit(
                                            color: AppTheme.textMain,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        if (event['description'] != null && event['description'].toString().trim().isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            event['description'],
                                            style: const TextStyle(color: Colors.black54, fontSize: 12),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Icon(Icons.access_time_rounded, size: 13, color: AppTheme.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              DateFormat.jm().format(time),
                                              style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                            ),
                                            const SizedBox(width: 12),
                                            Icon(Icons.place_rounded, size: 13, color: AppTheme.textMuted),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                event['venue'] ?? 'TBA',
                                                style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                // RSVP Action Button
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Center(
                                    child: isRegistered
                                        ? Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                            decoration: BoxDecoration(
                                              color: Colors.green.withOpacity(0.08),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: Colors.green.withOpacity(0.3)),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.check_circle_outline_rounded, color: Colors.green, size: 14),
                                                SizedBox(width: 4),
                                                Text('Registered', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                                              ],
                                            ),
                                          )
                                        : TextButton(
                                            style: TextButton.styleFrom(
                                              backgroundColor: AppTheme.accentPrimary.withOpacity(0.08),
                                              foregroundColor: AppTheme.accentPrimary,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            ),
                                            onPressed: () => _handleRegister(event, setSheetState),
                                            child: const Text('RSVP', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Container(
          height: 300,
          alignment: Alignment.center,
          child: const BouncingBallsLoader(),
        ),
      );
    }

    if (_events.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: GlassContainer(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.event_busy_rounded, color: AppTheme.textMuted.withOpacity(0.4), size: 40),
              const SizedBox(height: 12),
              Text(
                'No upcoming events scheduled at the moment.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              'EVENTS CALENDAR',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMuted,
                letterSpacing: 2.0,
              ),
            ),
          ),
          GlassContainer(
            borderRadius: 24,
            padding: const EdgeInsets.all(12),
            child: TableCalendar(
              firstDay: DateTime.now().subtract(const Duration(days: 365)),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
              eventLoader: _getEventsForDay,
              startingDayOfWeek: StartingDayOfWeek.monday,
              onDaySelected: (selectedDay, focusedDay) {
                setState(() {
                  _selectedDay = selectedDay;
                  _focusedDay = focusedDay;
                });
                final dayEvents = _getEventsForDay(selectedDay);
                if (dayEvents.isNotEmpty) {
                  _showDayEventsBottomSheet(selectedDay, dayEvents);
                }
              },
              onPageChanged: (focusedDay) {
                _focusedDay = focusedDay;
              },
              headerStyle: HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
                titleTextStyle: GoogleFonts.outfit(
                  color: AppTheme.textMain,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                leftChevronIcon: const Icon(Icons.chevron_left_rounded, color: AppTheme.accentPrimary),
                rightChevronIcon: const Icon(Icons.chevron_right_rounded, color: AppTheme.accentPrimary),
              ),
              calendarStyle: CalendarStyle(
                todayTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                todayDecoration: const BoxDecoration(
                  color: AppTheme.accentSecondary,
                  shape: BoxShape.circle,
                ),
                selectedTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                selectedDecoration: const BoxDecoration(
                  color: AppTheme.accentPrimary,
                  shape: BoxShape.circle,
                ),
                defaultTextStyle: TextStyle(color: AppTheme.textMain, fontSize: 13),
                weekendTextStyle: TextStyle(color: AppTheme.textMain, fontSize: 13),
                outsideDaysVisible: false,
              ),
              calendarBuilders: CalendarBuilders(
                markerBuilder: (context, date, events) {
                  if (events.isEmpty) return const SizedBox.shrink();
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: events.take(3).map((e) {
                      final event = e as Map<String, dynamic>;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 1.0),
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _getEventColor(event),
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
