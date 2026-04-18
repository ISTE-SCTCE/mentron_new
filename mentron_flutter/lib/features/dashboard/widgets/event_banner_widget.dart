import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/utils/department_mapper.dart';


class EventBannerWidget extends StatefulWidget {
  const EventBannerWidget({super.key});

  @override
  State<EventBannerWidget> createState() => _EventBannerWidgetState();
}

class _EventBannerWidgetState extends State<EventBannerWidget> {
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  bool _canAddEvent = false;
  final PageController _pageController = PageController(viewportFraction: 0.90);
  int _currentPage = 0;
  String _userDept = 'General';


  // Palette config: gradient pair + glow color + line color
  static const List<List<Color>> _gradients = [
    [Color(0xFF0D0020), Color(0xFF2A0066), Color(0xFF4B0099)],
    [Color(0xFF001833), Color(0xFF003D7A), Color(0xFF005FCC)],
    [Color(0xFF001A12), Color(0xFF004D30), Color(0xFF008550)],
    [Color(0xFF1A0800), Color(0xFF6B2000), Color(0xFFCC4000)],
    [Color(0xFF1A0010), Color(0xFF660040), Color(0xFFCC0066)],
    [Color(0xFF0A0A18), Color(0xFF1A1A4A), Color(0xFF2A2A7A)],
  ];

  static const List<Color> _glows = [
    Color(0xFF7B2FFF),
    Color(0xFF0080FF),
    Color(0xFF00C870),
    Color(0xFFFF6600),
    Color(0xFFFF0088),
    Color(0xFF5555DD),
  ];

  static const List<String> _emojis = ['⚡', '🎯', '🚀', '🏆', '🎓', '🌟', '🔥', '💡'];
  static const List<String> _tags = [
    'Workshop', 'Seminar', 'Cultural', 'Tech Talk', 'Hackathon',
    'Competition', 'Exhibition', 'Webinar',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
    _startAutoScroll();
  }

  Future<void> _loadData() async {
    await Future.wait([_fetchEvents(), _checkRole()]);
  }

