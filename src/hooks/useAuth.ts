import React, { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import { UserModel, UserRole } from '@/types';
import { TABLES, STORAGE } from '@/constants';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserModel | null;
  loading: boolean;
  /** UI-effective role. May differ from `profile.role` if the user has switched view. */
  viewMode: UserRole | null;
  /** Override the UI view mode. Persists per user. */
  setViewMode: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resolveRoleForSignup: (email: string) => Promise<UserRole>;
  refreshMyRole: () => Promise<UserRole | null>;
}

const VIEW_MODE_KEY = (userId: string) => `viewMode:${userId}`;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewModeOverride, setViewModeOverride] = useState<UserRole | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Resolve stored profile_photo_url path → signed URL (1 hr) so the
      // app can render <Image> directly without any per-screen plumbing.
      let signedPhotoUrl: string | undefined;
      const path = data.profile_photo_url as string | null | undefined;
      if (path && !path.startsWith('http')) {
        try {
          const { data: urlData } = await supabase.storage
            .from(STORAGE.PROFILE_PHOTOS)
            .createSignedUrl(path, 3600);
          signedPhotoUrl = urlData?.signedUrl ?? undefined;
        } catch {
          // Non-fatal — fall back to initials avatar
        }
      } else if (path) {
        signedPhotoUrl = path;
      }

      setProfile({
        id: data.id,
        schoolId: data.school_id,
        fullName: data.full_name,
        preferredName: data.preferred_name,
        phone: data.phone,
        address: data.address,
        role: data.role,
        status: data.status,
        profilePhotoUrl: signedPhotoUrl,
        fcmToken: data.fcm_token,
        email: authUser?.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  // Re-fetch profile when the app returns to the foreground so that role /
  // status / photo changes performed by an admin while the user was away
  // show up without a manual refresh.
  const lastAppStateRef = useRef('active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (lastAppStateRef.current.match(/inactive|background/) && next === 'active') {
        if (user) fetchProfile(user.id);
      }
      lastAppStateRef.current = next;
    });
    return () => sub.remove();
  }, [user?.id, fetchProfile]);

  // Hydrate persisted view-mode override whenever the user changes.
  useEffect(() => {
    if (!user?.id) {
      setViewModeOverride(null);
      return;
    }
    SecureStore.getItemAsync(VIEW_MODE_KEY(user.id))
      .then((v) => {
        if (v === 'parent' || v === 'teacher' || v === 'admin' || v === 'principal' || v === 'guest') {
          setViewModeOverride(v);
        } else {
          setViewModeOverride(null);
        }
      })
      .catch(() => setViewModeOverride(null));
  }, [user?.id]);

  async function setViewMode(role: UserRole) {
    setViewModeOverride(role);
    if (user?.id) {
      try {
        await SecureStore.setItemAsync(VIEW_MODE_KEY(user.id), role);
      } catch {
        // Non-fatal — override stays in memory for this session.
      }
    }
  }

  async function signOut() {
    if (user?.id) {
      try { await SecureStore.deleteItemAsync(VIEW_MODE_KEY(user.id)); } catch { /* */ }
    }
    setViewModeOverride(null);
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) throw new Error('No ID token returned');
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  async function resolveRoleForSignup(email: string): Promise<UserRole> {
    const { data, error } = await supabase.rpc('resolve_user_role_for_signup', {
      p_email: email,
    });
    if (error) throw error;
    return data as UserRole;
  }

  async function refreshMyRole(): Promise<UserRole | null> {
    const { data, error } = await supabase.rpc('refresh_my_role');
    if (error) throw error;
    await refreshProfile();
    return (data ?? null) as UserRole | null;
  }

  // Effective UI role: override if set, otherwise the actual DB role.
  const viewMode: UserRole | null = viewModeOverride ?? (profile?.role ?? null);

  return React.createElement(AuthContext.Provider, {
    value: {
      session,
      user,
      profile,
      loading,
      viewMode,
      setViewMode,
      signOut,
      signInWithGoogle,
      refreshProfile,
      resolveRoleForSignup,
      refreshMyRole,
    },
  }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
