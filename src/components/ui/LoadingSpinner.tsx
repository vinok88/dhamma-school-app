import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { COLORS } from '@/constants';

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ label, fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-scaffold-bg">
        <ActivityIndicator size="large" color={COLORS.primary} />
        {label && <Text className="mt-3 text-text-muted text-sm">{label}</Text>}
      </View>
    );
  }
  return (
    <View className="py-8 items-center">
      <ActivityIndicator size="small" color={COLORS.primary} />
      {label && <Text className="mt-2 text-text-muted text-sm">{label}</Text>}
    </View>
  );
}
