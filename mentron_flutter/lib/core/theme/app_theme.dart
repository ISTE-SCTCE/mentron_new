import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Core Background & Surface ──────────────────────────────────────────────
  static const Color bgColor = Color(0xFFF8F6FF);
  static const Color surfaceColor = Colors.white;

  // ── Accent Colors ──────────────────────────────────────────────────────────
  static const Color accentPrimary = Color(0xFF6C63FF);    // Indigo-violet (main CTA)
  static const Color accentSecondary = Color(0xFFFF8C69);  // Warm peach
  static const Color accentTertiary = Color(0xFF4ECDC4);   // Mint green
  static const Color accentLavender = Color(0xFFB8B4FF);   // Soft lavender
  static const Color accentBlue = Color(0xFF74B9FF);       // Sky blue
  static const Color accentPink = Color(0xFFFFB3C6);       // Soft pink

  // ── Text Colors ────────────────────────────────────────────────────────────
  static const Color textMain = Color(0xFF2D2845);
  static const Color textMuted = Color(0xFF8B85A8);
  static const Color textLight = Color(0xFFB8B4D0);

  // ── Card Tinted Backgrounds ────────────────────────────────────────────────
  static const Color cardBg1 = Color(0xFFEEECFF);  // Indigo tint
  static const Color cardBg2 = Color(0xFFFFF3EE);  // Peach tint
  static const Color cardBg3 = Color(0xFFEEFAF9);  // Mint tint
  static const Color cardBg4 = Color(0xFFF0F8FF);  // Blue tint

  // ── Glass / Border ──────────────────────────────────────────────────────────
  static const Color glassSurface = Color(0xF8FFFFFF);
  static const Color glassBorder = Color(0x1A6C63FF);
  static const double glassBlur = 12.0;

  // ── Gradient Presets ───────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8B7FFF), Color(0xFF6C63FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient softGradient = LinearGradient(
    colors: [Color(0xFFF8F6FF), Color(0xFFEFEDFF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient card1Gradient = LinearGradient(
    colors: [Color(0xFF9F97FF), Color(0xFF6C63FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient card2Gradient = LinearGradient(
    colors: [Color(0xFFFFAA85), Color(0xFFFF8C69)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Subject Chip Colors ────────────────────────────────────────────────────
  static const List<Color> chipColors = [
    Color(0xFFEEECFF),
    Color(0xFFFFF3EE),
    Color(0xFFEEFAF9),
    Color(0xFFF0F8FF),
    Color(0xFFFFF0F5),
    Color(0xFFF5FFF0),
  ];
  static const List<Color> chipTextColors = [
    Color(0xFF6C63FF),
    Color(0xFFFF8C69),
    Color(0xFF4ECDC4),
    Color(0xFF74B9FF),
    Color(0xFFFF8FAB),
    Color(0xFF52B788),
  ];

  // ══════════════════════════════════════════════════════════════════════════
  static ThemeData get darkTheme {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      brightness: Brightness.light,
      scaffoldBackgroundColor: bgColor,
      primaryColor: accentPrimary,
      hintColor: accentSecondary,
      splashColor: accentPrimary.withValues(alpha: 0.08),
      highlightColor: accentPrimary.withValues(alpha: 0.05),
      colorScheme: const ColorScheme.light(
        primary: accentPrimary,
        secondary: accentSecondary,
        tertiary: accentTertiary,
        surface: surfaceColor,
        onSurface: textMain,
      ),
      textTheme: GoogleFonts.poppinsTextTheme(
        base.textTheme.copyWith(
          displayLarge: GoogleFonts.poppins(
            color: textMain,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.0,
          ),
          displayMedium: GoogleFonts.poppins(
            color: textMain,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
          displaySmall: GoogleFonts.poppins(
            color: textMain,
            fontWeight: FontWeight.w700,
          ),
          titleLarge: GoogleFonts.poppins(
            color: textMain,
            fontWeight: FontWeight.w700,
          ),
          titleMedium: GoogleFonts.poppins(
            color: textMain,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: GoogleFonts.inter(
            color: textMain,
            fontWeight: FontWeight.w600,
          ),
          bodyMedium: GoogleFonts.inter(
            color: textMuted,
            fontWeight: FontWeight.w500,
          ),
          bodySmall: GoogleFonts.inter(
            color: textMuted,
            fontWeight: FontWeight.w500,
            fontSize: 11,
          ),
          labelLarge: GoogleFonts.inter(
            color: textMain,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
          labelSmall: GoogleFonts.inter(
            color: textMuted,
            fontWeight: FontWeight.w600,
            fontSize: 10,
            letterSpacing: 0.8,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentPrimary,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.poppins(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            letterSpacing: 0.2,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
          elevation: 0,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: accentPrimary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF5F3FF),
        hintStyle: TextStyle(
          color: textMuted.withValues(alpha: 0.72),
          fontSize: 14,
          fontFamily: GoogleFonts.inter().fontFamily,
        ),
        labelStyle: GoogleFonts.inter(
          color: accentPrimary,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
        ),
        prefixIconColor: textMuted,
        suffixIconColor: textMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: glassBorder, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: glassBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: accentPrimary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Color(0xFFFF6B6B), width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Color(0xFFFF6B6B), width: 1.6),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
          side: const BorderSide(color: glassBorder, width: 1),
        ),
        titleTextStyle: GoogleFonts.poppins(
          color: textMain,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: GoogleFonts.inter(
          color: textMuted,
          fontSize: 14,
          height: 1.6,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        modalElevation: 0,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textMain,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentTextStyle: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        actionTextColor: accentSecondary,
        insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      ),
      dividerTheme: DividerThemeData(
        color: accentPrimary.withValues(alpha: 0.08),
        thickness: 1,
        space: 1,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: glassBorder, width: 1),
        ),
        margin: const EdgeInsets.symmetric(vertical: 6),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: glassBorder, width: 1),
        ),
        textStyle: GoogleFonts.inter(color: textMain, fontSize: 13),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: GoogleFonts.poppins(
          color: textMain,
          fontSize: 17,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: const IconThemeData(color: textMain),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: accentPrimary,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: cardBg1,
        side: BorderSide.none,
        labelStyle: GoogleFonts.inter(
          color: accentPrimary,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
      ),
    );
  }
}
