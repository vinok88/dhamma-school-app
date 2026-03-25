import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  dark?: boolean;
}

export function ScreenHeader({ title, subtitle, showBack = false, right, dark = false }: ScreenHeaderProps) {
  const router = useRouter();
  const bg = dark ? 'bg-navy' : 'bg-scaffold-bg';
  const textColor = dark ? 'text-white' : 'text-text-primary';
  const subtitleColor = dark ? 'text-blue-200' : 'text-text-muted';

  return (
    <View className={`${bg} px-4 pt-2 pb-4 flex-row items-center`}
      style={dark ? {} : { borderBottomWidth: 1, borderBottomColor: COLORS.divider }}
    >
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Text className={`text-2xl ${dark ? 'text-white' : 'text-navy'}`}>←</Text>
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className={`text-xl font-sans-semibold ${textColor}`}>{title}</Text>
        {subtitle && <Text className={`text-sm ${subtitleColor}`}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}
