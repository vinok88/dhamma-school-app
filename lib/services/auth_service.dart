import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

/// Handles authentication: Google Sign-In, Apple Sign-In, sign out, profile management.
class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final _supabase = SupabaseService.instance;

  // TODO: Set GOOGLE_WEB_CLIENT_ID via --dart-define or environment config
  static const String _googleWebClientId =
      String.fromEnvironment('GOOGLE_WEB_CLIENT_ID', defaultValue: '');

  SupabaseClient get _client => _supabase.client;
  User? get currentUser => _client.auth.currentUser;
  String? get currentUserId => _client.auth.currentUser?.id;

  /// Sign in with Google OAuth.
  /// On web: uses OAuth redirect flow.
  /// On mobile: uses native Google Sign-In package.
  Future<AuthResponse?> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        final response = await _client.auth.signInWithOAuth(
          OAuthProvider.google,
          redirectTo: Uri.base.origin,
        );
        // Web OAuth redirect — response will be processed on redirect
        return null;
      }

      // Mobile: use native Google Sign-In
      final googleSignIn = GoogleSignIn(
        clientId: kIsWeb ? null : null, // iOS uses GoogleService-Info.plist
        serverClientId: _googleWebClientId.isNotEmpty ? _googleWebClientId : null,
      );

      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      final accessToken = googleAuth.accessToken;

      if (idToken == null) throw Exception('Google Sign-In: no ID token');

      return await _client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );
    } catch (e) {
      debugPrint('Google Sign-In error: $e');
      rethrow;
    }
  }

  /// Sign in with Apple ID.
  /// Only available on iOS/macOS and web.
  Future<AuthResponse?> signInWithApple() async {
    try {
      if (kIsWeb) {
        await _client.auth.signInWithOAuth(
          OAuthProvider.apple,
          redirectTo: Uri.base.origin,
        );
        return null;
      }

      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final idToken = credential.identityToken;
      if (idToken == null) throw Exception('Apple Sign-In: no identity token');

      return await _client.auth.signInWithIdToken(
        provider: OAuthProvider.apple,
        idToken: idToken,
      );
    } catch (e) {
      debugPrint('Apple Sign-In error: $e');
      rethrow;
    }
  }

  /// Sign out from all sessions.
  Future<void> signOut() async {
    try {
      if (!kIsWeb) {
        // Sign out from Google if signed in with Google
        final googleSignIn = GoogleSignIn();
        await googleSignIn.signOut();
      }
      await _client.auth.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
      rethrow;
    }
  }

  /// Fetches the user_profiles row for [userId].
  /// Returns null if no profile exists (new user).
  Future<Map<String, dynamic>?> getUserProfile([String? userId]) async {
    final uid = userId ?? currentUserId;
    if (uid == null) return null;
    return _supabase.getUserProfile(uid);
  }

  /// Creates or updates a user_profiles row.
  /// Call this after role selection on first login.
  Future<void> upsertUserProfile(Map<String, dynamic> data) async {
    final uid = currentUserId;
    if (uid == null) throw Exception('No authenticated user');
    final payload = {
      'id': uid,
      ...data,
      'updated_at': DateTime.now().toIso8601String(),
    };
    await _supabase.upsertUserProfile(payload);
  }

  /// Convenience: gets the school_id for the default school.
  /// TODO: Support multi-school: let the user select their school on first login.
  Future<String?> getDefaultSchoolId() async {
    final response = await _client
        .from('schools')
        .select('id')
        .order('created_at')
        .limit(1)
        .maybeSingle();
    return response?['id'] as String?;
  }

  /// Stream of auth state changes.
  Stream<AuthState> get onAuthStateChange =>
      _client.auth.onAuthStateChange;
}
