import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { COLORS } from '@/constants';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary', text: 'text-white' },
  secondary: { container: 'bg-navy', text: 'text-white' },
  danger: { container: 'bg-error', text: 'text-white' },
  ghost: { container: 'bg-transparent', text: 'text-primary' },
  outline: { container: 'bg-transparent border border-primary', text: 'text-primary' },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5 rounded-lg', text: 'text-sm' },
  md: { container: 'px-5 py-3 rounded-xl', text: 'text-base' },
  lg: { container: 'px-6 py-4 rounded-xl', text: 'text-lg' },
};

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const { container, text } = variantStyles[variant];
  const { container: sizeC, text: sizeT } = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${container} ${sizeC} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' || variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-sans-semibold ${text} ${sizeT}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
