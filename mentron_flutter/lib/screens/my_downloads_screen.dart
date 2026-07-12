// lib/screens/my_downloads_screen.dart
//
// "My Notes" tab — shows downloaded notes (and optionally videos) with
// per-item offline playback. Replaces the Profile icon in the navbar.
// Profile is still reachable from the Dashboard's top-right avatar.

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_theme.dart';
import '../models/downloaded_content.dart';
import '../services/offline_storage_service.dart';
import '../screens/video_player_screen.dart';
import '../features/notes/screens/note_viewer_screen.dart';

class MyDownloadsScreen extends StatefulWidget {
  const MyDownloadsScreen({super.key});

  @override
  State<MyDownloadsScreen> createState() => _MyDownloadsScreenState();
}

class _MyDownloadsScreenState extends State<MyDownloadsScreen>
    with SingleTickerProviderStateMixin {
  final _service = OfflineStorageService();

  List<DownloadedContent> _all = [];
  List<DownloadedContent> _filtered = [];
  int _totalBytes = 0;
  bool _loading = true;

  // Filter: 'all' | 'notes' | 'video'
  String _filter = 'all';

  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        final filters = ['all', 'notes', 'video'];
        setState(() {
          _filter = filters[_tabController.index];
          _applyFilter();
        });
      }
    });
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    await _service.initializeStorage();
    final items = _service.getDownloadedContent();
    items.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
    final size = await _service.getOfflineStorageSize();
    if (mounted) {
      setState(() {
        _all = items;
        _totalBytes = size;
        _loading = false;
        _applyFilter();
      });
    }
  }

  void _applyFilter() {
    if (_filter == 'all') {
      _filtered = List.from(_all);
    } else {
      _filtered = _all.where((i) => i.contentType == _filter).toList();
    }
  }

  Future<void> _delete(DownloadedContent item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Remove Download',
            style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w900)),
        content: Text(
          'Remove "${item.title}" from offline storage?',
          style: const TextStyle(color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL',
                style: TextStyle(color: AppTheme.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('REMOVE',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await _service.deleteDownloadedContent(item.id);
    _load();
  }

  Future<void> _open(DownloadedContent item) async {
    try {
      final tempFile = await _service.decryptToTemp(item.id);
      if (!mounted) return;

      if (item.isVideo) {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VideoPlayerScreen(
              localFile: tempFile,
              title: item.title,
            ),
          ),
        );
      } else {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => NoteViewerScreen(
              url: tempFile.path,
              title: item.title,
              isLocalFile: true,
            ),
          ),
        );
      }
      // Clean up temp file after viewing
      if (await tempFile.exists()) await tempFile.delete();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Could not open file: $e'),
        backgroundColor: Colors.redAccent,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ───────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'My Downloads',
                    style: TextStyle(
                      color: AppTheme.textMain,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Access your saved notes & videos offline',
                    style: TextStyle(
                      color: AppTheme.textMuted.withOpacity(0.7),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.05),

            const SizedBox(height: 16),

            // ── Storage usage pill ────────────────────────────────────────────
            if (!_loading)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _StoragePill(bytes: _totalBytes, service: _service),
              ).animate().fadeIn(delay: 100.ms),

            const SizedBox(height: 12),

            // ── Filter tabs ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: _FilterTabs(controller: _tabController),
            ),

            const SizedBox(height: 12),

            // ── Content list ──────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.accentSecondary,
                        strokeWidth: 2,
                      ),
                    )
                  : _filtered.isEmpty
                      ? _EmptyState(filter: _filter)
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(24, 4, 24, 120),
                          itemCount: _filtered.length,
                          itemBuilder: (_, i) => _DownloadCard(
                            item: _filtered[i],
                            onOpen: () => _open(_filtered[i]),
                            onDelete: () => _delete(_filtered[i]),
                            index: i,
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Storage Pill ──────────────────────────────────────────────────────────────

class _StoragePill extends StatelessWidget {
  final int bytes;
  final OfflineStorageService service;
  const _StoragePill({required this.bytes, required this.service});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.glassBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.storage_rounded,
              color: AppTheme.accentSecondary, size: 16),
          const SizedBox(width: 8),
          Text(
            '${service.formatStorageSize(bytes)} used offline',
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Filter Tabs ───────────────────────────────────────────────────────────────

class _FilterTabs extends StatelessWidget {
  final TabController controller;
  const _FilterTabs({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.glassBorder),
      ),
      child: TabBar(
        controller: controller,
        indicator: BoxDecoration(
          color: const Color(0xFF1E2238),
          borderRadius: BorderRadius.circular(18),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppTheme.textMuted,
        labelStyle: const TextStyle(
            fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.5),
        dividerColor: Colors.transparent,
        tabs: const [
          Tab(text: 'ALL'),
          Tab(text: 'NOTES'),
          Tab(text: 'VIDEOS'),
        ],
      ),
    );
  }
}

// ── Download Card ─────────────────────────────────────────────────────────────

class _DownloadCard extends StatelessWidget {
  final DownloadedContent item;
  final VoidCallback onOpen;
  final VoidCallback onDelete;
  final int index;

  const _DownloadCard({
    required this.item,
    required this.onOpen,
    required this.onDelete,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 12),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        decoration: BoxDecoration(
          color: Colors.redAccent.withOpacity(0.15),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.delete_outline_rounded,
                color: Colors.redAccent, size: 22),
            SizedBox(height: 4),
            Text('DELETE',
                style: TextStyle(
                    color: Colors.redAccent,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1)),
          ],
        ),
      ),
      onDismissed: (_) => onDelete(),
      child: GestureDetector(
        onTap: onOpen,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.glassBorder),
          ),
          child: Row(
            children: [
              // Type icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: (item.isNotes
                          ? AppTheme.accentSecondary
                          : const Color(0xFF7C4DFF))
                      .withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  item.isNotes
                      ? Icons.picture_as_pdf_rounded
                      : Icons.play_circle_rounded,
                  color: item.isNotes
                      ? AppTheme.accentSecondary
                      : const Color(0xFF7C4DFF),
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: (item.isNotes
                                    ? AppTheme.accentSecondary
                                    : const Color(0xFF7C4DFF))
                                .withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item.isNotes ? 'NOTE' : 'VIDEO',
                            style: TextStyle(
                              color: item.isNotes
                                  ? AppTheme.accentSecondary
                                  : const Color(0xFF7C4DFF),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          item.formattedSize,
                          style: const TextStyle(
                              color: AppTheme.textMuted, fontSize: 11),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(item.downloadedAt),
                          style: const TextStyle(
                              color: AppTheme.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Delete button
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                onPressed: onDelete,
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: (index * 60).ms).slideX(begin: 0.04);
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String filter;
  const _EmptyState({required this.filter});

  @override
  Widget build(BuildContext context) {
    final emoji = filter == 'video' ? '🎬' : '📄';
    final label = filter == 'video'
        ? 'No videos downloaded'
        : filter == 'notes'
            ? 'No notes downloaded'
            : 'No downloads yet';
    final sub = 'Tap the download icon on any note or video to save it offline';

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 56)),
            const SizedBox(height: 16),
            Text(label,
                style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(sub,
                style: TextStyle(
                    color: AppTheme.textMuted.withOpacity(0.6),
                    fontSize: 13,
                    height: 1.5),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}
