import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Input({ label, error, required, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-sans-semibold text-text-primary mb-1">
          {label}
          {required && <Text className="text-primary"> *</Text>}
        </Text>
      )}
      <TextInput
        className={`bg-white border rounded-xl px-4 py-3 text-base text-text-primary ${
          error ? 'border-error' : 'border-gray-200'
        }`}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
      {error && <Text className="text-error text-xs mt-1">{error}</Text>}
    </View>
  );
}
