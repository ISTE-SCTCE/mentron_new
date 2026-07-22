import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_cached_pdfview/flutter_cached_pdfview.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/content_protection_service.dart';
import '../../../shared/widgets/bouncing_balls_loader.dart';

class NoteViewerScreen extends StatefulWidget {
  final String url;
  final String title;

  /// Set to true when [url] is a local filesystem path (e.g. decrypted offline file).
  /// Set to false (default) for remote URLs.
  final bool isLocalFile;
  final Map<String, String>? headers;

  const NoteViewerScreen({
    super.key,
    required this.url,
    required this.title,
    this.isLocalFile = false,
    this.headers,
  });

  @override
  State<NoteViewerScreen> createState() => _NoteViewerScreenState();
}

class _NoteViewerScreenState extends State<NoteViewerScreen>
    with WidgetsBindingObserver {
  final _protection = ContentProtectionService();

  late String extension;
  bool isPdf = false;
  bool isImage = false;
  bool isVideo = false;

  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isVideoError = false;
  bool _isPdfError = false;
  String? _pdfErrorMessage;
  bool _isCapturing = false;
  Timer? _captureCheckTimer;

  @override
  void initState() {
    super.initState();

    // ── Screen protection — enable on entering this screen ──────────────────────
    WidgetsBinding.instance.addObserver(this);
    _protection.enableScreenProtection();

    extension = widget.url.split('.').last.toLowerCase().split('?').first;
    isPdf = extension == 'pdf' ||
        !['mp4', 'mov', 'jpg', 'jpeg', 'png', 'gif'].contains(extension);
    isImage = ['jpg', 'jpeg', 'png', 'gif'].contains(extension);
    isVideo = ['mp4', 'mov'].contains(extension);

    if (isVideo) {
      _initializeVideoPlayer();
    }

    // ── iOS capture detection poll ─────────────────────────────────────────────────
    _captureCheckTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) async {
        final capturing = await _protection.isScreenRecording();
        if (capturing != _isCapturing && mounted) {
          setState(() => _isCapturing = capturing);
          if (capturing) {
            _videoPlayerController?.pause();
            _showCaptureWarning();
          }
        }
      },
    );
  }

  Future<void> _initializeVideoPlayer() async {
    try {
      if (widget.isLocalFile) {
        _videoPlayerController =
            VideoPlayerController.contentUri(Uri.file(widget.url));
      } else {
        _videoPlayerController =
            VideoPlayerController.networkUrl(Uri.parse(widget.url));
      }
      await _videoPlayerController!.initialize();
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
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
      if (mounted) {
        setState(() {
          _isVideoError = true;
        });
      }
    }
  }

  void _showCaptureWarning() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        title: Text('Screen Recording Detected'),
        content: Text('Content is hidden while recording.'),
      ),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      // Pause video to prevent app-switcher thumbnail leaks
      _videoPlayerController?.pause();
      // Re-arm protection
      _protection.enableScreenProtection();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _captureCheckTimer?.cancel();
    _videoPlayerController?.dispose();
    _chewieController?.dispose();
    // ── Screen protection — disable when leaving this screen ─────────────────
    _protection.disableScreenProtection();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Capture warning overlay — covers entire screen on iOS when recording detected
    if (_isCapturing) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.screen_lock_portrait_rounded,
                    color: Colors.white54, size: 56),
                SizedBox(height: 20),
                Text(
                  'Screen recording detected',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 12),
                Text(
                  'Content is hidden while your screen is being recorded or mirrored.',
                  style: TextStyle(color: Colors.white54, fontSize: 13, height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          widget.title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppTheme.textMain, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (isPdf) {
      if (_isPdfError) {
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(
                'Failed to load PDF\n${_pdfErrorMessage ?? ""}',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ],
          ),
        );
      }
      if (widget.isLocalFile) {
        // Load from local file path for offline content
        return PDF(
          enableSwipe: true,
          swipeHorizontal: false,
          autoSpacing: false,
          pageFling: false,
          onError: (error) {
            if (mounted) {
              setState(() {
                _isPdfError = true;
                _pdfErrorMessage = error.toString();
              });
            }
          },
          onPageError: (page, error) {},
        ).fromPath(
          widget.url,
        );
      }
      return PDF(
        enableSwipe: true,
        swipeHorizontal: false,
        autoSpacing: false,
        pageFling: false,
      ).cachedFromUrl(
        widget.url,
        headers: widget.headers,
        placeholder: (progress) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BouncingBallsLoader(),
              const SizedBox(height: 16),
              Text(
                'LOADING PDF... $progress%',
                style: const TextStyle(
                  color: AppTheme.accentSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        ),
        errorWidget: (error) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(
                'Failed to load PDF\n$error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
      );
    } else if (isImage) {
      if (widget.isLocalFile) {
        return Center(
          child: InteractiveViewer(
            minScale: 1.0,
            maxScale: 5.0,
            child: Image.file(File(widget.url)),
          ),
        );
      }
      return Center(
        child: InteractiveViewer(
          minScale: 1.0,
          maxScale: 5.0,
          child: CachedNetworkImage(
            imageUrl: widget.url,
            httpHeaders: widget.headers,
            placeholder: (context, url) => const BouncingBallsLoader(),
            errorWidget: (context, url, error) => const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.broken_image_rounded,
                    color: Colors.redAccent, size: 48),
                SizedBox(height: 16),
                Text('Failed to load image',
                    style: TextStyle(color: AppTheme.textMuted)),
              ],
            ),
          ),
        ),
      );
    } else if (isVideo) {
      if (_isVideoError) {
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
      if (_chewieController != null &&
          _chewieController!.videoPlayerController.value.isInitialized) {
        return Chewie(controller: _chewieController!);
      } else {
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
    } else {
      return const Center(
        child: Text('Unsupported file format',
            style: TextStyle(color: AppTheme.textMuted)),
      );
    }
  }
}
