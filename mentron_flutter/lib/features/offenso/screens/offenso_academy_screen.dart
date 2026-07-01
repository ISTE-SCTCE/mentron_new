import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OFFENSO ACADEMY — Main Screen (entry point)
// Dark cyberpunk minimalism. Serves as the shell for the full academy module.
// ─────────────────────────────────────────────────────────────────────────────

class OffensoAcademyScreen extends StatefulWidget {
  const OffensoAcademyScreen({super.key});

  @override
  State<OffensoAcademyScreen> createState() => _OffensoAcademyScreenState();
}

class _OffensoAcademyScreenState extends State<OffensoAcademyScreen> {
  // ── Brand palette ────────────────────────────────────────────────────────
  static const Color _neonGreen       = Color(0xFF00FF41);
  static const Color _surfaceDark     = Color(0xFF0A0E27);
  static const Color _surfaceMid      = Color(0xFF1A1F3A);
  static const Color _surfaceElevated = Color(0xFF252D4A);
  static const Color _textPrimary     = Color(0xFFF0F0F0);
  static const Color _textSecondary   = Color(0xFFA0A0A0);
  static const Color _border          = Color(0xFF2A3A5A);

  final List<_CourseCard> _courses = const [
    _CourseCard(
      title: 'Building a Hacker Mindset',
      subtitle: 'Module 01 · CIA Triad, breach analysis',
      icon: Icons.psychology_outlined,
      tag: 'MINDSET',
      lessons: 6,
      progress: 0.0,
      accentColor: Color(0xFF00FF41),
    ),
    _CourseCard(
      title: 'Linux & Packet Mastery',
      subtitle: 'Module 02 · CLI domination, Nmap, Wireshark',
      icon: Icons.terminal_outlined,
      tag: 'LINUX LAB',
      lessons: 8,
      progress: 0.0,
      accentColor: Color(0xFF00D9FF),
    ),
    _CourseCard(
      title: 'OSINT & Digital Profiling',
      subtitle: 'Module 03 · Google Dorking, Maltego, Sherlock',
      icon: Icons.manage_search_outlined,
      tag: 'OSINT',
      lessons: 7,
      progress: 0.0,
      accentColor: Color(0xFFFF006E),
    ),
    _CourseCard(
      title: 'Exploiting Web Applications',
      subtitle: 'Module 04 · SQLi, XSS, Burp Suite, DVWA',
      icon: Icons.bug_report_outlined,
      tag: 'WEB SEC',
      lessons: 10,
      progress: 0.0,
      accentColor: Color(0xFF00FF41),
    ),
    _CourseCard(
      title: 'Wireless & Mobile Security',
      subtitle: 'Module 05 · Wi-Fi hacking, APK analysis',
      icon: Icons.wifi_tethering_outlined,
      tag: 'WIRELESS',
      lessons: 6,
      progress: 0.0,
      accentColor: Color(0xFF00D9FF),
    ),
    _CourseCard(
      title: 'Phishing & Social Engineering',
      subtitle: 'Module 06 · GoPhish, email forensics',
      icon: Icons.phishing_outlined,
      tag: 'PHISHING',
      lessons: 5,
      progress: 0.0,
      accentColor: Color(0xFFFF006E),
    ),
    _CourseCard(
      title: 'Malware, RATs & Countermeasures',
      subtitle: 'Module 07 · Yara, Cuckoo sandbox, IR',
      icon: Icons.security_outlined,
      tag: 'MALWARE',
      lessons: 8,
      progress: 0.0,
      accentColor: Color(0xFF00FF41),
    ),
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surfaceDark,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Sticky header bar ─────────────────────────────────────────
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickyHeaderDelegate(
                minHeight: 56,
                maxHeight: 56,
                child: _buildHeader(),
              ),
            ),

