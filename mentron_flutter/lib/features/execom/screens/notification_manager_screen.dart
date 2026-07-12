import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/exec_theme.dart';
import '../../../models/broadcast_notification.dart';
import '../../../services/notification_manager_service.dart';
import '../../../shared/widgets/exec_glass_container.dart';
import '../../../shared/widgets/exec_liquid_background.dart';
import '../../../widgets/execom/notification_status_badge.dart';
import '../../../core/theme/app_theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationManagerScreen — EXECOM-only broadcast notification tool.
// Compose + History tabs, mirroring the EventManagerScreen pattern.
// ─────────────────────────────────────────────────────────────────────────────
class NotificationManagerScreen extends StatefulWidget {
  const NotificationManagerScreen({super.key});

  @override
  State<NotificationManagerScreen> createState() =>
      _NotificationManagerScreenState();
}

class _NotificationManagerScreenState extends State<NotificationManagerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late NotificationManagerService _service;
  String? _currentUserName;

  // ── Compose tab state ─────────────────────────────────────────────────────
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  bool _isSendNowMode = true;
  DateTime? _scheduledDate;
  TimeOfDay? _scheduledTime;
  bool _isSending = false;

  DateTime? get _scheduledFor {
    if (_scheduledDate == null || _scheduledTime == null) return null;
    return DateTime(
      _scheduledDate!.year,
      _scheduledDate!.month,
      _scheduledDate!.day,
      _scheduledTime!.hour,
      _scheduledTime!.minute,
    );
  }

  // ── History tab state ─────────────────────────────────────────────────────
  List<BroadcastNotification> _history = [];
  bool _isLoadingHistory = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && _history.isEmpty) {
        _fetchHistory();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      _service = NotificationManagerService(supabase.client);
      _loadUserName(supabase);
    });
  }

  Future<void> _loadUserName(SupabaseService supabase) async {
    try {
      final userId = supabase.currentUser?.id;
      if (userId == null) return;
      final profile = await supabase.client
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _currentUserName = (profile?['full_name'] as String?) ?? 'EXECOM';
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  // ── History ───────────────────────────────────────────────────────────────

  Future<void> _fetchHistory() async {
    if (!mounted) return;
    setState(() => _isLoadingHistory = true);
    final history = await _service.getNotificationHistory();
    if (mounted) {
      setState(() {
        _history = history;
        _isLoadingHistory = false;
      });
    }
  }

  // ── Send / Schedule ───────────────────────────────────────────────────────

  Future<void> _handleSend() async {
    final title = _titleCtrl.text.trim();
    final body = _bodyCtrl.text.trim();

    if (title.isEmpty) {
      _showSnack('Title is required', isError: true);
      return;
    }
    if (body.isEmpty) {
      _showSnack('Message body is required', isError: true);
      return;
    }

    if (!_isSendNowMode) {
      if (_scheduledFor == null) {
        _showSnack('Please select both a date and a time', isError: true);
        return;
      }
      if (_scheduledFor!.isBefore(DateTime.now())) {
        _showSnack('Scheduled time must be in the future', isError: true);
        return;
      }
    }

    final confirmed = await _showConfirmDialog(title, body);
    if (confirmed != true || !mounted) return;

    setState(() => _isSending = true);

    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final userId = supabase.currentUser?.id;
    if (userId == null) {
      setState(() => _isSending = false);
      return;
    }

    try {
      if (_isSendNowMode) {
        await _service.sendNow(
          title: title,
          body: body,
          userId: userId,
          userName: _currentUserName ?? 'EXECOM',
        );
        if (mounted) {
          HapticFeedback.mediumImpact();
          _showSnack('Broadcast sent to all users ✓');
          _titleCtrl.clear();
          _bodyCtrl.clear();
          // Switch to History and refresh
          _tabController.animateTo(1);
          await _fetchHistory();
        }
      } else {
        await _service.scheduleNotification(
          title: title,
          body: body,
          scheduledFor: _scheduledFor!,
          userId: userId,
          userName: _currentUserName ?? 'EXECOM',
        );
        if (mounted) {
          HapticFeedback.mediumImpact();
          _showSnack(
            'Scheduled for ${DateFormat('MMM d, h:mm a').format(_scheduledFor!)} ✓',
          );
          _titleCtrl.clear();
          _bodyCtrl.clear();
          setState(() {
            _scheduledDate = null;
            _scheduledTime = null;
          });
          _tabController.animateTo(1);
          await _fetchHistory();
        }
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Error: ${e.toString().split('\n').first}', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<bool?> _showConfirmDialog(String title, String body) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F0F1E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: ExecTheme.accentSecondary.withOpacity(0.35)),
        ),
        title: Text(
          _isSendNowMode ? 'SEND TO ALL USERS?' : 'SCHEDULE BROADCAST?',
          style: GoogleFonts.jetBrainsMono(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
            letterSpacing: 0.8,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isSendNowMode
                  ? 'This will immediately push a notification to ALL Mentron users. This action cannot be undone.'
                  : 'This notification will be sent to ALL users on:\n${DateFormat('EEE, MMM d, y @ h:mm a').format(_scheduledFor!)}',
              style: const TextStyle(color: Colors.white60, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 14),
            // Preview
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(body,
                      style: const TextStyle(
                          color: Colors.white54, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('CANCEL',
                style: GoogleFonts.jetBrainsMono(color: Colors.white38)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              _isSendNowMode ? 'SEND NOW' : 'SCHEDULE',
              style: GoogleFonts.jetBrainsMono(
                color: ExecTheme.accentSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      backgroundColor: isError ? Colors.redAccent : Colors.green,
      content: Text(msg, style: GoogleFonts.jetBrainsMono(fontSize: 13)),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ));
  }

  // ── Delete / Cancel / Edit ────────────────────────────────────────────────
  
  Future<void> _handleDelete(BroadcastNotification n) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Delete Notification?', style: TextStyle(color: Colors.redAccent)),
        content: const Text('This will permanently delete this broadcast record.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCEL')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('DELETE', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      await supabase.client.from('broadcast_notifications').delete().eq('id', n.id);
      _showSnack('Notification deleted successfully.');
      _fetchHistory();
    } catch (e) {
      _showSnack('Failed to delete notification', isError: true);
    }
  }

  Future<void> _handleCancel(BroadcastNotification n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F0F1E),
        title: const Text('Cancel Notification?',
            style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will permanently prevent the notification from being sent. The record will remain in history as CANCELLED.',
          style: TextStyle(color: Colors.white60, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('KEEP IT',
                style: GoogleFonts.jetBrainsMono(color: Colors.white38)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('CANCEL IT',
                style: GoogleFonts.jetBrainsMono(
                    color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final ok = await _service.cancelScheduledNotification(n.id);
    if (mounted) {
      _showSnack(ok ? 'Notification cancelled.' : 'Failed to cancel.',
          isError: !ok);
      if (ok) {
        HapticFeedback.lightImpact();
        await _fetchHistory();
      }
    }
  }

  void _showEditSheet(BroadcastNotification n) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E0E1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _EditNotificationSheet(
        notification: n,
        service: _service,
        onSaved: () {
          Navigator.pop(ctx);
          _fetchHistory();
          _showSnack('Changes saved ✓');
        },
        onCancelRequested: () {
          Navigator.pop(ctx);
          _handleCancel(n);
        },
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ExecLiquidBackground(
        child: SafeArea(
          child: Column(
            children: [
              // ── Header ────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 12, 20, 12),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: Text(
                        'NOTIFICATION MANAGER',
                        style: GoogleFonts.jetBrainsMono(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: Colors.amberAccent.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: Colors.amberAccent.withOpacity(0.3)),
                      ),
                      child: const Icon(Icons.campaign_rounded,
                          color: Colors.amberAccent, size: 18),
                    ),
                  ],
                ),
              ),

              // ── Tabs ─────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: ExecTheme.accentSecondary,
                    labelColor: ExecTheme.accentSecondary,
                    unselectedLabelColor: Colors.white38,
                    indicatorSize: TabBarIndicatorSize.tab,
                    labelStyle: GoogleFonts.jetBrainsMono(
                        fontWeight: FontWeight.bold, fontSize: 13),
                    unselectedLabelStyle:
                        GoogleFonts.jetBrainsMono(fontSize: 13),
                    tabs: const [
                      Tab(text: 'Compose'),
                      Tab(text: 'History'),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildComposeTab(),
                    _buildHistoryTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Compose Tab ───────────────────────────────────────────────────────────

  Widget _buildComposeTab() {
    // Use StatefulBuilder so local compose state (char counters, toggle)
    // rebuilds without full screen rebuild.
    return StatefulBuilder(
      builder: (ctx, setSB) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Live notification preview
              _buildPreviewCard(),
              const SizedBox(height: 20),

              // Title field
              _fieldLabel('NOTIFICATION TITLE',
                  _titleCtrl.text.length, 65),
              const SizedBox(height: 6),
              TextField(
                controller: _titleCtrl,
                maxLength: 65,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration:
                    _inputDecoration('Short, clear title…', Icons.title_rounded),
                onChanged: (_) => setSB(() {}),
                buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                    null,
              ),
              const SizedBox(height: 16),

              // Body field
              _fieldLabel('MESSAGE BODY', _bodyCtrl.text.length, 240),
              const SizedBox(height: 6),
              TextField(
                controller: _bodyCtrl,
                maxLength: 240,
                maxLines: 4,
                style:
                    const TextStyle(color: Colors.white, fontSize: 14, height: 1.5),
                decoration: _inputDecoration(
                    'Write your announcement…', Icons.message_rounded),
                onChanged: (_) => setSB(() {}),
                buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                    null,
              ),
              const SizedBox(height: 20),

              // Send mode toggle
              _buildModeToggle(setSB),
              const SizedBox(height: 14),

              // Date/Time picker (schedule mode)
              if (!_isSendNowMode) ...[
                _buildDateTimePicker(setSB),
                const SizedBox(height: 14),
              ],

              // CTA button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isSendNowMode
                        ? ExecTheme.accentSecondary
                        : Colors.amberAccent,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  icon: _isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.black))
                      : Icon(
                          _isSendNowMode
                              ? Icons.send_rounded
                              : Icons.schedule_send_rounded,
                          size: 18),
                  label: Text(
                    _isSending
                        ? 'SENDING…'
                        : (_isSendNowMode
                            ? 'SEND NOW'
                            : 'SCHEDULE NOTIFICATION'),
                    style: GoogleFonts.jetBrainsMono(
                        fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  onPressed: _isSending ? null : _handleSend,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPreviewCard() {
    final hasTitle = _titleCtrl.text.isNotEmpty;
    final hasBody = _bodyCtrl.text.isNotEmpty;
    final titleText = hasTitle ? _titleCtrl.text : 'Notification Title';
    final bodyText = hasBody ? _bodyCtrl.text : 'Your message will appear here…';
    final isEmpty = !hasTitle && !hasBody;

    return ExecGlassContainer(
      padding: const EdgeInsets.all(16),
      border:
          Border.all(color: Colors.amberAccent.withOpacity(0.18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.preview_rounded,
                color: Colors.amberAccent, size: 13),
            const SizedBox(width: 6),
            Text('LIVE PREVIEW',
                style: GoogleFonts.jetBrainsMono(
                    color: Colors.amberAccent,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2)),
          ]),
          const SizedBox(height: 12),
          // Phone-notification mockup card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: ExecTheme.accentSecondary.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(Icons.notifications_rounded,
                      color: ExecTheme.accentSecondary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Text('Mentron',
                            style: TextStyle(
                                color: Colors.white38,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                        const Spacer(),
                        Text('now',
                            style: TextStyle(
                                color: Colors.white24, fontSize: 10)),
                      ]),
                      const SizedBox(height: 2),
                      Text(
                        titleText,
                        style: TextStyle(
                          color: isEmpty ? Colors.white.withOpacity(0.15) : Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        bodyText,
                        style: TextStyle(
                          color: isEmpty ? Colors.white.withOpacity(0.15) : Colors.white54,
                          fontSize: 12,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fieldLabel(String label, int count, int max) {
    final near = count > (max * 0.8);
    final at = count >= max;
    return Row(children: [
      Text(label,
          style: GoogleFonts.jetBrainsMono(
              color: Colors.white38,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5)),
      const Spacer(),
      Text('$count / $max',
          style: TextStyle(
              color: at
                  ? Colors.redAccent
                  : near
                      ? Colors.orangeAccent
                      : Colors.white24,
              fontSize: 10,
              fontWeight: FontWeight.bold)),
    ]);
  }

  Widget _buildModeToggle(StateSetter setSB) {
    Widget btn({
      required bool active,
      required IconData icon,
      required String label,
      required Color activeColor,
      required VoidCallback onTap,
      required BorderRadius radius,
    }) {
      return Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              color: active
                  ? activeColor.withOpacity(0.14)
                  : Colors.white.withOpacity(0.02),
              borderRadius: radius,
              border: Border.all(
                color: active ? activeColor : Colors.white.withOpacity(0.07),
                width: active ? 1.5 : 1,
              ),
            ),
            child: Column(
              children: [
                Icon(icon,
                    color: active ? activeColor : Colors.white30, size: 20),
                const SizedBox(height: 5),
                Text(label,
                    style: GoogleFonts.jetBrainsMono(
                        color: active ? activeColor : Colors.white30,
                        fontSize: 11,
                        fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      );
    }

    return Row(children: [
      btn(
        active: _isSendNowMode,
        icon: Icons.bolt_rounded,
        label: 'SEND NOW',
        activeColor: ExecTheme.accentSecondary,
        onTap: () => setSB(() => _isSendNowMode = true),
        radius: const BorderRadius.horizontal(left: Radius.circular(12)),
      ),
      btn(
        active: !_isSendNowMode,
        icon: Icons.schedule_rounded,
        label: 'SCHEDULE',
        activeColor: Colors.amberAccent,
        onTap: () => setSB(() => _isSendNowMode = false),
        radius: const BorderRadius.horizontal(right: Radius.circular(12)),
      ),
    ]);
  }

  Widget _buildDateTimePicker(StateSetter setSB) {
    final sf = _scheduledFor;
    final isPast = sf != null && sf.isBefore(DateTime.now());

    return ExecGlassContainer(
      padding: const EdgeInsets.all(16),
      border: Border.all(
        color: isPast
            ? Colors.redAccent.withOpacity(0.4)
            : Colors.amberAccent.withOpacity(0.2),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('SCHEDULE DATE & TIME',
            style: GoogleFonts.jetBrainsMono(
                color: isPast ? Colors.redAccent : Colors.amberAccent,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5)),
        const SizedBox(height: 12),
        Row(children: [
          // Date picker
          Expanded(
            child: _pickerTile(
              icon: Icons.calendar_today_rounded,
              label: _scheduledDate != null
                  ? DateFormat('MMM d, y').format(_scheduledDate!)
                  : 'Pick Date',
              filled: _scheduledDate != null,
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _scheduledDate ??
                      DateTime.now().add(const Duration(hours: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                  builder: (ctx, child) => _darkPickerTheme(ctx, child),
                );
                if (d != null) setSB(() => _scheduledDate = d);
              },
            ),
          ),
          const SizedBox(width: 8),
          // Time picker
          Expanded(
            child: _pickerTile(
              icon: Icons.access_time_rounded,
              label: _scheduledTime != null
                  ? _scheduledTime!.format(context)
                  : 'Pick Time',
              filled: _scheduledTime != null,
              onTap: () async {
                final t = await showTimePicker(
                  context: context,
                  initialTime:
                      _scheduledTime ?? TimeOfDay.now(),
                  builder: (ctx, child) => _darkPickerTheme(ctx, child),
                );
                if (t != null) setSB(() => _scheduledTime = t);
              },
            ),
          ),
        ]),
        if (isPast)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text('⚠  Selected time is in the past',
                style: TextStyle(color: Colors.redAccent, fontSize: 11)),
          )
        else if (sf != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              '→  Will send on ${DateFormat('EEE, MMM d, y at h:mm a').format(sf)}',
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ),
      ]),
    );
  }

  Widget _pickerTile({
    required IconData icon,
    required String label,
    required bool filled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Row(children: [
          Icon(icon, color: Colors.amberAccent, size: 16),
          const SizedBox(width: 7),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: filled ? Colors.white : Colors.white38,
                    fontSize: 12,
                    fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis),
          ),
        ]),
      ),
    );
  }

  Widget _darkPickerTheme(BuildContext ctx, Widget? child) {
    return Theme(
      data: ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(
          primary: ExecTheme.accentSecondary,
          onPrimary: Colors.black,
          surface: Color(0xFF1A1A2E),
          onSurface: Colors.white,
        ),
        dialogBackgroundColor: const Color(0xFF0F0F1E),
      ),
      child: child!,
    );
  }

  // ── History Tab ───────────────────────────────────────────────────────────

  Widget _buildHistoryTab() {
    if (_isLoadingHistory) {
      return const Center(
          child: CircularProgressIndicator(color: ExecTheme.accentSecondary));
    }

    if (_history.isEmpty) {
      return RefreshIndicator(
        color: ExecTheme.accentSecondary,
        onRefresh: _fetchHistory,
        child: ListView(children: [
          const SizedBox(height: 80),
          Center(
            child: Column(children: [
              const Icon(Icons.notifications_off_outlined,
                  color: Colors.white12, size: 52),
              const SizedBox(height: 14),
              Text('No broadcasts sent yet.',
                  style: GoogleFonts.jetBrainsMono(
                      color: Colors.white24, fontSize: 13)),
              const SizedBox(height: 6),
              Text('Use the Compose tab to send your first one.',
                  style: GoogleFonts.jetBrainsMono(
                      color: Colors.white12, fontSize: 11)),
            ]),
          ),
        ]),
      );
    }

    return RefreshIndicator(
      color: ExecTheme.accentSecondary,
      onRefresh: _fetchHistory,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 100),
        itemCount: _history.length,
        itemBuilder: (ctx, i) => _buildHistoryCard(_history[i]),
      ),
    );
  }

  Widget _buildHistoryCard(BroadcastNotification n) {
    final card = Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: n.canEdit ? () => _showEditSheet(n) : null,
        child: ExecGlassContainer(
          padding: const EdgeInsets.all(16),
          border: n.canEdit
              ? Border.all(color: Colors.amber.withOpacity(0.2))
              : null,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Top row: badge + edit hint
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      NotificationStatusBadge(status: n.status),
                      const SizedBox(height: 8),
                      Text(n.title,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(n.body,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 12, height: 1.4)),
                    ]),
              ),
              if (n.canEdit)
                const Padding(
                    padding: EdgeInsets.only(left: 8),
                    child: Icon(Icons.edit_outlined,
                        color: Colors.white24, size: 16)),
            ]),
            const Divider(height: 16, color: Colors.white10),
            // Bottom row: time, author, cancel btn
            Row(children: [
              const Icon(Icons.access_time_rounded,
                  color: Colors.white24, size: 12),
              const SizedBox(width: 4),
              Text(n.displayTime,
                  style:
                      const TextStyle(color: Colors.white38, fontSize: 11)),
              const SizedBox(width: 10),
              const Icon(Icons.person_outline_rounded,
                  color: Colors.white24, size: 12),
              const SizedBox(width: 4),
              Expanded(
                child: Text(n.createdByName,
                    style: const TextStyle(
                        color: Colors.white38, fontSize: 11),
                    overflow: TextOverflow.ellipsis),
              ),
              if (n.canCancel)
                GestureDetector(
                  onTap: () => _handleCancel(n),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.orangeAccent.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                          color: Colors.orangeAccent.withOpacity(0.3)),
                    ),
                    child: Text('CANCEL',
                        style: GoogleFonts.jetBrainsMono(
                            color: Colors.orangeAccent,
                            fontSize: 9,
                            fontWeight: FontWeight.bold)),
                  ),
                ),
              if (n.canCancel) const SizedBox(width: 8),
              GestureDetector(
                onTap: () => _handleDelete(n),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                        color: Colors.redAccent.withOpacity(0.3)),
                  ),
                  child: Text('DELETE',
                      style: GoogleFonts.jetBrainsMono(
                          color: Colors.redAccent,
                          fontSize: 9,
                          fontWeight: FontWeight.bold)),
                ),
              ),
            ]),
          ]),
        ),
      ),
    );

    if (n.canCancel) {
      return Dismissible(
        key: Key(n.id),
        direction: DismissDirection.endToStart,
        confirmDismiss: (_) async {
          await _handleCancel(n);
          return false;
        },
        background: Container(
          margin: const EdgeInsets.only(bottom: 12),
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: Colors.redAccent.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
            border:
                Border.all(color: Colors.redAccent.withOpacity(0.25)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.cancel_outlined,
                color: Colors.redAccent, size: 22),
            const SizedBox(height: 4),
            Text('CANCEL',
                style: GoogleFonts.jetBrainsMono(
                    color: Colors.redAccent,
                    fontSize: 9,
                    fontWeight: FontWeight.bold)),
          ]),
        ),
        child: card,
      );
    }
    return card;
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withOpacity(0.18), fontSize: 14),
      prefixIcon: Icon(icon, color: Colors.white24, size: 18),
      filled: true,
      fillColor: Colors.white.withOpacity(0.025),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.07)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide:
            const BorderSide(color: ExecTheme.accentSecondary, width: 1.5),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Scheduled Notification Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────
