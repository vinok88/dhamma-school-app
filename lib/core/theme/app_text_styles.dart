import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography constants using Google Fonts.
/// DM Serif Display — headings/display
/// Work Sans — body text
/// Arima Madurai — nav labels, buttons
class AppTextStyles {
  AppTextStyles._();

  // Display / Screen Titles
  static TextStyle get displayLarge => GoogleFonts.dmSerifDisplay(
        fontSize: 28,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.2,
      );

  static TextStyle get displayLargeOnDark => displayLarge.copyWith(
        color: AppColors.white,
      );

  static TextStyle get headlineMedium => GoogleFonts.dmSerifDisplay(
        fontSize: 22,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.3,
      );

  static TextStyle get headlineMediumOnDark => headlineMedium.copyWith(
        color: AppColors.white,
      );

  static TextStyle get headlineSmall => GoogleFonts.dmSerifDisplay(
        fontSize: 18,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
      );

  // Body Text
  static TextStyle get bodyLarge => GoogleFonts.workSans(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.5,
      );

  static TextStyle get bodyMedium => GoogleFonts.workSans(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: AppColors.textPrimary,
        height: 1.5,
      );

  static TextStyle get bodySmall => GoogleFonts.workSans(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.darkBrown.withAlpha(180),
        height: 1.4,
      );

  static TextStyle get bodyLargeOnDark => bodyLarge.copyWith(
        color: AppColors.white,
      );

  static TextStyle get bodyMediumOnDark => bodyMedium.copyWith(
        color: AppColors.white,
      );

  // Labels / Buttons / Navigation
  static TextStyle get labelLarge => const TextStyle(
        fontFamily: 'ArImaMadurai',
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
        letterSpacing: 0.3,
      );

  static TextStyle get labelLargeOnDark => labelLarge.copyWith(
        color: AppColors.white,
      );

  static TextStyle get labelMedium => const TextStyle(
        fontFamily: 'ArImaMadurai',
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
      );

  static TextStyle get buttonText => const TextStyle(
        fontFamily: 'ArImaMadurai',
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      );

  // Caption / Metadata
  static TextStyle get caption => GoogleFonts.workSans(
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: AppColors.darkBrown.withAlpha(150),
      );

  // Status badge text
  static TextStyle get badge => GoogleFonts.workSans(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: AppColors.white,
        letterSpacing: 0.3,
      );
}
