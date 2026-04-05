import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';

class MarketplaceScreen extends StatelessWidget {
  const MarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false, // top-level tab — no back button
        title: Column(children: [
          const Text('MENTRON', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
          const Text('Marketplace', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: LiquidBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon Header
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    gradient: const LinearGradient(
                      colors: [
                        AppTheme.accentPrimary,
                        AppTheme.accentSecondary,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.accentPrimary.withValues(alpha: 0.4),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text('🛍️', style: TextStyle(fontSize: 48)),
                  ),
                ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),

                const SizedBox(height: 32),

                // Coming Soon Text
                const Text(
                  'COMING SOON',
                  style: TextStyle(
                    color: AppTheme.accentSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4,
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.5),

                const SizedBox(height: 12),

                const Text(
                  'Student Market',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1,
                  ),
                ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                const SizedBox(height: 24),

                const Text(
                  'Buy and sell items within the Mentron community.\nWe\'re putting the finishing touches on it — stay tuned!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ).animate().fadeIn(delay: 400.ms),

                const SizedBox(height: 48),

                // Feature Teasers
                Row(
                  children: [
                    _buildFeatureCard('📦', 'Buy Items', 500),
                    const SizedBox(width: 12),
                    _buildFeatureCard('🏷️', 'Sell Stuff', 600),
                    const SizedBox(width: 12),
                    _buildFeatureCard('🤝', 'Sweet Deals', 700),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(String icon, String label, int delayMs) {
    return Expanded(
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 12),
            Text(
              label.toUpperCase(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.textMuted,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ).animate().fadeIn(delay: delayMs.ms).slideY(begin: 0.2),
    );
  }
}
