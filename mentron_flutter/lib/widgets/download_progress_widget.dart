// lib/widgets/download_progress_widget.dart
//
// Animated download progress widget for Mentron offline storage.
// Shows progress bar, percentage, speed estimate, and cancel button.

import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class DownloadProgressWidget extends StatelessWidget {
  final String title;
  final double progress; // 0.0 – 1.0
  final VoidCallback? onCancel;

  const DownloadProgressWidget({
    super.key,
    required this.title,
    required this.progress,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final percent = (progress * 100).toStringAsFixed(0);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.glassBorder),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.download_rounded,
                  color: AppTheme.accentSecondary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '$percent%',
                style: const TextStyle(
                  color: AppTheme.accentSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              if (onCancel != null) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: onCancel,
                  child: const Icon(Icons.close_rounded,
                      color: AppTheme.textMuted, size: 18),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
              builder: (_, value, __) => LinearProgressIndicator(
                value: value,
                backgroundColor: AppTheme.glassBorder,
                valueColor: const AlwaysStoppedAnimation<Color>(
                    AppTheme.accentSecondary),
                minHeight: 6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Inline icon-button variant used inside list tiles.
class DownloadButton extends StatelessWidget {
  final bool isDownloaded;
  final bool isDownloading;
  final double progress;
  final VoidCallback onDownload;
  final VoidCallback onDelete;

  const DownloadButton({
    super.key,
    required this.isDownloaded,
    required this.isDownloading,
    required this.progress,
    required this.onDownload,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (isDownloading) {
      return SizedBox(
        width: 32,
        height: 32,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CircularProgressIndicator(
              value: progress,
              strokeWidth: 2.5,
              backgroundColor: AppTheme.glassBorder,
              valueColor: const AlwaysStoppedAnimation<Color>(
                  AppTheme.accentSecondary),
            ),
            const Center(
              child: Icon(Icons.stop_rounded,
                  size: 14, color: AppTheme.accentSecondary),
            ),
          ],
        ),
      );
    }

    if (isDownloaded) {
      return IconButton(
        icon: const Icon(Icons.download_done_rounded,
            color: AppTheme.accentSecondary),
        iconSize: 22,
        tooltip: 'Downloaded — tap to remove',
        onPressed: onDelete,
      );
    }

    return IconButton(
      icon: const Icon(Icons.download_for_offline_outlined,
          color: AppTheme.textMuted),
      iconSize: 22,
      tooltip: 'Download for offline',
      onPressed: onDownload,
    );
  }
}
