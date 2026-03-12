import React from 'react';
import { View, Text, Image } from 'react-native';
import { COLORS } from '@/constants';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fontSize = Math.floor(size * 0.38);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.navy,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: COLORS.white, fontSize, fontWeight: '600' }}>{initials}</Text>
    </View>
  );
}
