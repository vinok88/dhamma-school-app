import React, { useState } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants';

export default function GuestWelcomeScreen() {
  const { profile, signOut, refreshMyRole } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const newRole = await refreshMyRole();
      if (newRole && newRole !== 'guest') {
        // RootLayoutNav will redirect automatically once the profile refreshes
      } else {
        Alert.alert(
          'No access yet',
          'Your email is not linked to any children or staff account yet. Please contact the school.'
        );
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not refresh');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FAF6F0' }}>
      <View className="flex-1 px-5 pt-8 items-center">
        <Image
          source={require('../../assets/images/pagoda.png')}
          style={{ width: '100%', height: 220 }}
          resizeMode="contain"
        />
        <Text
          className="text-center mt-4 mb-2"
          style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}
        >
          Welcome{profile?.preferredName ? `, ${profile.preferredName}` : ''}
        </Text>
        <Text className="text-center text-sm mb-6" style={{ color: COLORS.textMuted }}>
          This app is for enrolled families and staff of the Mahamevnawa Dhamma School.
        </Text>

        <View className="bg-white rounded-2xl p-5 w-full mb-4">
          <Text className="font-sans-semibold mb-2" style={{ color: '#1C1C1E' }}>
            Your account is not yet linked
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            If your child is enrolled here, please ask the school to add your email
            ({profile?.email ?? 'your email'}) to their record.
            Once linked, tap Refresh below to gain access.
          </Text>
        </View>

        <Button
          label={refreshing ? 'Checking…' : 'Refresh'}
          onPress={handleRefresh}
          loading={refreshing}
          fullWidth
        />

        <View className="mt-3 w-full">
          <Button label="Sign Out" variant="outline" onPress={signOut} fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}
