// lib/widgets/secure_video_player_widget.dart
//
// Video player widget that:
//   • Enables screen protection on mount, disables on dispose
//   • Pauses playback and shows a warning if screen recording is detected (iOS)
//   • Re-enables protection when app returns from background (prevents
//     app-switcher thumbnail leaks)

import 'dart:async';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../core/theme/app_theme.dart';
import '../services/content_protection_service.dart';
import '../shared/widgets/bouncing_balls_loader.dart';

class SecureVideoPlayerWidget extends StatefulWidget {
  /// Provide either [networkUrl] OR [localFilePath], not both.
  final String? networkUrl;
  final String? localFilePath;

  const SecureVideoPlayerWidget({
    super.key,
    this.networkUrl,
    this.localFilePath,
  }) : assert(networkUrl != null || localFilePath != null,
            'Provide networkUrl or localFilePath');

  @override
  State<SecureVideoPlayerWidget> createState() =>
      _SecureVideoPlayerWidgetState();
}

class _SecureVideoPlayerWidgetState extends State<SecureVideoPlayerWidget>
    with WidgetsBindingObserver {
  final _protection = ContentProtectionService();

  VideoPlayerController? _controller;
  ChewieController? _chewie;
  bool _isError = false;
  bool _isCapturing = false;
  Timer? _captureCheckTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _protection.enableScreenProtection();
    _initPlayer();
    _startCaptureCheck();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _captureCheckTimer?.cancel();
    _controller?.dispose();
    _chewie?.dispose();
    _protection.disableScreenProtection();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      // Pause video when entering app-switcher / background
      _controller?.pause();
      // Re-arm protection (some platforms clear FLAG_SECURE on backgrounding)
      _protection.enableScreenProtection();
    }
  }

  Future<void> _initPlayer() async {
    try {
      if (widget.networkUrl != null) {
        _controller = VideoPlayerController.networkUrl(
            Uri.parse(widget.networkUrl!));
      } else {
        _controller =
            VideoPlayerController.contentUri(Uri.file(widget.localFilePath!));
      }
      await _controller!.initialize();
      _chewie = ChewieController(
        videoPlayerController: _controller!,
        autoPlay: true,
        looping: false,
        allowFullScreen: true,
        allowPlaybackSpeedChanging: true,
        showOptions: false,
        materialProgressColors: ChewieProgressColors(
          playedColor: AppTheme.accentSecondary,
          handleColor: AppTheme.accentSecondary,
          backgroundColor: AppTheme.glassBorder,
          bufferedColor: AppTheme.glassBorder.withOpacity(0.5),
        ),
      );
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) setState(() => _isError = true);
    }
  }

  void _startCaptureCheck() {
    // Poll every 2 seconds for iOS recording detection
    _captureCheckTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) async {
        final capturing = await _protection.isScreenRecording();
        if (capturing != _isCapturing && mounted) {
          setState(() => _isCapturing = capturing);
          if (capturing) {
            _controller?.pause();
            _showCaptureWarning();
          }
        }
      },
    );
  }

  void _showCaptureWarning() {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Screen Recording Detected',
            style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w900)),
        content: const Text(
          'Playback has been paused because screen recording is active. '
          'Stop recording to continue watching.',
          style: TextStyle(color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK',
                style: TextStyle(color: AppTheme.accentSecondary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isError) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                color: Colors.redAccent, size: 48),
            SizedBox(height: 16),
            Text('Failed to load video',
                style: TextStyle(color: AppTheme.textMuted)),
          ],
        ),
      );
    }

    if (_isCapturing) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Text(
            'Playback paused\nScreen recording detected',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white70, fontSize: 16),
          ),
        ),
      );
    }

    if (_chewie != null &&
        _controller!.value.isInitialized) {
      return Chewie(controller: _chewie!);
    }

    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          BouncingBallsLoader(),
          SizedBox(height: 16),
          Text(
            'BUFFERING VIDEO...',
            style: TextStyle(
              color: AppTheme.accentSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 2,
            ),
          ),
        ],
      ),
    );
  }
}
