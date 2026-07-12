import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE THEME
// Distinct visual treatment for the Mentron peer-to-peer marketplace.
// Uses the same color tokens as the rest of the student-facing app but with
// its own gradient hero, bento grid, and gradient pill/card treatments.
//
// DO NOT use ExecTheme here — that is reserved for the EXECOM Payment
// Management module only.
// ─────────────────────────────────────────────────────────────────────────────

class MarketplaceTheme {
  MarketplaceTheme._();

  // ── Core Palette ───────────────────────────────────────────────────────────
  static const Color ink         = Color(0xFF2C2A45); // primary text / dark card bg
  static const Color body        = Color(0xFF8D8AA0); // secondary text
  static const Color coral       = Color(0xFFFF7A4D); // coral accent
  static const Color coralSoft   = Color(0xFFFFE3D6); // coral badge bg
  static const Color purple      = Color(0xFF7B6EF6); // purple accent
  static const Color purpleMid   = Color(0xFF9C7FF2); // gradient midpoint
  static const Color purpleSoft  = Color(0xFFEDEAFF); // purple badge bg
  static const Color surface     = Color(0xFFFFFFFF); // white surfaces
  static const Color background  = Color(0xFFF6F4FC); // page background

  // ── Signature Gradient (135°, purple → mid-purple → coral) ────────────────
  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF7B6EF6), Color(0xFF9C7FF2), Color(0xFFFF7A4D)],
    stops: [0.0, 0.5, 1.0],
    begin: Alignment(-0.71, -0.71), // approx 135°
    end:   Alignment(0.71,  0.71),
  );

  // Purple-only gradient for stat cards
  static const LinearGradient purpleGradient = LinearGradient(
    colors: [Color(0xFF7B6EF6), Color(0xFF9C7FF2)],
    begin: Alignment.topLeft,
    end:   Alignment.bottomRight,
  );

  // Coral-only gradient for stat cards
  static const LinearGradient coralGradient = LinearGradient(
    colors: [Color(0xFFFF7A4D), Color(0xFFFFAA80)],
    begin: Alignment.topLeft,
    end:   Alignment.bottomRight,
  );

  // ── Typography ─────────────────────────────────────────────────────────────
  static TextStyle heading(double size, {Color color = const Color(0xFF2C2A45)}) =>
      GoogleFonts.baloo2(fontSize: size, fontWeight: FontWeight.w800, color: color);

  static TextStyle price(double size, {Color color = Colors.white}) =>
      GoogleFonts.baloo2(fontSize: size, fontWeight: FontWeight.w900, color: color);

  static TextStyle label(double size, {Color color = const Color(0xFF8D8AA0)}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: FontWeight.w600, color: color);

  static TextStyle body_(double size, {Color color = const Color(0xFF8D8AA0)}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: FontWeight.w500, color: color);

  // ── Gradient Price Pill ────────────────────────────────────────────────────
  /// Builds the signature gradient price pill used on listing cards.
  static Widget pricePill(String priceText, {double fontSize = 12}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: heroGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        priceText,
        style: price(fontSize),
      ),
    );
  }

  // ── Condition Badge ────────────────────────────────────────────────────────
  static Widget conditionBadge(String condition) {
    Color bg;
    Color fg;
    switch (condition.toLowerCase()) {
      case 'new':
        bg = purpleSoft; fg = purple;
        break;
      case 'like_new':
        bg = const Color(0xFFDCFCE7); fg = const Color(0xFF16A34A);
        break;
      default:
        bg = coralSoft; fg = coral;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        condition.replaceAll('_', ' ').toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: fg,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  // ── Category Badge ─────────────────────────────────────────────────────────
  static Widget categoryBadge(String category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: purpleSoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _categoryLabel(category),
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: purple,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  static String _categoryLabel(String cat) {
    switch (cat) {
      case 'textbook':            return 'TEXTBOOK';
      case 'electronics':         return 'ELECTRONICS';
      case 'project_components':  return 'PROJECT PARTS';
      case 'stationery':          return 'STATIONERY';
      default:                    return 'OTHER';
    }
  }

  // ── Gradient Stat Card ─────────────────────────────────────────────────────
  /// [type] = 'purple' | 'coral' | 'ink'
  static Widget statCard({
    required String label,
    required String value,
    required String type,
    IconData? icon,
  }) {
    Gradient grad;
    Color bg;
    bool useGrad = true;
    switch (type) {
      case 'purple':
        grad = purpleGradient; bg = purple; break;
      case 'coral':
        grad = coralGradient; bg = coral; break;
      default:
        useGrad = false; bg = ink; grad = purpleGradient;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: useGrad ? grad : null,
        color: useGrad ? null : bg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: bg.withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, color: Colors.white.withOpacity(0.7), size: 18),
            const SizedBox(height: 8),
          ],
          Text(
            value,
            style: GoogleFonts.baloo2(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.75),
            ),
          ),
        ],
      ),
    );
  }

  // ── Card Shadow ────────────────────────────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.06),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  // ── Bottom Nav Gradient Fill (for marketplace tab active state) ────────────
  static const LinearGradient navActiveGradient = heroGradient;
}
