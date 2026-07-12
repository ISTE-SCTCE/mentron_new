import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/marketplace_theme.dart';
import '../../../models/marketplace_order.dart';

// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusStepper — vertical stepper for buyer-facing order tracking.
// Stages: Payment Confirmed → Seller Notified → Awaiting Pickup → Delivered/Refunded
// ─────────────────────────────────────────────────────────────────────────────

class OrderStatusStepper extends StatefulWidget {
  final MarketplaceOrder order;

  const OrderStatusStepper({super.key, required this.order});

  @override
  State<OrderStatusStepper> createState() => _OrderStatusStepperState();
}

class _OrderStatusStepperState extends State<OrderStatusStepper> {
  Timer? _countdownTimer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    if (widget.order.orderStatus == OrderStatus.paymentConfirmed &&
        !widget.order.isOverdue) {
      _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) _updateRemaining();
      });
    }
  }

  void _updateRemaining() {
    setState(() {
      _remaining = widget.order.deliveryDeadline.difference(DateTime.now());
      if (_remaining.isNegative) _remaining = Duration.zero;
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  String get _countdownText {
    if (_remaining == Duration.zero) return 'Deadline passed';
    final h = _remaining.inHours;
    final m = _remaining.inMinutes % 60;
    final s = _remaining.inSeconds % 60;
    return '${h}h ${m}m ${s}s left';
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.order.orderStatus;

    // Terminal states: show compact badge
    if (status == OrderStatus.delivered || status == OrderStatus.refunded) {
      return _TerminalBadge(status: status);
    }
    if (status == OrderStatus.cancelled) {
      return _TerminalBadge(status: status);
    }

    // Active stepper
    final steps = [
      _StepData(
        label: 'Payment Confirmed',
        subtitle: 'Your payment has been verified by EXECOM',
        icon: Icons.verified_rounded,
        isDone: _isAtOrPast(OrderStatus.paymentConfirmed, status),
        isActive: status == OrderStatus.paymentConfirmed,
      ),
      _StepData(
        label: 'Seller Notified',
        subtitle: 'Seller has been notified to hand over the item',
        icon: Icons.notifications_active_rounded,
        isDone: _isAtOrPast(OrderStatus.paymentConfirmed, status),
        isActive: status == OrderStatus.paymentConfirmed,
      ),
      _StepData(
        label: 'Awaiting Pickup',
        subtitle: status == OrderStatus.paymentConfirmed
            ? _countdownText
            : 'Pending payment confirmation',
        icon: Icons.schedule_rounded,
        isDone: false,
        isActive: status == OrderStatus.paymentConfirmed,
        isCountdown: true,
      ),
      _StepData(
        label: 'Delivered',
        subtitle: 'Item received successfully',
        icon: Icons.check_circle_rounded,
        isDone: false,
        isActive: false,
      ),
    ];

    return Column(
      children: steps.asMap().entries.map((entry) {
        final i = entry.key;
        final step = entry.value;
        final isLast = i == steps.length - 1;
        return _StepRow(step: step, isLast: isLast);
      }).toList(),
    );
  }

  bool _isAtOrPast(OrderStatus check, OrderStatus current) {
    const order = [
      OrderStatus.pendingVerification,
      OrderStatus.paymentConfirmed,
      OrderStatus.delivered,
    ];
    final checkIdx   = order.indexOf(check);
    final currentIdx = order.indexOf(current);
    return currentIdx >= checkIdx;
  }
}

class _StepData {
  final String label;
  final String subtitle;
  final IconData icon;
  final bool isDone;
  final bool isActive;
  final bool isCountdown;

  const _StepData({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.isDone,
    required this.isActive,
    this.isCountdown = false,
  });
}

class _StepRow extends StatelessWidget {
  final _StepData step;
  final bool isLast;

  const _StepRow({required this.step, required this.isLast});

  @override
  Widget build(BuildContext context) {
    Color dotColor;
    Color iconColor;
    if (step.isDone) {
      dotColor = MarketplaceTheme.purple;
      iconColor = Colors.white;
    } else if (step.isActive) {
      dotColor = MarketplaceTheme.coral;
      iconColor = Colors.white;
    } else {
      dotColor = const Color(0xFFE5E3F0);
      iconColor = MarketplaceTheme.body;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dot + line column
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                  boxShadow: step.isActive
                      ? [
                          BoxShadow(
                            color: MarketplaceTheme.coral.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          )
                        ]
                      : null,
                ),
                child: Icon(step.icon, color: iconColor, size: 18),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: step.isDone
                        ? MarketplaceTheme.purple.withOpacity(0.25)
                        : const Color(0xFFE5E3F0),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          // Text
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(top: 6, bottom: isLast ? 0 : 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: step.isActive || step.isDone
                          ? MarketplaceTheme.ink
                          : MarketplaceTheme.body,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    step.subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: step.isCountdown && step.isActive
                          ? FontWeight.w700
                          : FontWeight.w500,
                      color: step.isCountdown && step.isActive
                          ? MarketplaceTheme.coral
                          : MarketplaceTheme.body,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TerminalBadge extends StatelessWidget {
  final OrderStatus status;
  const _TerminalBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (status) {
      case OrderStatus.delivered:
        bg = const Color(0xFFDCFCE7); fg = const Color(0xFF16A34A);
        label = 'Delivered'; icon = Icons.check_circle_rounded;
        break;
      case OrderStatus.refunded:
        bg = MarketplaceTheme.purpleSoft; fg = MarketplaceTheme.purple;
        label = 'Refunded'; icon = Icons.replay_rounded;
        break;
      default:
        bg = MarketplaceTheme.coralSoft; fg = MarketplaceTheme.coral;
        label = 'Cancelled'; icon = Icons.cancel_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: fg, size: 16),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
