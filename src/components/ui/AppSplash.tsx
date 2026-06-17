import React from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants';

const PAGODA = require('../../../assets/images/pagoda.png');

/**
 * Full-screen branded loading screen shown during auth/profile resolution
 * (e.g. the window right after login while the user's role is fetched).
 * Matches the login screen's background so the transition is seamless.
 */
export function AppSplash() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.scaffoldBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={PAGODA}
        style={{ width: 200, height: 200 }}
        resizeMode="contain"
      />
      <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
    </View>
  );
}
