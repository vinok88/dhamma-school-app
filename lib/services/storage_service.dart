import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../core/constants/app_constants.dart';
import 'supabase_service.dart';

/// Handles Supabase Storage operations for photos and other files.
class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final _supabase = SupabaseService.instance;
  final _uuid = const Uuid();

  SupabaseStorageClient get _storage => _supabase.client.storage;

  /// Upload a student photo to the private 'student-photos' bucket.
  /// Returns the storage path (not a URL — use [getSignedUrl] to get a URL).
  ///
  /// [file] — the image file to upload
  /// [studentId] — used to organise files in the bucket
  Future<String> uploadStudentPhoto(File file, String studentId) async {
    final ext = file.path.split('.').last.toLowerCase();
    final fileName = '${studentId}_${_uuid.v4()}.$ext';
    final path = 'students/$fileName';

    await _storage
        .from(AppConstants.bucketStudentPhotos)
        .upload(
          path,
          file,
          fileOptions: const FileOptions(
            cacheControl: '3600',
            upsert: true,
          ),
        );

    return path;
  }

  /// Upload a student photo from bytes (for web).
  Future<String> uploadStudentPhotoBytes(
    Uint8List bytes,
    String studentId,
    String mimeType,
  ) async {
    final ext = mimeType.split('/').last;
    final fileName = '${studentId}_${_uuid.v4()}.$ext';
    final path = 'students/$fileName';

    await _storage
        .from(AppConstants.bucketStudentPhotos)
        .uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType,
          ),
        );

    return path;
  }

  /// Upload a profile photo to the 'profile-photos' bucket.
  Future<String> uploadProfilePhoto(File file, String userId) async {
    final ext = file.path.split('.').last.toLowerCase();
    final fileName = '${userId}_${_uuid.v4()}.$ext';
    final path = 'profiles/$fileName';

    await _storage
        .from(AppConstants.bucketProfilePhotos)
        .upload(
          path,
          file,
          fileOptions: const FileOptions(
            cacheControl: '3600',
            upsert: true,
          ),
        );

    return path;
  }

  /// Upload profile photo from bytes (web).
  Future<String> uploadProfilePhotoBytes(
    Uint8List bytes,
    String userId,
    String mimeType,
  ) async {
    final ext = mimeType.split('/').last;
    final fileName = '${userId}_${_uuid.v4()}.$ext';
    final path = 'profiles/$fileName';

    await _storage
        .from(AppConstants.bucketProfilePhotos)
        .uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType,
          ),
        );

    return path;
  }

  /// Get a signed URL for a private file.
  /// [bucketName] — the storage bucket
  /// [path] — the file path within the bucket
  /// [expiresIn] — seconds until URL expires (default: 1 hour)
  Future<String?> getSignedUrl(
    String bucketName,
    String path, {
    int expiresIn = AppConstants.signedUrlExpiry,
  }) async {
    try {
      final url = await _storage
          .from(bucketName)
          .createSignedUrl(path, expiresIn);
      return url;
    } catch (e) {
      debugPrint('StorageService.getSignedUrl error: $e');
      return null;
    }
  }

  /// Convenience: get signed URL for a student photo.
  Future<String?> getStudentPhotoUrl(String path) =>
      getSignedUrl(AppConstants.bucketStudentPhotos, path);

  /// Convenience: get signed URL for a profile photo.
  Future<String?> getProfilePhotoUrl(String path) =>
      getSignedUrl(AppConstants.bucketProfilePhotos, path);

  /// Delete a file from a bucket.
  Future<void> deleteFile(String bucketName, String path) async {
    try {
      await _storage.from(bucketName).remove([path]);
    } catch (e) {
      debugPrint('StorageService.deleteFile error: $e');
    }
  }
}
