import 'package:flutter/material.dart';

/// Design token colours for Dhamma School App.
/// Derived from Mahamevnawa Buddhist Monastery Melbourne branding.
class AppColors {
  AppColors._();

  static const Color primaryRed = Color(0xFFF34E3A);
  static const Color darkBrown = Color(0xFF614141);
  static const Color creamYellow = Color(0xFFFBF4C2);
  static const Color white = Color(0xFFFFFFFF);
  static const Color darkNavy = Color(0xFF052254);
  static const Color goldAmber = Color(0xFFF7B656);
  static const Color successGreen = Color(0xFF4CAF87);
  static const Color errorRed = Color(0xFFC0392B);
  static const Color pendingAmber = Color(0xFFF39C12);

  // Derived / utility colours
  static const Color scaffoldBackground = creamYellow;
  static const Color cardBackground = white;
  static const Color cardBorder = creamYellow;
  static const Color textPrimary = darkBrown;
  static const Color textOnDark = white;
  static const Color divider = Color(0xFFE0D8A0);
  static const Color inputBorder = Color(0xFFD0C890);
  static const Color shimmerBase = Color(0xFFEEE8C0);
  static const Color shimmerHighlight = Color(0xFFFAF6E0);
}
