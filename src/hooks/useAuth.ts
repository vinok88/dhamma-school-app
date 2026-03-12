import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserModel } from '@/types';
import { TABLES } from '@/constants';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        id: data.id,
        schoolId: data.school_id,
        fullName: data.full_name,
        preferredName: data.preferred_name,
        phone: data.phone,
        address: data.address,
        role: data.role,
        status: data.status,
        profilePhotoUrl: data.profile_photo_url,
        fcmToken: data.fcm_token,
        email: user?.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
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

  return { session, user, profile, loading, signOut, signInWithGoogle };
}
