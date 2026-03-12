import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text className="mt-4 text-lg font-sans-semibold text-text-primary text-center">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-sm text-text-muted text-center">{subtitle}</Text>
      )}
    </View>
  );
}
