// lib/screens/downloads_screen.dart
//
// Shows all locally downloaded content with storage usage, playback,
// and swipe/tap to delete. Does NOT apply screen protection
// (that only wraps the actual viewer screens).

import 'dart:io';

import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../models/downloaded_content.dart';
import '../services/offline_storage_service.dart';
import '../screens/video_player_screen.dart';
import '../features/notes/screens/note_viewer_screen.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  final _service = OfflineStorageService();
  List<DownloadedContent> _items = [];
  int _totalBytes = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await _service.initializeStorage();
    final items = _service.getDownloadedContent();
    items.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
    final size = await _service.getOfflineStorageSize();
    if (mounted) {
      setState(() {
        _items = items;
        _totalBytes = size;
        _loading = false;
      });
    }
  }

  Future<void> _delete(DownloadedContent item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Remove Download',
            style: TextStyle(color: AppTheme.textMain)),
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
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await _service.deleteDownloadedContent(item.id);
    _load();
  }

  Future<void> _play(DownloadedContent item) async {
    if (item.isVideo) {
      // Decrypt to temp file, play, then clean up
      try {
        final tempFile = await _service.decryptToTemp(item.id);
        if (!mounted) return;
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => VideoPlayerScreen(
              localFile: tempFile,
              title: item.title,
            ),
          ),
        );
        // Clean up temp after playback
        if (await tempFile.exists()) await tempFile.delete();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Playback error: $e'),
          backgroundColor: Colors.redAccent,
        ));
      }
    } else {
      // Notes — decrypt to temp, open in viewer
      try {
        final tempFile = await _service.decryptToTemp(item.id);
        if (!mounted) return;
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
        if (await tempFile.exists()) await tempFile.delete();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Open error: $e'),
          backgroundColor: Colors.redAccent,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Downloads',
            style: TextStyle(
                fontWeight: FontWeight.w900, color: AppTheme.textMain)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppTheme.textMain, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                  color: AppTheme.accentSecondary, strokeWidth: 2))
          : Column(
              children: [
                // Storage usage banner
                _StorageBanner(bytes: _totalBytes, service: _service),
                Expanded(
                  child: _items.isEmpty
                      ? const _EmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          itemBuilder: (_, i) => _DownloadTile(
                            item: _items[i],
                            onPlay: () => _play(_items[i]),
                            onDelete: () => _delete(_items[i]),
                          ),
                        ),
                ),
              ],
            ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StorageBanner extends StatelessWidget {
  final int bytes;
  final OfflineStorageService service;
  const _StorageBanner({required this.bytes, required this.service});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.glassBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.storage_rounded,
              color: AppTheme.accentSecondary, size: 18),
          const SizedBox(width: 10),
          Text(
            'Storage used: ${service.formatStorageSize(bytes)}',
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _DownloadTile extends StatelessWidget {
  final DownloadedContent item;
  final VoidCallback onPlay;
  final VoidCallback onDelete;
  const _DownloadTile(
      {required this.item, required this.onPlay, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.redAccent.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete_outline_rounded,
            color: Colors.redAccent, size: 24),
      ),
      onDismissed: (_) => onDelete(),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.glassBorder),
        ),
        child: ListTile(
          onTap: onPlay,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.accentSecondary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              item.isVideo
                  ? Icons.play_circle_outline_rounded
                  : Icons.picture_as_pdf_outlined,
              color: AppTheme.accentSecondary,
              size: 26,
            ),
          ),
          title: Text(item.title,
              style: const TextStyle(
                  color: AppTheme.textMain,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
          subtitle: Text(
            '${item.isVideo ? 'Video' : 'Notes'} • ${item.formattedSize} • '
            '${_formatDate(item.downloadedAt)}',
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
          ),
          trailing: IconButton(
            icon: const Icon(Icons.delete_outline_rounded,
                color: AppTheme.textMuted, size: 20),
            onPressed: onDelete,
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_download_outlined,
              size: 64, color: AppTheme.textMuted.withOpacity(0.4)),
          const SizedBox(height: 16),
          const Text('No downloads yet',
              style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text(
            'Download videos and notes to access them offline',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