  Future<void> _checkRole() async {
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final userId = supabase.currentUser?.id;
      if (userId == null) return;
      final profile = await supabase.client.from('profiles').select('role, roll_number').eq('id', userId).maybeSingle();
      final role = profile?['role'] as String? ?? '';
      final roll = profile?['roll_number'] as String?;
      final dept = DepartmentMapper.getDepartmentFromRoll(roll);
      if (mounted) {
        setState(() {
          _canAddEvent = role == 'exec' || role == 'core' || role == 'admin';
          _userDept = dept;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchEvents() async {
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false).client;
      final now = DateTime.now().toIso8601String().substring(0, 10);
      final response = await supabase
          .from('event_cal')
          .select('id, event_name, event_date, venue, description, department')
          .gte('event_date', now)
          .or('department.eq.General,department.eq.$_userDept')
          .order('event_date', ascending: true)
          .limit(12);

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
    Future.delayed(const Duration(seconds: 3), _autoScroll);
  }

  void _autoScroll() {
    if (!mounted) return;
    Future.delayed(const Duration(milliseconds: 4500), () {
      if (!mounted || _events.isEmpty) return;
      final nextPage = (_currentPage + 1) % _events.length;
      if (_pageController.hasClients) {
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        );
      }
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
      return DateFormat('EEE, d MMM').format(DateTime.parse(isoDate));
    } catch (_) { return isoDate; }
  }

  Map<String, dynamic> _getDaysInfo(String? isoDate) {
    if (isoDate == null) return {'label': '', 'color': Colors.grey};
    try {
      final date = DateTime.parse(isoDate);
      final diff = date.difference(DateTime.now()).inDays;
      if (diff == 0) return {'label': 'TODAY', 'color': Colors.redAccent};
      if (diff == 1) return {'label': 'TOMORROW', 'color': Colors.orange};
      if (diff < 0) return {'label': 'PAST', 'color': Colors.grey};
      if (diff <= 3) return {'label': 'IN $diff DAYS', 'color': Colors.orangeAccent};
      if (diff <= 7) return {'label': 'IN $diff DAYS', 'color': Colors.yellowAccent};
      return {'label': 'IN $diff DAYS', 'color': Colors.greenAccent};
    } catch (_) { return {'label': '', 'color': Colors.grey}; }
  }

  void _showAddEventSheet() {
    final nameCtrl = TextEditingController();
    final venueCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    bool isSubmitting = false;
    String selectedDept = 'General';
    String? error;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0E0E1A),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 20),
                const Text('SCHEDULE EVENT', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
                const Text('Add New Event', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                const SizedBox(height: 20),

                if (error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                    child: Text(error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                  ),

                _sheetField(nameCtrl, 'Event Name *', Icons.event_rounded),
                const SizedBox(height: 12),

                // Date picker row
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2030),
                      builder: (_, child) => Theme(
                        data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AppTheme.accentSecondary)),
                        child: child!,
                      ),
                    );
                    if (picked != null) setSheet(() => selectedDate = picked);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded, color: AppTheme.accentSecondary, size: 18),
                        const SizedBox(width: 12),
                        Text(
                          DateFormat('EEE, d MMMM yyyy').format(selectedDate),
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _sheetField(venueCtrl, 'Venue (optional)', Icons.location_on_outlined),
                const SizedBox(height: 12),
                
                // Department Picker
                const Text('TARGET DEPARTMENT', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedDept,
                      dropdownColor: const Color(0xFF0E0E1A),
                      isExpanded: true,
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      items: ['General', 'CSE', 'ECE', 'BT', 'ME', 'MEA']
                          .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                          .toList(),
                      onChanged: (val) { if (val != null) setSheet(() => selectedDept = val); },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                _sheetField(descCtrl, 'Description (optional)', Icons.notes_rounded, maxLines: 2),
                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: isSubmitting ? null : () async {
                    final name = nameCtrl.text.trim();
                    if (name.isEmpty) { setSheet(() => error = 'Event name is required.'); return; }
                    setSheet(() { isSubmitting = true; error = null; });
                    try {
                      final supabase = Provider.of<SupabaseService>(context, listen: false).client;
                      final eventDate = DateTime(selectedDate.year, selectedDate.month, selectedDate.day, 12, 0, 0);
                      await supabase.from('event_cal').insert({
                        'event_name': name,
                        'event_date': eventDate.toIso8601String(),
                        'venue': venueCtrl.text.trim().isEmpty ? 'TBA' : venueCtrl.text.trim(),
                        'description': descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                        'department': selectedDept,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(backgroundColor: Colors.green, content: Text('📅 Event published!')),
                        );
                        await _fetchEvents();
                      }
                    } catch (e) {
                      setSheet(() { error = ErrorHandler.friendly(e); isSubmitting = false; });
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentSecondary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: isSubmitting
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('PUBLISH EVENT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sheetField(TextEditingController ctrl, String hint, IconData icon, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2), fontSize: 13),
          prefixIcon: Icon(icon, color: Colors.white.withValues(alpha: 0.35), size: 18),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return _buildSkeleton();
    if (_events.isEmpty) return _buildEmptyState();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Row(
            children: [
              Container(width: 3, height: 16, decoration: BoxDecoration(color: AppTheme.accentSecondary, borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 8),
              const Text('UPCOMING EVENTS', style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 3)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentSecondary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.accentSecondary.withValues(alpha: 0.4)),
                ),
                child: Text('${_events.length}', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900)),
              ),
              const Spacer(),
              if (_canAddEvent)
                GestureDetector(
                  onTap: _showAddEventSheet,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.accentSecondary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.add_rounded, color: Colors.black, size: 14),
                      SizedBox(width: 4),
                      Text('ADD', style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ]),
                  ),
                ),
            ],
          ),
        ),

        // Banner card carousel
        SizedBox(
          height: 210,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemCount: _events.length,
            itemBuilder: (context, index) {
              final event = _events[index];
              final gradient = _gradients[index % _gradients.length];
              final glow = _glows[index % _glows.length];
              final emoji = _emojis[index % _emojis.length];
              final tag = _tags[index % _tags.length];
              final daysInfo = _getDaysInfo(event['event_date']);
              final daysLabel = daysInfo['label'] as String;
              final daysColor = daysInfo['color'] as Color;

              return AnimatedScale(
                scale: _currentPage == index ? 1.0 : 0.93,
                duration: const Duration(milliseconds: 300),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(26),
                    gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                    boxShadow: [BoxShadow(color: glow.withValues(alpha: 0.5), blurRadius: 24, offset: const Offset(0, 10))],
                  ),
                  child: Stack(
                    children: [
                      // Mesh grid overlay
                      Positioned.fill(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(26),
                          child: CustomPaint(painter: _GridPainter()),
                        ),
                      ),
                      // Ambient glow blob top-right
                      Positioned(
                        right: -20, top: -20,
                        child: Container(
                          width: 130, height: 130,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: glow.withValues(alpha: 0.3),
                          ),
                          child: Container(decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.transparent),),
                        ),
                      ),
                      // Neon top accent line
                      Positioned(
                        top: 0, left: 0, right: 0,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
                            gradient: LinearGradient(colors: [Colors.transparent, glow, Colors.transparent]),
                          ),
                        ),
                      ),
                      // Corner brackets
                      Positioned(top: 10, left: 10, child: _corner()),
                      Positioned(top: 10, right: 10, child: _corner(flip: true)),
                      // Content
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Top row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(children: [
                                  Container(
                                    width: 42, height: 42,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(13),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                    ),
                                    child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
                                  ),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                                    ),
                                    child: Text(tag, style: const TextStyle(color: Colors.white60, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                                  ),
                                ]),
                                if (daysLabel.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: daysColor.withValues(alpha: 0.18),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: daysColor.withValues(alpha: 0.5)),
                                    ),
                                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                                      Container(width: 5, height: 5, decoration: BoxDecoration(color: daysColor, shape: BoxShape.circle)),
                                      const SizedBox(width: 5),
                                      Text(daysLabel, style: TextStyle(color: daysColor, fontSize: 7.5, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                    ]),
                                  ),
                              ],
                            ),
                            const Spacer(),
                            // Event name
                            Text(
                              event['event_name'] ?? 'Event',
                              maxLines: 2, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900, letterSpacing: -0.2, height: 1.25),
                            ),
                            const SizedBox(height: 6),
                            // Date + venue row
                            Row(children: [
                              const Icon(Icons.calendar_today_rounded, size: 10, color: Colors.white54),
                              const SizedBox(width: 4),
                              Text(_formatDate(event['event_date']), style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.w700)),
                              if (event['venue'] != null && (event['venue'] as String).isNotEmpty) ...[
                                const SizedBox(width: 10),
                                const Icon(Icons.location_on_rounded, size: 10, color: Colors.white38),
                                const SizedBox(width: 3),
                                Expanded(child: Text(event['venue'], overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w600))),
                              ],
                            ]),
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
            width: _currentPage == i ? 18 : 5,
            height: 5,
            decoration: BoxDecoration(
              color: _currentPage == i ? AppTheme.accentSecondary : Colors.white24,
              borderRadius: BorderRadius.circular(3),
            ),
          )),
        ),

        // Scrollable event list
        const SizedBox(height: 16),
        Container(
          constraints: const BoxConstraints(maxHeight: 200),
          child: ListView.builder(
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            itemCount: _events.length,
            itemBuilder: (ctx, i) {
              final event = _events[i];
              final glow = _glows[i % _glows.length];
              final isActive = i == _currentPage;
              final daysInfo = _getDaysInfo(event['event_date']);
              final daysLabel = daysInfo['label'] as String;
              final daysColor = daysInfo['color'] as Color;

              return GestureDetector(
                onTap: () {
                  setState(() => _currentPage = i);
                  _pageController.animateToPage(i, duration: const Duration(milliseconds: 400), curve: Curves.easeInOutCubic);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isActive ? Colors.white.withValues(alpha: 0.06) : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isActive ? Colors.white.withValues(alpha: 0.1) : Colors.transparent),
                  ),
                  child: Row(children: [
                    Container(width: 3, height: 32, decoration: BoxDecoration(color: glow, borderRadius: BorderRadius.circular(2))),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(event['event_name'] ?? '', style: TextStyle(color: isActive ? Colors.white : AppTheme.textMuted, fontWeight: FontWeight.w900, fontSize: 12), overflow: TextOverflow.ellipsis),
                      Text(_formatDate(event['event_date']), style: const TextStyle(color: AppTheme.textMuted, fontSize: 9)),
                    ])),
                    if (daysLabel.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: daysColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: daysColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(daysLabel, style: TextStyle(color: daysColor, fontSize: 7.5, fontWeight: FontWeight.w900, letterSpacing: 0.8)),
                      ),
                  ]),
                ),
              ).animate().fadeIn(delay: (i * 40).ms);
            },
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _corner({bool flip = false}) {
    return Transform.scale(
      scaleX: flip ? -1 : 1,
      child: SizedBox(
        width: 12, height: 12,
        child: CustomPaint(painter: _CornerPainter()),
      ),
    );
  }

  Widget _buildSkeleton() {
    return Column(
      children: [
        Container(height: 210, margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(26))),
      ],
    );
  }

  Widget _buildEmptyState() {
    return GlassContainer(
      padding: const EdgeInsets.all(32),
      child: Column(children: [
        const Text('🗓️', style: TextStyle(fontSize: 36)),
        const SizedBox(height: 12),
        const Text('No upcoming events', style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text('Check back later', style: TextStyle(color: Colors.white.withValues(alpha: 0.2), fontSize: 11)),
        if (_canAddEvent) ...[
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _showAddEventSheet,
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Schedule First Event', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentSecondary, foregroundColor: Colors.black),
          ),
        ]
      ]),
    );
  }
}

// Lightweight grid painter for mesh overlay on banner cards
class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.025)
      ..strokeWidth = 0.5;
    const step = 32.0;
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

// Corner bracket painter
class _CornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.25)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
    canvas.drawLine(Offset.zero, Offset(0, size.height), paint);
  }

  @override
  bool shouldRepaint(_CornerPainter old) => false;
}
