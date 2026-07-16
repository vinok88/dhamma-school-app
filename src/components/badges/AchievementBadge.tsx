import React from 'react';
import { View, Text, Image } from 'react-native';
import { publicBadgeUrl } from '@/hooks/useBadges';
import { COLORS } from '@/constants';

/** Circular badge image, or a 🏅 placeholder when there's no image. */
export function BadgeAvatar({ imageUrl, size = 48 }: { imageUrl?: string; size?: number }) {
  const url = publicBadgeUrl(imageUrl);
  if (url) {
    return (
      <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>🏅</Text>
    </View>
  );
}
