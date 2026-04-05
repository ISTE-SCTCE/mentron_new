import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../core/utils/error_handler.dart';

class RealTimeCalendar extends StatefulWidget {
  const RealTimeCalendar({super.key});

  @override
  State<RealTimeCalendar> createState() => _RealTimeCalendarState();
}

class _RealTimeCalendarState extends State<RealTimeCalendar> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  // Events fetched from Supabase
  Map<DateTime, List<Map<String, dynamic>>> _events = {};
  bool _isExec = false;

  // Add-event form state
  bool _showAddForm = false;
  final _eventNameController = TextEditingController();
  final _venueController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadUserAndEvents();
  }

  Future<void> _loadUserAndEvents() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId != null) {
      try {
        final profile = await supabase.client
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();
        if (mounted && profile != null) {
          setState(() => _isExec = profile['role'] == 'exec');
        }
      } catch (_) {}
    }
    await _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      final response = await supabase
          .from('event_cal')
          .select('id, event_name, event_date, venue');

      final Map<DateTime, List<Map<String, dynamic>>> grouped = {};
      for (final event in (response as List)) {
        if (event['event_date'] == null) continue;
        final date = DateTime.parse(event['event_date']);
        // Normalize to midnight for comparisons
        final key = DateTime(date.year, date.month, date.day);
        grouped.putIfAbsent(key, () => []).add(event);
      }
      if (mounted) setState(() => _events = grouped);
    } catch (_) {}
  }

  List<Map<String, dynamic>> _getEventsForDay(DateTime day) {
    final key = DateTime(day.year, day.month, day.day);
    return _events[key] ?? [];
  }

  bool _hasEvent(DateTime day) => _getEventsForDay(day).isNotEmpty;

  Future<void> _addEvent() async {
    if (_eventNameController.text.trim().isEmpty || _selectedDay == null)
      return;
    setState(() => _isSubmitting = true);

    final supabase = Provider.of<SupabaseService>(
      context,
      listen: false,
    ).client;
    try {
      final eventDate = DateTime(
        _selectedDay!.year,
        _selectedDay!.month,
        _selectedDay!.day,
        12,
        0,
        0, // Noon to avoid timezone issues
      );

      await supabase.from('event_cal').insert({
        'event_name': _eventNameController.text.trim(),
        'venue': _venueController.text.trim().isEmpty
            ? 'TBA'
            : _venueController.text.trim(),
        'event_date': eventDate.toIso8601String(),
      });

      _eventNameController.clear();
      _venueController.clear();
      if (mounted)
        setState(() {
          _showAddForm = false;
          _isSubmitting = false;
        });
      await _fetchEvents();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.green,
            content: Text('Event added successfully! 📅'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text(ErrorHandler.friendly(e)),
          ),
        );
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    final selectedEvents = _selectedDay != null
        ? _getEventsForDay(_selectedDay!)
        : [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Expand/Collapse toggle row above the calendar
        const SizedBox(height: 8),
        // Calendar Card
        GlassContainer(
          padding: const EdgeInsets.all(16),
          child: RepaintBoundary(
            child: TableCalendar(
              firstDay: DateTime.utc(2024, 1, 1),
              lastDay: DateTime.utc(2030, 12, 31),
              focusedDay: _focusedDay,
              calendarFormat: CalendarFormat.month,
              availableGestures: AvailableGestures.horizontalSwipe,
              sixWeekMonthsEnforced: true,
              eventLoader: _getEventsForDay,
              selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
              onDaySelected: (selectedDay, focusedDay) {
                setState(() {
                  _selectedDay = selectedDay;
                  _focusedDay = focusedDay;
                  _showAddForm = _isExec;
                });
              },
              onPageChanged: (focusedDay) => _focusedDay = focusedDay,
              headerStyle: HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
                titleTextStyle: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                leftChevronIcon: Icon(
                  Icons.chevron_left,
                  color: AppTheme.accentSecondary,
                ),
                rightChevronIcon: Icon(
                  Icons.chevron_right,
                  color: AppTheme.accentSecondary,
                ),
              ),
              daysOfWeekStyle: const DaysOfWeekStyle(
                weekdayStyle: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                weekendStyle: TextStyle(
                  color: AppTheme.accentSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              calendarStyle: CalendarStyle(
                outsideDaysVisible: false,
                defaultTextStyle: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                ),
                weekendTextStyle: TextStyle(
                  color: AppTheme.accentSecondary,
                  fontSize: 12,
                ),
                todayDecoration: BoxDecoration(
                  color: AppTheme.accentPrimary.withOpacity(0.3),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.accentPrimary),
                ),
                selectedDecoration: BoxDecoration(
                  color: AppTheme.accentSecondary,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accentSecondary.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                // 🔸 Event dot marker — orange circle under the day number
                markerDecoration: const BoxDecoration(
                  color: Colors.orangeAccent,
                  shape: BoxShape.circle,
                ),
                markerSize: 6.0,
              ),

              // Custom cell builder — highlights days with events in orange
              calendarBuilders: CalendarBuilders(
                defaultBuilder: (context, day, focusedDay) {
                  if (_hasEvent(day)) {
                    return Container(
                      margin: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.orangeAccent.withOpacity(0.2),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.orangeAccent.withOpacity(0.6),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '${day.day}',
                          style: const TextStyle(
                            color: Colors.orangeAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  }
                  return null; // Use default for non-event days
                },
              ),
            ),
          ),
        ),

        // Events for selected day
        if (selectedEvents.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'EVENTS ON ${_selectedDay?.day}/${_selectedDay?.month}/${_selectedDay?.year}',
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
          ...selectedEvents.map(
            (event) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                border: Border.all(color: Colors.orangeAccent.withOpacity(0.3)),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.orangeAccent,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            event['event_name'] ?? '',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          if (event['venue'] != null)
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_rounded,
                                  color: Colors.orangeAccent,
                                  size: 12,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  event['venue'],
                                  style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn().slideY(begin: 0.05),
          ),
        ],

        // Exec-only: Add Event form core
        if (_isExec && _showAddForm && _selectedDay != null) ...[
          const SizedBox(height: 16),
          GlassContainer(
            padding: const EdgeInsets.all(20),
            border: Border.all(
              color: AppTheme.accentSecondary.withOpacity(0.3),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ADD EVENT',
                          style: TextStyle(
                            color: AppTheme.accentSecondary,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2,
                          ),
                        ),
                        Text(
                          '${_selectedDay!.day}/${_selectedDay!.month}/${_selectedDay!.year}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close_rounded,
                        color: AppTheme.textMuted,
                        size: 18,
                      ),
                      onPressed: () => setState(() => _showAddForm = false),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  _eventNameController,
                  'Event Name',
                  Icons.event_rounded,
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  _venueController,
                  'Venue (or leave blank for TBA)',
                  Icons.location_on_outlined,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _addEvent,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentSecondary,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.black,
                          ),
                        )
                      : const Text(
                          'ADD EVENT',
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ).animate().fadeIn().slideY(begin: 0.1),
        ],

        // Exec hint when a day is selected but form is hidden
        if (_isExec && _selectedDay != null && !_showAddForm) ...[
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => setState(() => _showAddForm = true),
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
              border: Border.all(
                color: AppTheme.accentSecondary.withOpacity(0.2),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.add_circle_outline_rounded,
                    color: AppTheme.accentSecondary,
                    size: 18,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Add event on ${_selectedDay!.day}/${_selectedDay!.month}/${_selectedDay!.year}',
                    style: const TextStyle(
                      color: AppTheme.accentSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(),
        ],
      ],
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint,
    IconData icon,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: Colors.white.withOpacity(0.2),
            fontSize: 13,
          ),
          prefixIcon: Icon(
            icon,
            color: Colors.white.withOpacity(0.4),
            size: 18,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}
