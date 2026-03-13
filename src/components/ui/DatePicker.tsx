import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, parseISO, isValid } from 'date-fns';
import { COLORS } from '@/constants';

type Mode = 'date' | 'datetime';

interface DatePickerProps {
  label?: string;
  required?: boolean;
  value: string; // ISO string — date "yyyy-MM-dd" or datetime "yyyy-MM-dd'T'HH:mm:ss"
  onChange: (iso: string) => void;
  error?: string;
  mode?: Mode;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

function formatDisplay(value: string, mode: Mode): string {
  const d = parseValue(value);
  if (!d) return '';
  return mode === 'date' ? format(d, 'd MMM yyyy') : format(d, 'd MMM yyyy, h:mm a');
}

export function DatePicker({
  label,
  required,
  value,
  onChange,
  error,
  mode = 'date',
  placeholder,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);

  const displayText = formatDisplay(value, mode);
  const defaultPlaceholder = mode === 'date' ? 'Select date' : 'Select date & time';

  function handleConfirm(date: Date) {
    setVisible(false);
    if (mode === 'date') {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      // ISO string without milliseconds
      onChange(date.toISOString().replace(/\.\d{3}Z$/, ''));
    }
  }

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-sans-semibold text-text-primary mb-1">
          {label}
          {required && <Text className="text-primary"> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        className={`bg-white border rounded-xl px-4 py-3 flex-row items-center justify-between ${
          error ? 'border-error' : 'border-gray-200'
        }`}
      >
        <Text
          className={`text-base flex-1 ${displayText ? 'text-text-primary' : 'text-text-muted'}`}
        >
          {displayText || placeholder || defaultPlaceholder}
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>
          {mode === 'date' ? '📅' : '🕐'}
        </Text>
      </TouchableOpacity>

      {error && <Text className="text-error text-xs mt-1">{error}</Text>}

      <DateTimePickerModal
        isVisible={visible}
        mode={mode === 'date' ? 'date' : 'datetime'}
        date={parseValue(value) ?? new Date()}
        onConfirm={handleConfirm}
        onCancel={() => setVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        buttonTextColorIOS={COLORS.primary}
      />
    </View>
  );
}
