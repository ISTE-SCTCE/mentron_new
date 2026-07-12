import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/services/supabase_service.dart';
import '../../../models/broadcast_notification.dart';
import '../../../services/notification_manager_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsInboxScreen — user-facing read-only notification history.
// Shows all SENT broadcast notifications from EXECOM, newest first.
// Accessed via the bell 🔔 icon in MainScaffold.
// ─────────────────────────────────────────────────────────────────────────────
class NotificationsInboxScreen extends StatefulWidget {
  const NotificationsInboxScreen({super.key});

  /// SharedPreferences key tracking when the user last opened this inbox.
  /// Used by MainScaffold to compute the unseen badge count.
  static const String lastSeenPrefKey = 'notifications_inbox_last_seen';

  @override
  State<NotificationsInboxScreen> createState() =>
      _NotificationsInboxScreenState();
}

class _NotificationsInboxScreenState extends State<NotificationsInboxScreen> {
  List<BroadcastNotification> _notifications = [];
  bool _isLoading = true;
  DateTime? _lastSeen;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // 1. Load last-seen timestamp from prefs (for "new" dot highlighting)
    final prefs = await SharedPreferences.getInstance();
    final lastSeenMs = prefs.getInt(NotificationsInboxScreen.lastSeenPrefKey);
    _lastSeen = lastSeenMs != null
        ? DateTime.fromMillisecondsSinceEpoch(lastSeenMs)
        : null;

    // 2. Fetch notifications
    await _fetch();

    // 3. Mark as seen NOW so badge clears on next render
    await prefs.setInt(
      NotificationsInboxScreen.lastSeenPrefKey,
      DateTime.now().millisecondsSinceEpoch,
    );
  }

  Future<void> _fetch() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final service = NotificationManagerService(supabase.client);
    final list = await service.getSentNotificationsForInbox();
    if (mounted) {
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
    }
  }

  bool _isNew(BroadcastNotification n) {
    if (_lastSeen == null) return true;
    final sentAt = n.sentAt;
    if (sentAt == null) return false;
    return sentAt.isAfter(_lastSeen!);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF7F6FF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF1E2238), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(children: [
          const Icon(Icons.notifications_rounded,
              color: Color(0xFF6D28D9), size: 20),
          const SizedBox(width: 8),
          Text(
            'Notifications',
            style: GoogleFonts.inter(
              color: const Color(0xFF1E2238),
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ]),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: Color(0xFFEEEEF8)),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF6D28D9)))
          : RefreshIndicator(
              color: const Color(0xFF6D28D9),
              onRefresh: _fetch,
              child: _notifications.isEmpty
                  ? _buildEmpty()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                      itemCount: _notifications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 0),
                      itemBuilder: (ctx, i) =>
                          _buildCard(_notifications[i]),
                    ),
            ),
    );
  }

  Widget _buildEmpty() {
    return ListView(children: [
      const SizedBox(height: 100),
      Center(
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF6D28D9).withOpacity(0.07),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_none_rounded,
                size: 52, color: Color(0xFF6D28D9)),
          ),
          const SizedBox(height: 20),
          Text(
            'No notifications yet',
            style: GoogleFonts.inter(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E2238),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Check back later for announcements\nfrom your EXECOM team.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF8E90A6),
              height: 1.5,
            ),
          ),
        ]),
      ),
    ]);
  }

  Widget _buildCard(BroadcastNotification n) {
    final isNew = _isNew(n);
    final sentAt = n.sentAt;
    final timeStr = sentAt != null
        ? _formatTime(sentAt)
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 1),
      color: isNew
          ? const Color(0xFF6D28D9).withOpacity(0.04)
          : Colors.white,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Left accent bar for "new" items
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 4,
              decoration: BoxDecoration(
                color: isNew
                    ? const Color(0xFF6D28D9)
                    : Colors.transparent,
                borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(4)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF6D28D9).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.campaign_rounded,
                          color: Color(0xFF6D28D9), size: 20),
                    ),
                    const SizedBox(width: 12),
                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Text(
                                  n.title,
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF1E2238),
                                    fontWeight: isNew
                                        ? FontWeight.bold
                                        : FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              if (isNew)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF6D28D9),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            n.body,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF5A5C72),
                              fontSize: 13,
                              height: 1.45,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(children: [
                            const Icon(Icons.access_time_rounded,
                                size: 11, color: Color(0xFFAAAAAE)),
                            const SizedBox(width: 4),
                            Text(
                              timeStr,
                              style: GoogleFonts.inter(
                                color: const Color(0xFFAAAAAE),
                                fontSize: 11,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.person_outline_rounded,
                                size: 11, color: Color(0xFFAAAAAE)),
                            const SizedBox(width: 4),
                            Text(
                              n.createdByName,
                              style: GoogleFonts.inter(
                                color: const Color(0xFFAAAAAE),
                                fontSize: 11,
                              ),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d, y').format(dt);
  }
}
