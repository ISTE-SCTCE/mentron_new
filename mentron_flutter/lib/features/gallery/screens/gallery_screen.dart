import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/liquid_background.dart';

class GalleryScreen extends StatelessWidget {
  const GalleryScreen({super.key});

  static const _images = [
    {'url': 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800', 'title': 'Tech Talk 2024', 'tag': 'Workshop'},
    {'url': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800', 'title': 'Hackathon SCTCE', 'tag': 'Competition'},
    {'url': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800', 'title': 'Ideation Lab', 'tag': 'Innovation'},
    {'url': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800', 'title': 'Team Building', 'tag': 'Execom'},
    {'url': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800', 'title': 'Annual Meet', 'tag': 'Networking'},
    {'url': 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800', 'title': 'Workshop Series', 'tag': 'Academic'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: Column(children: [
          const Text('FLASHBACKS', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Event Gallery', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 120, 16, 100),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.85),
          itemCount: _images.length,
          itemBuilder: (context, index) {
            final img = _images[index];
            return GestureDetector(
              onTap: () => _showFullImage(context, img),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(fit: StackFit.expand, children: [
                  CachedNetworkImage(imageUrl: img['url']!, fit: BoxFit.cover, memCacheWidth: 400,
                    placeholder: (ctx, url) => Container(color: Colors.white10),
                    errorWidget: (ctx, url, err) => Container(color: Colors.white10, child: const Icon(Icons.broken_image_outlined, color: Colors.white24)),
                  ),
                  // Gradient overlay
                  Positioned(bottom: 0, left: 0, right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [Colors.black87, Colors.transparent])),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                        Text(img['tag']!, style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
                        Text(img['title']!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ]),
                    ),
                  ),
                ]),
              ),
            ).animate().fadeIn(delay: (index * 80).ms).scale(begin: const Offset(0.95, 0.95));
          },
        ),
      ),
    );
  }

  void _showFullImage(BuildContext context, Map<String, String> img) {
    showDialog(context: context, builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ClipRRect(borderRadius: BorderRadius.circular(20), child: CachedNetworkImage(imageUrl: img['url']!, fit: BoxFit.cover)),
        const SizedBox(height: 12),
        Text(img['title']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        Text(img['tag']!, style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 10, letterSpacing: 1)),
      ]),
    ));
  }
}
