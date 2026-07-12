// ─────────────────────────────────────────────────────────────────────────────
// schema discovery findings:
//
// events table (discovered):
//   - id (uuid, primary key)
//   - title (text)
//   - description (text)
//   - event_date (timestamp with time zone)
//   - venue (text)
//   - registration_fee (numeric)
//   - created_at (timestamp with time zone)
//
// Start Date/Time: event_date
// End Date/Time: none — not present in events table
// Banner/theme: none — derived client-side
// Status: none — computed client-side from event_date vs now()
//
// RSVP Table: public.registrations
//   - id (uuid)
//   - user_id (uuid) references profiles(id) ON DELETE CASCADE
//   - event_id (uuid) references events(id) ON DELETE CASCADE
//   - created_at (timestamp with time zone)
//   - payment_status (text)
//   - qr_code (text)
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../shared/widgets/exec_glass_container.dart';
import '../../../shared/widgets/exec_liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class EventManagerScreen extends StatefulWidget {
  const EventManagerScreen({super.key});

  @override
  State<EventManagerScreen> createState() => _EventManagerScreenState();
}

class _EventManagerScreenState extends State<EventManagerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  List<Map<String, dynamic>> _events = [];
  bool _isLoadingEvents = true;

  // Selected event for RSVP viewing
  Map<String, dynamic>? _selectedRsvpEvent;
  List<Map<String, dynamic>> _registrations = [];
  bool _isLoadingRsvps = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && _selectedRsvpEvent == null && _events.isNotEmpty) {
        _selectRsvpEvent(_events.first);
      }
    });
    _fetchEvents();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchEvents() async {
    setState(() => _isLoadingEvents = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('events')
          .select('*')
          .order('event_date', ascending: true);
      
      setState(() {
        _events = List<Map<String, dynamic>>.from(response);
        _isLoadingEvents = false;
      });

      // Maintain selection for RSVPs if list changes
      if (_selectedRsvpEvent != null) {
        final match = _events.firstWhere(
          (e) => e['id'] == _selectedRsvpEvent!['id'],
          orElse: () => _events.isNotEmpty ? _events.first : {},
        );
        if (match.isNotEmpty) {
          _selectRsvpEvent(match);
        } else {
          setState(() {
            _selectedRsvpEvent = null;
            _registrations = [];
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingEvents = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Error loading events: ${ErrorHandler.friendly(e)}')),
        );
      }
    }
  }

  Future<void> _selectRsvpEvent(Map<String, dynamic> event) async {
    setState(() {
      _selectedRsvpEvent = event;
      _isLoadingRsvps = true;
    });

    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('registrations')
          .select('*, profiles(full_name, department, roll_number)')
          .eq('event_id', event['id'])
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _registrations = List<Map<String, dynamic>>.from(response);
          _isLoadingRsvps = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingRsvps = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Error loading RSVPs: ${ErrorHandler.friendly(e)}')),
        );
      }
    }
  }

  Future<void> _writeAuditLog({
    required String action,
    required String targetId,
    Map<String, dynamic>? before,
    Map<String, dynamic>? after,
  }) async {
    final supabaseService = Provider.of<SupabaseService>(context, listen: false);
    final actorId = supabaseService.currentUser?.id;
    if (actorId == null) return;

    try {
      await supabaseService.client.from('audit_log').insert({
        'actor_id': actorId,
        'action': action,
        'target_table': 'events',
        'target_id': targetId,
        'metadata': {
          'before': before,
          'after': after,
        }
      });
    } catch (e) {
      debugPrint('Failed to write audit log: $e');
    }
  }

  Future<void> _deleteEvent(Map<String, dynamic> event) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F0F1E),
        title: const Text('Delete Event?', style: TextStyle(color: Colors.white)),
        content: Text('Are you sure you want to delete "${event['title']}"? This will immediately remove it from the home screen.', style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      await supabase.from('events').delete().eq('id', event['id']);
      HapticFeedback.lightImpact();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.green, content: Text('Event deleted successfully!')),
        );
      }

      await _writeAuditLog(
        action: 'DELETE',
        targetId: event['id'],
        before: event,
        after: null,
      );

      _fetchEvents();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Failed to delete event: ${ErrorHandler.friendly(e)}')),
        );
      }
    }
  }

  void _showEventForm({Map<String, dynamic>? event}) {
    final isEdit = event != null;
    final titleController = TextEditingController(text: event?['title'] ?? '');
    final descController = TextEditingController(text: event?['description'] ?? '');
    final venueController = TextEditingController(text: event?['venue'] ?? '');
    final feeController = TextEditingController(text: event?['registration_fee']?.toString() ?? '0');
    
    DateTime selectedDateTime = event != null
        ? DateTime.parse(event['event_date']).toLocal()
        : DateTime.now().add(const Duration(days: 1));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E0E1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setFormState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isEdit ? 'EDIT EVENT' : 'NEW EVENT',
                          style: GoogleFonts.jetBrainsMono(
                            color: ExecTheme.accentSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            letterSpacing: 2,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.white54),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: titleController,
                      style: const TextStyle(color: Colors.white),
                      decoration: _inputDecoration('Event Title', Icons.title_rounded),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 3,
                      decoration: _inputDecoration('Description', Icons.description_rounded),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: venueController,
                      style: const TextStyle(color: Colors.white),
                      decoration: _inputDecoration('Venue', Icons.place_rounded),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: feeController,
                      style: const TextStyle(color: Colors.white),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: _inputDecoration('Registration Fee (INR)', Icons.payments_rounded),
                    ),
                    const SizedBox(height: 16),
                    const Text('Event Date & Time (UTC)', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: selectedDateTime,
                          firstDate: DateTime.now().subtract(const Duration(days: 365)),
                          lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
                        );
                        if (date != null) {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.fromDateTime(selectedDateTime),
                          );
                          if (time != null) {
                            setFormState(() {
                              selectedDateTime = DateTime(
                                date.year,
                                date.month,
                                date.day,
                                time.hour,
                                time.minute,
                              );
                            });
                          }
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, color: ExecTheme.accentSecondary, size: 18),
                            const SizedBox(width: 12),
                            Text(
                              selectedDateTime.toLocal().toString().substring(0, 16),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ExecTheme.accentSecondary,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          final title = titleController.text.trim();
                          final desc = descController.text.trim();
                          final venue = venueController.text.trim();
                          final fee = double.tryParse(feeController.text.trim()) ?? 0.0;

                          if (title.isEmpty || venue.isEmpty) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(backgroundColor: Colors.red, content: Text('Title and Venue are required')),
                            );
                            return;
                          }

                          final supabase = Provider.of<SupabaseService>(context, listen: false).client;
                          try {
                            final payload = {
                              'title': title,
                              'description': desc,
                              'event_date': selectedDateTime.toUtc().toIso8601String(),
                              'venue': venue,
                              'registration_fee': fee,
                              'start_date': selectedDateTime.toUtc().toIso8601String(),
                              'end_date': selectedDateTime.add(const Duration(hours: 3)).toUtc().toIso8601String(),
                            };

                            if (isEdit) {
                              await supabase.from('events').update(payload).eq('id', event['id']);
                              await _writeAuditLog(
                                action: 'UPDATE',
                                targetId: event['id'],
                                before: event,
                                after: payload,
                              );
                            } else {
                              final response = await supabase.from('events').insert(payload).select().single();
                              await _writeAuditLog(
                                action: 'CREATE',
                                targetId: response['id'],
                                before: null,
                                after: payload,
                              );
                            }

                            HapticFeedback.lightImpact();
                            Navigator.pop(ctx);
                            _fetchEvents();

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(backgroundColor: Colors.green, content: Text(isEdit ? 'Event updated!' : 'Event created!')),
                            );
                          } catch (e) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(backgroundColor: Colors.red, content: Text('Error saving event: ${ErrorHandler.friendly(e)}')),
                            );
                          }
                        },
                        child: Text(
                          isEdit ? 'UPDATE EVENT' : 'PUBLISH EVENT',
                          style: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white38, fontSize: 13),
      prefixIcon: Icon(icon, color: Colors.white38, size: 18),
      filled: true,
      fillColor: Colors.white.withOpacity(0.03),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: ExecTheme.accentSecondary)),
    );
  }

  Future<void> _exportToCSV() async {
    if (_selectedRsvpEvent == null) return;
    final title = _selectedRsvpEvent!['title'] ?? 'event';
    
    try {
      final tempDir = await getTemporaryDirectory();
      final sanitizedTitle = title.replaceAll(RegExp(r'[^\w\s\-]'), '').replaceAll(' ', '_');
      final file = File('${tempDir.path}/${sanitizedTitle}_rsvps.csv');
      
      String csv = 'Full Name,Department,Roll Number,Registered At,Payment Status\n';
      for (var reg in _registrations) {
        final profile = reg['profiles'] as Map<String, dynamic>?;
        final name = profile?['full_name'] ?? '';
        final dept = profile?['department'] ?? '';
        final roll = profile?['roll_number'] ?? '';
        final date = reg['created_at'] ?? '';
        final status = reg['payment_status'] ?? 'free';
        csv += '"$name","$dept","$roll","$date","$status"\n';
      }
      
      await file.writeAsString(csv);
      await OpenFile.open(file.path);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.green, content: Text('RSVP exported to ${file.path.split('/').last}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.red, content: Text('Failed to export: ${ErrorHandler.friendly(e)}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ExecLiquidBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Header Block
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'EVENT MANAGER',
                        style: GoogleFonts.jetBrainsMono(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // TabBar in Glass Panel
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: ExecTheme.accentSecondary,
                    labelColor: ExecTheme.accentSecondary,
                    unselectedLabelColor: Colors.white38,
                    indicatorSize: TabBarIndicatorSize.tab,
                    tabs: const [
                      Tab(text: 'Manage Events'),
                      Tab(text: 'Attendee RSVPs'),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // View Area
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildEventsTab(),
                    _buildRsvpsTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEventsTab() {
    if (_isLoadingEvents) {
      return const Center(child: CircularProgressIndicator(color: ExecTheme.accentSecondary));
    }

    return Column(
      children: [
        // Published Stats & New Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_events.length} Events Total',
                style: const TextStyle(color: Colors.white54, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: ExecTheme.accentSecondary.withOpacity(0.1),
                  foregroundColor: ExecTheme.accentSecondary,
                  side: const BorderSide(color: ExecTheme.accentSecondary, width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: Text('NEW EVENT', style: GoogleFonts.jetBrainsMono(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => _showEventForm(),
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: _events.isEmpty
              ? Center(
                  child: Text(
                    'No events posted yet.',
                    style: GoogleFonts.jetBrainsMono(color: Colors.white30),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                  itemCount: _events.length,
                  itemBuilder: (context, index) {
                    final event = _events[index];
                    final date = DateTime.parse(event['event_date']).toLocal();
                    final isPast = date.isBefore(DateTime.now());

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ExecGlassContainer(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  // Status Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isPast ? Colors.white.withOpacity(0.08) : ExecTheme.accentSecondary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: isPast ? Colors.white24 : ExecTheme.accentSecondary, width: 0.8),
                                    ),
                                    child: Text(
                                      isPast ? 'ENDED' : 'UPCOMING',
                                      style: GoogleFonts.jetBrainsMono(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: isPast ? Colors.white70 : ExecTheme.accentSecondary,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  // Edit Button
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, color: Colors.white70, size: 18),
                                    onPressed: () => _showEventForm(event: event),
                                  ),
                                  // Delete Button
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                                    onPressed: () => _deleteEvent(event),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                event['title'] ?? 'Untitled Event',
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              if (event['description'] != null && event['description'].toString().trim().isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  event['description'],
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                                ),
                              ],
                              const Divider(height: 24, color: Colors.white10),
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded, color: ExecTheme.accentSecondary, size: 14),
                                  const SizedBox(width: 6),
                                  Text(
                                    date.toString().substring(0, 16),
                                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                                  ),
                                  const SizedBox(width: 16),
                                  const Icon(Icons.place_rounded, color: ExecTheme.accentSecondary, size: 14),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      event['venue'] ?? 'TBA',
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildRsvpsTab() {
    if (_events.isEmpty) {
      return Center(
        child: Text(
          'Post an event to track RSVPs.',
          style: GoogleFonts.jetBrainsMono(color: Colors.white30),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Event Dropdown Selector
          const Text('SELECT EVENT', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<Map<String, dynamic>>(
                value: _selectedRsvpEvent,
                dropdownColor: const Color(0xFF0F0F1E),
                isExpanded: true,
                icon: const Icon(Icons.arrow_drop_down_rounded, color: ExecTheme.accentSecondary),
                items: _events.map((e) {
                  return DropdownMenuItem<Map<String, dynamic>>(
                    value: e,
                    child: Text(
                      e['title'] ?? 'Untitled',
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) _selectRsvpEvent(val);
                },
              ),
            ),
          ),

          const SizedBox(height: 20),

          if (_selectedRsvpEvent != null) ...[
            // RSVP Count & Export
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_registrations.length} Registrations',
                  style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                if (_registrations.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.ios_share_rounded, color: ExecTheme.accentSecondary),
                    onPressed: _exportToCSV,
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Attendee List
            Expanded(
              child: _isLoadingRsvps
                  ? const Center(child: CircularProgressIndicator(color: ExecTheme.accentSecondary))
                  : _registrations.isEmpty
                      ? const Center(
                          child: Text(
                            'No one has registered for this event yet.',
                            style: TextStyle(color: Colors.white30, fontSize: 13),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(bottom: 100),
                          itemCount: _registrations.length,
                          itemBuilder: (context, index) {
                            final reg = _registrations[index];
                            final profile = reg['profiles'] as Map<String, dynamic>?;
                            final name = profile?['full_name'] ?? 'Unknown Member';
                            final dept = profile?['department'] ?? 'N/A';
                            final roll = profile?['roll_number'] ?? 'N/A';
                            
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: ExecGlassContainer(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: ExecTheme.accentSecondary.withOpacity(0.1),
                                        child: Text(
                                          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'M',
                                          style: const TextStyle(color: ExecTheme.accentSecondary, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                            const SizedBox(height: 4),
                                            Text(
                                              '$dept • Roll: $roll',
                                              style: const TextStyle(color: Colors.white54, fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ],
      ),
    );
  }
}
