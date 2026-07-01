import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../shared/widgets/glass_container.dart';

class ForceUpdateScreen extends StatelessWidget {
  final String playStoreUrl = 'https://play.google.com/store/apps/details?id=com.istesctce.mentron'; // Replace with actual package

  const ForceUpdateScreen({super.key});

  Future<void> _launchPlayStore() async {
    final url = Uri.parse(playStoreUrl);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      debugPrint('Could not launch $playStoreUrl');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Return PopScope to prevent back navigation
    return PopScope(
      canPop: false,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
            const LiquidBackground(
              child: SizedBox.expand(),
            ),
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/images/mentron_logo.png',
                      height: 100,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(Icons.rocket_launch_rounded, size: 80, color: AppTheme.accentPrimary),
                    ).animate().scale(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 32),
                    const Text(
                      'UPDATE REQUIRED',
                      style: TextStyle(
                        color: AppTheme.accentSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3,
                      ),
                    ).animate().fadeIn(delay: 200.ms),
                    const SizedBox(height: 12),
                    const Text(
                      'New Version Available',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textMain,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ).animate().fadeIn(delay: 300.ms),
                    const SizedBox(height: 16),
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: const Text(
                        'A newer version of Mentron is required to continue using the application. Please update to enjoy the latest features and bug fixes.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),
                    ).animate().slideY(begin: 0.1, delay: 400.ms).fadeIn(),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: _launchPlayStore,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 8,
                        shadowColor: AppTheme.accentPrimary.withOpacity(0.4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.system_update_rounded),
                          SizedBox(width: 12),
                          Text(
                            'UPDATE NOW',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ).animate().scale(delay: 500.ms, duration: 300.ms, curve: Curves.easeOutBack),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

