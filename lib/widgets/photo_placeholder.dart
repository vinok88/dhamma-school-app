import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Styled placeholder used when no real photo is available.
/// Shows a person icon on a creamYellow background with a darkBrown icon.
/// Size is configurable via constructor.
class PhotoPlaceholderWidget extends StatelessWidget {
  final double size;
  final double? iconSize;
  final Color? backgroundColor;
  final Color? iconColor;
  final BorderRadius? borderRadius;
  final bool isCircle;

  const PhotoPlaceholderWidget({
    super.key,
    this.size = 60.0,
    this.iconSize,
    this.backgroundColor,
    this.iconColor,
    this.borderRadius,
    this.isCircle = false,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? AppColors.creamYellow;
    final fgColor = iconColor ?? AppColors.darkBrown;
    final iconSz = iconSize ?? size * 0.55;
    final radius = borderRadius ?? BorderRadius.circular(size * 0.15);

    final child = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: isCircle ? null : radius,
        shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
        border: Border.all(
          color: AppColors.darkBrown.withAlpha(40),
          width: 1,
        ),
      ),
      child: Icon(
        Icons.person,
        size: iconSz,
        color: fgColor,
      ),
    );

    return child;
  }

  /// Circle variant — convenience constructor for profile photos
  const PhotoPlaceholderWidget.circle({
    super.key,
    this.size = 60.0,
    this.iconSize,
    this.backgroundColor,
    this.iconColor,
  })  : borderRadius = null,
        isCircle = true;
}

/// Wraps a cached network image with a photo placeholder fallback.
/// Use this anywhere a student or profile photo is shown.
class NetworkPhotoWidget extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final bool isCircle;
  final double? iconSize;

  const NetworkPhotoWidget({
    super.key,
    required this.imageUrl,
    this.size = 60.0,
    this.isCircle = false,
    this.iconSize,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return PhotoPlaceholderWidget(
        size: size,
        isCircle: isCircle,
        iconSize: iconSize,
      );
    }

    // TODO: Replace with CachedNetworkImage for production to enable disk caching
    return ClipRRect(
      borderRadius: isCircle
          ? BorderRadius.circular(size / 2)
          : BorderRadius.circular(size * 0.15),
      child: Image.network(
        imageUrl!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => PhotoPlaceholderWidget(
          size: size,
          isCircle: isCircle,
          iconSize: iconSize,
        ),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: AppColors.creamYellow,
              shape:
                  isCircle ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: isCircle
                  ? null
                  : BorderRadius.circular(size * 0.15),
            ),
            child: const Center(
              child: CircularProgressIndicator(
                color: AppColors.primaryRed,
                strokeWidth: 2,
              ),
            ),
          );
        },
      ),
    );
  }
}
