import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold } from '@expo-google-fonts/work-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

import '../src/styles/globals.css';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();


  // Fix 7: Register FCM push token on login
  useEffect(() => {
    if (!session || !profile) return;

    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        const tokenData = await Notifications.getDevicePushTokenAsync();
        const fcmToken = tokenData.data;
        if (!fcmToken) return;

        // Only update if token has changed
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('fcm_token')
          .eq('id', profile.id)
          .single();

        if (existing?.fcm_token !== fcmToken) {
          await supabase
            .from('user_profiles')
            .update({ fcm_token: fcmToken })
            .eq('id', profile.id);
        }
      } catch {
        // Non-fatal — notifications are optional
      }
    })();
  }, [session, profile?.id]);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!profile) {
      router.replace('/(auth)/role-select');
    } else {
      const role = profile.role;
      const expectedSegment = role === 'parent' ? '(parent)' : role === 'teacher' ? '(teacher)' : '(admin)';
      const inCorrectRoute = segments[0] === expectedSegment;

      if (!inCorrectRoute) {
        if (role === 'parent') router.replace('/(parent)');
        else if (role === 'teacher') router.replace('/(teacher)');
        else if (role === 'admin') router.replace('/(admin)');
      }
    }
  }, [session, profile, loading]);

  if (loading) return <LoadingSpinner fullScreen label="Loading…" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="messages/[recipientId]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
