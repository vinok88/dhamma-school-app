import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
import { destinationFromPushData, NotificationData } from '@/lib/notification-routes';

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
  const { session, profile, loading, viewMode } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Clear the launcher app-icon badge on every foreground.
  // Push notifications increment it via setNotificationHandler; nothing else
  // clears it, so without this the badge accumulates and stays "stuck".
  useEffect(() => {
    Notifications.setBadgeCountAsync(0).catch(() => {});
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') Notifications.setBadgeCountAsync(0).catch(() => {});
    });
    return () => sub.remove();
  }, []);


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

  // Handle OS push-notification taps (foreground, background, and cold start).
  // The cold-start case stores the data and replays it once the profile is loaded.
  const pendingNavRef = useRef<NotificationData | null>(null);

  useEffect(() => {
    let mounted = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) return;
      const data = response.notification.request.content.data as NotificationData;
      pendingNavRef.current = data;
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      const dest = destinationFromPushData(data, profile?.role);
      if (dest) router.push(dest as any);
      else pendingNavRef.current = data;
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [profile?.role]);

  // Replay any pending notification once profile finishes loading
  useEffect(() => {
    if (!profile || !pendingNavRef.current) return;
    const dest = destinationFromPushData(pendingNavRef.current, profile.role);
    pendingNavRef.current = null;
    if (dest) {
      // Defer one tick so the role-based redirect below settles first
      setTimeout(() => router.push(dest as any), 0);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (!profile) {
      router.replace('/(auth)/complete-profile');
    } else {
      // Route by the effective view-mode (may be overridden via Switch Profile),
      // not the DB role. RLS still uses profile.role.
      const role = viewMode ?? profile.role;
      const expectedSegment =
        role === 'parent' ? '(parent)'
        : role === 'teacher' ? '(teacher)'
        : role === 'guest' ? '(guest)'
        : '(admin)';
      const inCorrectRoute = segments[0] === expectedSegment;

      if (!inCorrectRoute) {
        if (role === 'parent') router.replace('/(parent)');
        else if (role === 'teacher') router.replace('/(teacher)');
        else if (role === 'guest') router.replace('/(guest)');
        else router.replace('/(admin)'); // admin + principal
      }
    }
  }, [session, profile, loading, viewMode]);

  if (loading) return <LoadingSpinner fullScreen label="Loading…" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(guest)" />
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
