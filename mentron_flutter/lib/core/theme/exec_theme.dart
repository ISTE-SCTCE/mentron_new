import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────────────────────
// EXEC THEME DATA & OVERRIDE
// Cyberpunk dark minimalism.
// ─────────────────────────────────────────────────────────────────────────────

class ExecThemeData {
  // Core palette
  static const Color primaryDark     = Color(0xFF0D1117); // Near-black with blue tint
  static const Color accentPurple    = Color(0xFF6D28D9); // Vibrant purple
  static const Color accentNeonCyan  = Color(0xFF06B6D4); // Cyberpunk cyan
  static const Color cardBg          = Color(0xFF1A1A2E); // Slightly raised dark card bg
  static const Color textPrimary     = Color(0xFFE5E7EB); // Light gray text
  static const Color textMuted       = Color(0xFF8B9BB4); // Muted text

  // Gradient background components
  static const Color gradientStart   = Color(0xFF1A0F2E); // Dark purple
  static const Color gradientEnd     = Color(0xFF0D1B2A); // Dark teal

  static const LinearGradient bgGradient = LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get theme {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      brightness: Brightness.dark,
      // Transparent background so the underlying gradient is visible
      scaffoldBackgroundColor: Colors.transparent,
      primaryColor: accentPurple,
      hintColor: accentNeonCyan,
      canvasColor: primaryDark,
      cardColor: cardBg,

      // ── Typography (JetBrains Mono for consistency) ────────────────────────
      textTheme: GoogleFonts.jetBrainsMonoTextTheme(
        base.textTheme.copyWith(
          displayLarge: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.5,
          ),
          displayMedium: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w800,
            letterSpacing: -1.0,
          ),
          displaySmall: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w700,
          ),
          titleLarge: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.bold,
          ),
          titleMedium: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w500,
          ),
          bodyMedium: GoogleFonts.jetBrainsMono(
            color: textMuted,
            fontWeight: FontWeight.w400,
          ),
          bodySmall: GoogleFonts.jetBrainsMono(
            color: textMuted,
            fontWeight: FontWeight.w400,
            fontSize: 11,
          ),
          labelLarge: GoogleFonts.jetBrainsMono(
            color: textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
          labelSmall: GoogleFonts.jetBrainsMono(
            color: textMuted,
            fontWeight: FontWeight.w600,
            fontSize: 10,
            letterSpacing: 0.8,
          ),
        ),
      ),

      // ── ElevatedButton Theme with purple background + cyan border ──────────
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentPurple,
          foregroundColor: textPrimary,
          textStyle: GoogleFonts.jetBrainsMono(
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: accentNeonCyan, width: 1.5),
          ),
          elevation: 0,
        ),
      ),

      // ── TextButton Theme using Neon Cyan ──────────────────────────────────
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: accentNeonCyan,
          textStyle: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.bold),
        ),
      ),

      // ── Card Theme: card bg with neon cyan accent borders ─────────────────
      cardTheme: CardThemeData(
        color: cardBg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: accentNeonCyan, width: 1.2),
        ),
        margin: const EdgeInsets.symmetric(vertical: 6),
      ),

      // ── Input/TextField Theme ──────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBg,
        hintStyle: TextStyle(color: textMuted.withOpacity(0.6), fontSize: 13),
        labelStyle: const TextStyle(
          color: accentNeonCyan,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1,
        ),
        prefixIconColor: textMuted,
        suffixIconColor: textMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: accentPurple, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: accentPurple, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: accentNeonCyan, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      ),

      // ── Bottom Navigation Bar Theme ────────────────────────────────────────
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: cardBg,
        selectedItemColor: accentNeonCyan,
        unselectedItemColor: textMuted,
      ),

      // ── Floating Action Button Theme ────────────────────────────────────────
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accentNeonCyan,
        foregroundColor: primaryDark,
      ),

      // ── Dialog Theme ───────────────────────────────────────────────────────
      dialogTheme: DialogThemeData(
        backgroundColor: cardBg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: accentNeonCyan, width: 1),
        ),
        titleTextStyle: GoogleFonts.jetBrainsMono(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        contentTextStyle: GoogleFonts.jetBrainsMono(
          color: textMuted,
          fontSize: 13,
          height: 1.6,
        ),
      ),

      // ── BottomSheet Theme ──────────────────────────────────────────────────
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: cardBg,
        surfaceTintColor: Colors.transparent,
        modalElevation: 0,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),

      // ── SnackBar Theme ─────────────────────────────────────────────────────
      snackBarTheme: SnackBarThemeData(
        backgroundColor: cardBg,
        behavior: SnackBarBehavior.floating,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: accentNeonCyan, width: 1),
        ),
        contentTextStyle: GoogleFonts.jetBrainsMono(
          color: textPrimary,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        actionTextColor: accentNeonCyan,
        insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      ),

      // ── Divider Theme ──────────────────────────────────────────────────────
      dividerTheme: DividerThemeData(
        color: Colors.white.withOpacity(0.06),
        thickness: 1,
        space: 1,
      ),
    );
  }
}

class ExecTheme {
  // Retain original helper names for compatibility across screens
  static const Color bgColor         = ExecThemeData.primaryDark;
  static const Color surfaceColor     = ExecThemeData.cardBg;
  static const Color accentPrimary    = ExecThemeData.accentPurple;
  static const Color accentSecondary  = ExecThemeData.accentNeonCyan;
  static const Color textMain         = ExecThemeData.textPrimary;
  static const Color textMuted        = ExecThemeData.textMuted;

  static const Color glassSurface = Color(0x0CFFFFFF);
  static const Color glassBorder  = Color(0x18FFFFFF);
  static const double glassBlur   = 14.0;

  static ThemeData get darkTheme => ExecThemeData.theme;
}
