import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// A reusable, subtle skeleton box animated with flutter_animate's shimmer effect.
class SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final bool isDark;
  final EdgeInsetsGeometry? margin;

  const SkeletonBox({
    super.key,
    this.width,
    required this.height,
    this.borderRadius = 12,
    this.isDark = true,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final baseColor = isDark
        ? Colors.white.withValues(alpha: 0.06)
        : Colors.black.withValues(alpha: 0.05);
    final shimmerColor = isDark
        ? Colors.white.withValues(alpha: 0.14)
        : Colors.white.withValues(alpha: 0.70);

    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    )
        .animate(onPlay: (c) => c.repeat())
        .shimmer(
          duration: 1200.ms,
          color: shimmerColor,
          curve: Curves.easeInOut,
        );
  }
}

/// Shimmer skeleton matching the Marketplace feed (featured card + 2-col grid).
class MarketplaceSkeletonGrid extends StatelessWidget {
  const MarketplaceSkeletonGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Featured card skeleton
          const SkeletonBox(
            height: 160,
            borderRadius: 24,
            isDark: true,
          ),
          const SizedBox(height: 16),
          // 2x2 grid skeleton
          Row(
            children: const [
              Expanded(
                child: SkeletonBox(
                  height: 210,
                  borderRadius: 20,
                  isDark: false,
                ),
              ),
              SizedBox(width: 14),
              Expanded(
                child: SkeletonBox(
                  height: 210,
                  borderRadius: 20,
                  isDark: false,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: const [
              Expanded(
                child: SkeletonBox(
                  height: 210,
                  borderRadius: 20,
                  isDark: false,
                ),
              ),
              SizedBox(width: 14),
              Expanded(
                child: SkeletonBox(
                  height: 210,
                  borderRadius: 20,
                  isDark: false,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Shimmer skeleton matching the Notes By Subject screen.
class NotesSkeletonList extends StatelessWidget {
  const NotesSkeletonList({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 110, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header card skeleton
          const SkeletonBox(height: 84, borderRadius: 20),
          const SizedBox(height: 16),
          // Virtual folder pills row
          Row(
            children: const [
              Expanded(child: SkeletonBox(height: 64, borderRadius: 16)),
              SizedBox(width: 16),
              Expanded(child: SkeletonBox(height: 64, borderRadius: 16)),
            ],
          ),
          const SizedBox(height: 24),
          // Note card items
          const SkeletonBox(height: 92, borderRadius: 18),
          const SizedBox(height: 12),
          const SkeletonBox(height: 92, borderRadius: 18),
          const SizedBox(height: 12),
          const SkeletonBox(height: 92, borderRadius: 18),
        ],
      ),
    );
  }
}

/// Shimmer skeleton matching the Projects feed list.
class ProjectSkeletonList extends StatelessWidget {
  const ProjectSkeletonList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 110, 24, 80),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 4,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                SkeletonBox(width: 38, height: 38, borderRadius: 12),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 140, height: 16, borderRadius: 6),
                      SizedBox(height: 6),
                      SkeletonBox(width: 90, height: 10, borderRadius: 4),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const SkeletonBox(height: 12, borderRadius: 4),
            const SizedBox(height: 6),
            const SkeletonBox(width: 220, height: 12, borderRadius: 4),
          ],
        ),
      ),
    );
  }
}

/// Shimmer skeleton matching the Events & Concepts list.
class EventSkeletonList extends StatelessWidget {
  const EventSkeletonList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 110, 24, 80),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 3,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                SkeletonBox(width: 44, height: 44, borderRadius: 22),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 160, height: 18, borderRadius: 6),
                      SizedBox(height: 6),
                      SkeletonBox(width: 100, height: 12, borderRadius: 4),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const SkeletonBox(height: 12, borderRadius: 4),
            const SizedBox(height: 6),
            const SkeletonBox(width: 200, height: 12, borderRadius: 4),
          ],
        ),
      ),
    );
  }
}

/// Shimmer skeleton matching My Orders screen.
class OrdersSkeletonList extends StatelessWidget {
  const OrdersSkeletonList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 4,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const SkeletonBox(
              width: 72,
              height: 72,
              borderRadius: 14,
              isDark: false,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 130, height: 14, borderRadius: 4, isDark: false),
                  SizedBox(height: 8),
                  SkeletonBox(width: 80, height: 12, borderRadius: 4, isDark: false),
                  SizedBox(height: 8),
                  SkeletonBox(width: 60, height: 12, borderRadius: 4, isDark: false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer skeleton matching Requests / Approvals screen.
class RequestsSkeletonList extends StatelessWidget {
  const RequestsSkeletonList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 110, 24, 80),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 3,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SkeletonBox(width: 180, height: 18, borderRadius: 6),
            const SizedBox(height: 8),
            const SkeletonBox(width: 120, height: 12, borderRadius: 4),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: const [
                SkeletonBox(width: 80, height: 32, borderRadius: 10),
                SizedBox(width: 10),
                SkeletonBox(width: 80, height: 32, borderRadius: 10),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
