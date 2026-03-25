import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, APP_FULL_NAME } from '@/constants';

// TODO: Place the Buddhist pagoda/temple watercolour illustration at assets/images/pagoda.png
const PAGODA_IMAGE = require('../../assets/images/pagoda.png');

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FAF6F0' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Temple illustration */}
        <View style={{ width: '100%', height: 280, backgroundColor: '#FAF6F0', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={PAGODA_IMAGE}
            style={{ width: '100%', height: 280 }}
            resizeMode="contain"
          />
        </View>

        {/* Content */}
        <View className="flex-1 px-8 pt-8 pb-8">
          <Text
            className="text-center mb-2"
            style={{ fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}
          >
            Welcome back 🙏
          </Text>
          <Text style={{ color: '#8B7D6B', textAlign: 'center', fontSize: 14, marginBottom: 4 }}>
            Sign in to manage your child's
          </Text>
          <Text style={{ color: '#8B7D6B', textAlign: 'center', fontSize: 14, marginBottom: 32 }}>
            Dhamma School journey
          </Text>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px" style={{ backgroundColor: '#EDE8E0' }} />
            <Text className="mx-3 text-xs tracking-widest uppercase" style={{ color: '#8B7D6B' }}>
              Sign in with
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: '#EDE8E0' }} />
          </View>

          {/* Sign-in buttons */}
          <View className="w-full gap-3">
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading}
              className="bg-white rounded-xl py-4 flex-row items-center justify-center"
              style={{ borderWidth: 1, borderColor: '#EDE8E0', opacity: loading ? 0.6 : 1 }}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Text style={{ fontSize: 20 }}>G</Text>
                  <Text className="ml-3 text-base font-sans-semibold" style={{ color: '#1C1C1E' }}>
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

          <Text className="text-xs text-center mt-10 px-4" style={{ color: COLORS.primary }}>
            By signing in you agree to our{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>
            {' & '}
            <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
