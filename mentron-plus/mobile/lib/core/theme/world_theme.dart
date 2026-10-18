import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;

enum CampusWorld { learn, campus }

@immutable
class WorldTheme extends ThemeExtension<WorldTheme> {
  const WorldTheme({
    required this.background,
    required this.accent,
    required this.accentInk,
    required this.surface,
    required this.text,
    required this.muted,
    required this.secondary,
    required this.mint,
  });
  final Color background,
      accent,
      accentInk,
      surface,
      text,
      muted,
      secondary,
      mint;
  static const learn = WorldTheme(
    background: Color(0xFFF8F6FF),
    accent: Color(0xFF6C63FF),
    accentInk: Color(0xFF5144C0),
    surface: Color(0xFFEEE9FA),
    text: Color(0xFF2D2845),
    muted: Color(0xFF746B86),
    secondary: Color(0xFFFF8C69),
    mint: Color(0xFF4ECDC4),
  );
  static const campus = WorldTheme(
    background: Color(0xFFEBF3FC),
    accent: Color(0xFF5F85A2),
    accentInk: Color(0xFF365D79),
    surface: Color(0xFFE0EBF2),
    text: Color(0xFF293F51),
    muted: Color(0xFF607788),
    secondary: Color(0xFFD97D55),
    mint: Color(0xFF3AAFA9),
  );
  static WorldTheme of(BuildContext context) =>
      Theme.of(context).extension<WorldTheme>()!;
  @override
  WorldTheme copyWith({
    Color? background,
    Color? accent,
    Color? accentInk,
    Color? surface,
    Color? text,
    Color? muted,
    Color? secondary,
    Color? mint,
  }) => WorldTheme(
    background: background ?? this.background,
    accent: accent ?? this.accent,
    accentInk: accentInk ?? this.accentInk,
    surface: surface ?? this.surface,
    text: text ?? this.text,
    muted: muted ?? this.muted,
    secondary: secondary ?? this.secondary,
    mint: mint ?? this.mint,
  );
  @override
  WorldTheme lerp(covariant WorldTheme? other, double t) {
    if (other == null) return this;
    return WorldTheme(
      background: Color.lerp(background, other.background, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentInk: Color.lerp(accentInk, other.accentInk, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      text: Color.lerp(text, other.text, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      mint: Color.lerp(mint, other.mint, t)!,
    );
  }
}

abstract final class CampusTokens {
  static const radii = [12.0, 16.0, 24.0, 32.0];
  static const space = [4.0, 8.0, 12.0, 16.0, 24.0, 32.0, 48.0];
  static const lavender = Color(0xFFB8B4FF);
  static const gold = Color(0xFFF5C842);
  static const peachSurface = Color(0xFFFAE9DF);
  static const mintSurface = Color(0xFFE4F0E9);
  static const butterSurface = Color(0xFFF4EED8);
  static List<BoxShadow> shadow(Color tint) => [
    BoxShadow(
      color: tint.withValues(alpha: .06),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
}

ThemeData campusTheme(CampusWorld world, {WorldTheme? colors}) {
  final w =
      colors ??
      (world == CampusWorld.learn ? WorldTheme.learn : WorldTheme.campus);
  const font = 'Inter';
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'Inter',
    colorScheme: ColorScheme.fromSeed(
      seedColor: w.accent,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: w.background,
    extensions: [w],
  );
  return base.copyWith(
    textTheme: base.textTheme
        .apply(bodyColor: w.text, displayColor: w.text)
        .copyWith(
          headlineLarge: TextStyle(
            fontFamily: font,
            fontSize: 34,
            height: 1.15,
            fontWeight: FontWeight.w600,
            letterSpacing: -1.4,
            color: w.text,
          ),
          headlineMedium: TextStyle(
            fontFamily: font,
            fontSize: 26,
            height: 1.2,
            fontWeight: FontWeight.w600,
            letterSpacing: -.8,
            color: w.text,
          ),
          titleLarge: TextStyle(
            fontFamily: font,
            fontSize: 20,
            height: 1.3,
            fontWeight: FontWeight.w600,
            letterSpacing: -.5,
            color: w.text,
          ),
          titleMedium: TextStyle(
            fontFamily: font,
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: w.text,
          ),
        ),
    appBarTheme: AppBarTheme(
      backgroundColor: w.background,
      surfaceTintColor: Colors.transparent,
      foregroundColor: w.text,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: w.accentInk,
        foregroundColor: Colors.white,
        minimumSize: const Size(48, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: w.background,
      indicatorColor: w.surface,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 10,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w600
              : FontWeight.w400,
          color: states.contains(WidgetState.selected) ? w.accentInk : w.muted,
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}

ThemeData get execomTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF10111D),
  fontFamily: 'Inter',
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFFB8B4FF),
    brightness: Brightness.dark,
  ),
);
