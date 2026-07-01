import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/app_transitions.dart';
import 'login_screen.dart';
import 'signup_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'ACADEMIC COMPANION',
      description: 'Access premium curated notes, syllabus, question papers, and essential learning materials structured by semester and department.',
      icon: Icons.auto_stories_rounded,
      color: AppTheme.accentPrimary,
    ),
    OnboardingData(
      title: 'COLLABORATIVE PROJECTS',
      description: 'Showcase your innovations, apply for club projects, and build hands-on technical solutions with the support of ISTE SCTCE mentors.',
      icon: Icons.rocket_launch_rounded,
      color: AppTheme.accentSecondary,
    ),
    OnboardingData(
      title: 'ISTE COMMUNITY & EVENTS',
      description: 'Level up your profile, earn XP, and stay ahead with direct registrations for workshops, hackathons, and elite technical sessions.',
      icon: Icons.diversity_3_rounded,
      color: AppTheme.accentTertiary,
    ),
  ];

  Future<void> _completeOnboarding(Widget targetScreen) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);
    if (mounted) {
      Navigator.pushReplacement(context, AppTransitions.fade(targetScreen));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LiquidBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Top Bar with Logo and Skip Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Image.asset(
                      'assets/images/mentron_logo.png',
                      height: 36,
                      errorBuilder: (_, __, ___) => const Text(
                        'MENTRON',
                        style: TextStyle(
                          color: AppTheme.textMain,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    if (_currentPage < 2)
                      TextButton(
                        onPressed: () => _pageController.animateToPage(
                          2,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        ),
                        child: const Text(
                          'Skip',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Page Content
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() {
                      _currentPage = index;
                    });
                  },
                  itemCount: _pages.length,
                  itemBuilder: (context, index) {
                    final item = _pages[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Animated Center Graphic / Icon
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: item.color.withOpacity(0.1),
                              border: Border.all(
                                color: item.color.withOpacity(0.2),
                                width: 2,
                              ),
                            ),
                            child: Icon(
                              item.icon,
                              size: 64,
                              color: item.color,
                            ),
                          ),
                          const SizedBox(height: 48),

                          // Text Content Card
                          GlassContainer(
                            padding: const EdgeInsets.all(28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  item.title,
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontSize: 15,
                                    letterSpacing: 2,
                                    color: item.color,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  item.description,
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.textMain.withOpacity(0.8),
                                    height: 1.6,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Bottom Indicator & Buttons Area
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Indicators
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _pages.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _currentPage == index ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? _pages[index].color
                                : AppTheme.textLight.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Navigation / CTA Button
                    if (_currentPage < 2)
                      ElevatedButton(
                        onPressed: () => _pageController.nextPage(
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 56),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('NEXT'),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                      )
                    else
                      Column(
                        children: [
                          ElevatedButton(
                            onPressed: () => _completeOnboarding(const LoginScreen()),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 56),
                              backgroundColor: AppTheme.accentPrimary,
                            ),
                            child: const Text('ENTER SYSTEM'),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () => _completeOnboarding(const SignupScreen()),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 56),
                              side: const BorderSide(color: AppTheme.accentPrimary, width: 1.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(50),
                              ),
                              foregroundColor: AppTheme.accentPrimary,
                            ),
                            child: const Text(
                              'CREATE ACCOUNT',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  OnboardingData({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });
}

