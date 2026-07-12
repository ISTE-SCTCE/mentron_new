import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/broadcast_notification.dart';

/// Small pill-shaped status badge for broadcast notifications.
/// Used in both the EXECOM History tab and the user-facing Inbox screen.
class NotificationStatusBadge extends StatelessWidget {
  final BroadcastStatus status;
  final double fontSize;

  const NotificationStatusBadge({
    super.key,
    required this.status,
    this.fontSize = 9.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: status.bgColor,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: status.color.withOpacity(0.5), width: 0.8),
      ),
      child: Text(
        status.label,
        style: GoogleFonts.jetBrainsMono(
          color: status.color,
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