            // ── Status card (profile / level / XP) ───────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: _buildStatusCard(),
              ).animate().fadeIn(delay: 50.ms).slideY(begin: 0.06, curve: Curves.easeOut),
            ),

            // ── Section: All Courses ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: _sectionLabel('ALL COURSES', count: _courses.length),
              ).animate().fadeIn(delay: 100.ms),
            ),

            // ── Course list ───────────────────────────────────────────────
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) => Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: _buildCourseListCard(_courses[i], i),
                )
                    .animate()
                    .fadeIn(delay: (100 + i * 50).ms)
                    .slideY(begin: 0.06, curve: Curves.easeOut),
                childCount: _courses.length,
              ),
            ),

            // ── Certificates teaser ───────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: _buildCertificateTeaser(),
              ).animate().fadeIn(delay: 500.ms),
            ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
          ],
        ),
      ),
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    return Container(
      color: _surfaceDark,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _surfaceMid,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _border),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: _neonGreen,
                size: 16,
              ),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Text(
              'OFFENSO ACADEMY',
              style: TextStyle(
                color: _textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
          ),
          // Settings icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _surfaceMid,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _border),
            ),
            child: const Icon(
              Icons.tune_rounded,
              color: _textSecondary,
              size: 18,
            ),
          ),
        ],
      ),
    );
  }

  // ── Status card ────────────────────────────────────────────────────────────

  Widget _buildStatusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_surfaceMid, _surfaceElevated],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _neonGreen.withOpacity(0.25),
          width: 1,
          // Dashed border approximation via custom approach
        ),
        boxShadow: [
          BoxShadow(
            color: _neonGreen.withOpacity(0.05),
            blurRadius: 20,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [_neonGreen, Color(0xFF00CC35)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Center(
              child: Text(
                '⚡',
                style: TextStyle(fontSize: 20),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Name + level badge
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Level badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: _neonGreen,
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: const Text(
                    'NOVICE',
                    style: TextStyle(
                      color: _surfaceDark,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Begin your hacking journey',
                  style: TextStyle(
                    color: _textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Circular XP ring
          _CircularXpRing(
            progress: 0.45,
            xp: 450,
            maxXp: 1000,
          ),
        ],
      ),
    );
  }

  // ── Course list card ───────────────────────────────────────────────────────

  Widget _buildCourseListCard(_CourseCard course, int index) {
    return GestureDetector(
      onTap: () {
        // TODO: Navigate to course detail screen
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Opening: ${course.title}',
              style: const TextStyle(fontFamily: 'monospace'),
            ),
            backgroundColor: _surfaceElevated,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: BorderSide(color: _neonGreen.withOpacity(0.4)),
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _surfaceMid,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _border, width: 1),
        ),
        child: Row(
          children: [
            // Icon badge
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: course.accentColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: course.accentColor.withOpacity(0.25),
                ),
              ),
              child: Icon(course.icon, color: course.accentColor, size: 20),
            ),
            const SizedBox(width: 14),
            // Title + meta
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tag badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: course.accentColor.withOpacity(0.10),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Text(
                      course.tag,
                      style: TextStyle(
                        color: course.accentColor,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    course.title,
                    style: const TextStyle(
                      color: _textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    course.subtitle,
                    style: const TextStyle(
                      color: _textSecondary,
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(1),
                    child: LinearProgressIndicator(
                      value: course.progress,
                      minHeight: 2,
                      backgroundColor: _border,
                      valueColor: AlwaysStoppedAnimation<Color>(course.accentColor),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Right side: lesson count + arrow
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${course.lessons}',
                  style: const TextStyle(
                    color: _textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const Text(
                  'lessons',
                  style: TextStyle(
                    color: _textSecondary,
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: _textSecondary,
                  size: 12,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Certificate teaser ─────────────────────────────────────────────────────

  Widget _buildCertificateTeaser() {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_surfaceMid, _surfaceElevated],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _neonGreen.withOpacity(0.2),
          style: BorderStyle.solid,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: _neonGreen.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.workspace_premium_outlined, color: _neonGreen, size: 26),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CERTIFICATE OF COMPLETION',
                  style: TextStyle(
                    color: _neonGreen,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Ethical Hacking Mastery 101',
                  style: TextStyle(
                    color: _textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Complete all 7 modules to earn your certificate',
                  style: TextStyle(
                    color: _textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              border: Border.all(color: _neonGreen, width: 1),
              borderRadius: BorderRadius.circular(2),
            ),
            child: const Text(
              'VIEW',
              style: TextStyle(
                color: _neonGreen,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label, {int? count}) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 14,
          decoration: BoxDecoration(
            color: _neonGreen,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: _textSecondary,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.5,
          ),
        ),
        if (count != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: _neonGreen.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: _neonGreen.withOpacity(0.35)),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                color: _neonGreen,
                fontSize: 9,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper data class
// ─────────────────────────────────────────────────────────────────────────────

class _CourseCard {
  final String title;
  final String subtitle;
  final IconData icon;
  final String tag;
  final int lessons;
  final double progress;
  final Color accentColor;
  const _CourseCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tag,
    required this.lessons,
    required this.progress,
    required this.accentColor,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Circular XP Progress Ring widget
// ─────────────────────────────────────────────────────────────────────────────

class _CircularXpRing extends StatelessWidget {
  final double progress; // 0.0 – 1.0
  final int xp;
  final int maxXp;
  const _CircularXpRing({
    required this.progress,
    required this.xp,
    required this.maxXp,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            painter: _RingPainter(progress: progress),
            size: const Size(64, 64),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$xp',
                style: const TextStyle(
                  color: Color(0xFF00FF41),
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Text(
                'XP',
                style: TextStyle(
                  color: Color(0xFFA0A0A0),
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  const _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    const strokeWidth = 3.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - strokeWidth / 2;

    // Track
    final trackPaint = Paint()
      ..color = const Color(0xFF2A3A5A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = const Color(0xFF00FF41)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky header delegate
// ─────────────────────────────────────────────────────────────────────────────

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final double minHeight;
  final double maxHeight;
  final Widget child;
  const _StickyHeaderDelegate({
    required this.minHeight,
    required this.maxHeight,
    required this.child,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => maxHeight;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_StickyHeaderDelegate old) {
    return old.maxHeight != maxHeight ||
        old.minHeight != minHeight ||
        old.child != child;
  }
}



