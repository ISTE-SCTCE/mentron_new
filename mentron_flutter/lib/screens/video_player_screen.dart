// lib/screens/video_player_screen.dart
//
// Full-screen video player for locally downloaded (offline) content.
// Uses SecureVideoPlayerWidget — screen protection is handled there.

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/theme/app_theme.dart';
import '../widgets/secure_video_player_widget.dart';

class VideoPlayerScreen extends StatefulWidget {
  /// For offline (decrypted) playback — provide [localFile].
  /// For streaming — provide [networkUrl].
  final File? localFile;
  final String? networkUrl;
  final String title;

  const VideoPlayerScreen({
    super.key,
    this.localFile,
    this.networkUrl,
    required this.title,
  }) : assert(localFile != null || networkUrl != null,
            'Provide localFile or networkUrl');

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  @override
  void initState() {
    super.initState();
    // Force landscape + hide system UI for full-screen immersion
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
      DeviceOrientation.portraitUp,
    ]);
  }

  @override
  void dispose() {
    // Restore portrait lock on exit
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        title: Text(
          widget.title,
          style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15),
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SecureVideoPlayerWidget(
        networkUrl: widget.networkUrl,
        localFilePath: widget.localFile?.path,
      ),
    );
  }
}