class _EditNotificationSheet extends StatefulWidget {
  final BroadcastNotification notification;
  final NotificationManagerService service;
  final VoidCallback onSaved;
  final VoidCallback onCancelRequested;

  const _EditNotificationSheet({
    required this.notification,
    required this.service,
    required this.onSaved,
    required this.onCancelRequested,
  });

  @override
  State<_EditNotificationSheet> createState() =>
      _EditNotificationSheetState();
}

class _EditNotificationSheetState extends State<_EditNotificationSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _bodyCtrl;
  late DateTime _scheduledFor;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.notification.title);
    _bodyCtrl = TextEditingController(text: widget.notification.body);
    _scheduledFor = widget.notification.scheduledFor ??
        DateTime.now().add(const Duration(hours: 1));
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final title = _titleCtrl.text.trim();
    final body = _bodyCtrl.text.trim();

    if (title.isEmpty || body.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          backgroundColor: Colors.red,
          content: Text('Title and body are required')));
      return;
    }
    if (_scheduledFor.isBefore(DateTime.now())) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          backgroundColor: Colors.red,
          content: Text('Scheduled time must be in the future')));
      return;
    }

    setState(() => _isSaving = true);
    final ok = await widget.service.editScheduledNotification(
      id: widget.notification.id,
      title: title,
      body: body,
      scheduledFor: _scheduledFor,
    );

    if (mounted) {
      if (ok) {
        widget.onSaved();
      } else {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            backgroundColor: Colors.red,
            content: Text('Failed to save changes')));
      }
    }
  }

  Widget _darkPickerTheme(BuildContext ctx, Widget? child) {
    return Theme(
      data: ThemeData.dark().copyWith(
        colorScheme: const ColorScheme.dark(
          primary: ExecTheme.accentSecondary,
          onPrimary: Colors.black,
          surface: Color(0xFF1A1A2E),
          onSurface: Colors.white,
        ),
        dialogBackgroundColor: const Color(0xFF0F0F1E),
      ),
      child: child!,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(children: [
              Text('EDIT SCHEDULED',
                  style: GoogleFonts.jetBrainsMono(
                      color: ExecTheme.accentSecondary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5)),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close_rounded,
                    color: Colors.white54, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ]),
            const SizedBox(height: 16),
            // Title
            TextField(
              controller: _titleCtrl,
              maxLength: 65,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Title', Icons.title_rounded),
              buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                  null,
            ),
            const SizedBox(height: 12),
            // Body
            TextField(
              controller: _bodyCtrl,
              maxLength: 240,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, height: 1.5),
              decoration: _inputDeco('Message body', Icons.message_rounded),
              buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                  null,
            ),
            const SizedBox(height: 16),
            Text('SCHEDULED FOR',
                style: GoogleFonts.jetBrainsMono(
                    color: Colors.white38,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _scheduledFor,
                  firstDate: DateTime.now(),
                  lastDate:
                      DateTime.now().add(const Duration(days: 365)),
                  builder: _darkPickerTheme,
                );
                if (date != null) {
                  final time = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.fromDateTime(_scheduledFor),
                    builder: _darkPickerTheme,
                  );
                  if (time != null) {
                    setState(() {
                      _scheduledFor = DateTime(
                        date.year, date.month, date.day,
                        time.hour, time.minute,
                      );
                    });
                  }
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.white.withOpacity(0.08)),
                ),
                child: Row(children: [
                  const Icon(Icons.calendar_today_rounded,
                      color: ExecTheme.accentSecondary, size: 18),
                  const SizedBox(width: 12),
                  Text(
                    DateFormat('EEE, MMM d, y  ·  h:mm a')
                        .format(_scheduledFor),
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ]),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: ExecTheme.accentSecondary,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.black))
                    : Text('SAVE CHANGES',
                        style: GoogleFonts.jetBrainsMono(
                            fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(
                      color: Colors.redAccent, width: 1.2),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: widget.onCancelRequested,
                child: Text('CANCEL NOTIFICATION',
                    style: GoogleFonts.jetBrainsMono(
                        fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white38, fontSize: 13),
      prefixIcon: Icon(icon, color: Colors.white38, size: 18),
      filled: true,
      fillColor: Colors.white.withOpacity(0.03),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08))),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
              color: ExecTheme.accentSecondary, width: 1.5)),
    );
  }
}
