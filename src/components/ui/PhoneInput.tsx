import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { COLORS } from '@/constants';

interface PhoneInputProps {
  label?: string;
  required?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  error?: string;
  placeholder?: string;
  countryCode?: string;
}

/**
 * Phone input with a fixed-width country code prefix.
 *
 * The prefix box uses `flexShrink: 0` and an explicit minWidth so it never
 * gets squeezed off-screen on narrow devices (small Androids, foldables, etc).
 */
export function PhoneInput({
  label = 'Phone Number',
  required,
  value,
  onChangeText,
  error,
  placeholder = '4XX XXX XXX',
  countryCode = '+61',
}: PhoneInputProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-sm font-sans-semibold text-text-primary mb-1">
          {label}
          {required ? <Text className="text-primary"> *</Text> : null}
        </Text>
      ) : null}
      <View
        className="flex-row items-stretch bg-white border rounded-xl"
        style={{ borderColor: error ? COLORS.error : '#E5E7EB' }}
      >
        <View
          className="bg-gray-100 px-3 justify-center rounded-l-xl border-r border-gray-200"
          style={{ flexShrink: 0, minWidth: 56 }}
        >
          <Text
            className="text-base text-text-primary"
            numberOfLines={1}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {countryCode}
          </Text>
        </View>
        <TextInput
          className="flex-1 px-3 py-3 text-base text-text-primary"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
        />
      </View>
      {error ? <Text className="text-error text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
