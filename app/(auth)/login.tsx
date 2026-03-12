import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, APP_FULL_NAME } from '@/constants';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e: unknown) {
      Alert.alert('Sign-in failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header / Brand */}
        <View className="flex-1 items-center justify-center px-8 pt-16 pb-8">
          {/* Logo placeholder */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text style={{ fontSize: 44 }}>🙏</Text>
          </View>

          <Text
            className="text-white text-center mb-2"
            style={{ fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular' }}
          >
            Dhamma School
          </Text>
          <Text className="text-blue-200 text-center text-sm mb-2">
            {APP_FULL_NAME}
          </Text>
          <Text className="text-blue-300 text-center text-xs mb-16">
            Melbourne, Australia
          </Text>

          {/* Sign-in buttons */}
          <View className="w-full gap-3">
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading}
              className="bg-white rounded-xl py-4 flex-row items-center justify-center"
              activeOpacity={0.8}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.navy} />
              ) : (
                <>
                  <Text style={{ fontSize: 20 }}>G</Text>
                  <Text className="ml-3 text-base font-sans-semibold text-navy">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* TODO: Add Apple Sign-In for iOS — requires Apple Developer account & entitlement */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => Alert.alert('Coming Soon', 'Apple Sign-In coming soon.')}
                className="bg-black rounded-xl py-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20, color: 'white' }}></Text>
                <Text className="ml-3 text-base font-sans-semibold text-white">
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-blue-300 text-xs text-center mt-10 px-4">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
