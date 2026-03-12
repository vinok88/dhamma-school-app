import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/supabase_service.dart';

/// Streams Supabase auth state changes.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return AuthService.instance.onAuthStateChange;
});

/// Provides the current authenticated user (nullable).
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.valueOrNull?.session?.user;
});

/// Fetches and caches the current user's profile from user_profiles table.
final userProfileProvider = FutureProvider<UserModel?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final data = await AuthService.instance.getUserProfile(user.id);
  if (data == null) return null;

  // Inject the email from auth.user since it's not stored in user_profiles
  final enriched = {...data, 'email': user.email};
  return UserModel.fromJson(enriched);
});

/// Derived provider: current user's role.
final currentRoleProvider = Provider<UserRole?>((ref) {
  return ref.watch(userProfileProvider).valueOrNull?.role;
});

/// Derived provider: current user's school_id.
final currentSchoolIdProvider = Provider<String?>((ref) {
  return ref.watch(userProfileProvider).valueOrNull?.schoolId;
});

/// Notifier for auth actions (sign in, sign out, profile update).
class AuthNotifier extends AsyncNotifier<UserModel?> {
  @override
  Future<UserModel?> build() async {
    final user = SupabaseService.instance.currentUser;
    if (user == null) return null;

    final data = await AuthService.instance.getUserProfile(user.id);
    if (data == null) return null;

    return UserModel.fromJson({...data, 'email': user.email});
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    try {
      await AuthService.instance.signOut();
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    final current = state.valueOrNull;
    if (current == null) return;

    state = const AsyncValue.loading();
    try {
      await AuthService.instance.upsertUserProfile(updates);
      final data = await AuthService.instance.getUserProfile();
      if (data != null) {
        state = AsyncValue.data(
          UserModel.fromJson({
            ...data,
            'email': SupabaseService.instance.currentUser?.email,
          }),
        );
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, UserModel?>(() => AuthNotifier());
