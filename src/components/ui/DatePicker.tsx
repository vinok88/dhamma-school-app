import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, parseISO, isValid, parse } from 'date-fns';
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

function isoToDisplay(value: string): string {
  const d = parseValue(value);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
}

// Auto-insert slashes as user types: "01" → "01/", "0112" → "01/12/", "01122000" → "01/12/2000"
function formatRawInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
  const [textValue, setTextValue] = useState(() => isoToDisplay(value));
  const [textError, setTextError] = useState('');

  // Sync display text when value changes externally (e.g. from picker)
  React.useEffect(() => {
    setTextValue(isoToDisplay(value));
  }, [value]);

  function handleTextChange(raw: string) {
    const formatted = formatRawInput(raw);
    setTextValue(formatted);
    setTextError('');

    // Only parse when we have a full date (10 chars: DD/MM/YYYY)
    if (formatted.length === 10) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, 'yyyy-MM-dd'));
      }
    }
  }

  function handleBlur() {
    if (!textValue) {
      setTextError('');
      return;
    }
    if (textValue.length < 10) {
      setTextError('Enter a complete date (DD/MM/YYYY)');
      return;
    }
    const parsed = parse(textValue, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) {
      setTextError('Invalid date');
      return;
    }
    if (minimumDate && parsed < minimumDate) {
      setTextError(`Date must be after ${format(minimumDate, 'd MMM yyyy')}`);
      return;
    }
    if (maximumDate && parsed > maximumDate) {
      setTextError(`Date must be before ${format(maximumDate, 'd MMM yyyy')}`);
      return;
    }
    setTextError('');
    onChange(format(parsed, 'yyyy-MM-dd'));
  }

  function handlePickerConfirm(date: Date) {
    setVisible(false);
    if (mode === 'date') {
      const iso = format(date, 'yyyy-MM-dd');
      onChange(iso);
      setTextValue(format(date, 'dd/MM/yyyy'));
    } else {
      onChange(date.toISOString().replace(/\.\d{3}Z$/, ''));
    }
    setTextError('');
  }

  const displayError = error || textError;

  if (mode === 'datetime') {
    // datetime mode keeps the original tap-to-open behaviour
    const displayText = value ? format(parseISO(value), 'd MMM yyyy, h:mm a') : '';
    return (
      <View className="mb-4">
        {label && (
          <Text className="text-sm font-sans-semibold text-text-primary mb-1">
            {label}{required && <Text className="text-primary"> *</Text>}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          className={`bg-white border rounded-xl px-4 py-3 flex-row items-center justify-between ${displayError ? 'border-error' : 'border-gray-200'}`}
        >
          <Text className={`text-base flex-1 ${displayText ? 'text-text-primary' : 'text-text-muted'}`}>
            {displayText || placeholder || 'Select date & time'}
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>🕐</Text>
        </TouchableOpacity>
        {displayError && <Text className="text-error text-xs mt-1">{displayError}</Text>}
        <DateTimePickerModal
          isVisible={visible}
          mode="datetime"
          date={parseValue(value) ?? new Date()}
          onConfirm={handlePickerConfirm}
          onCancel={() => setVisible(false)}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          buttonTextColorIOS={COLORS.primary}
        />
      </View>
    );
  }

  // date mode — manual text input + calendar button
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-sans-semibold text-text-primary mb-1">
          {label}{required && <Text className="text-primary"> *</Text>}
        </Text>
      )}
      <View
        className={`bg-white border rounded-xl flex-row items-center ${displayError ? 'border-error' : 'border-gray-200'}`}
      >
        <TextInput
          className="flex-1 px-4 py-3 text-base text-text-primary"
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder || 'DD/MM/YYYY'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          maxLength={10}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={() => setVisible(true)}
          className="pr-4 pl-2 py-3"
          activeOpacity={0.7}
        >
          <Text style={{ color: COLORS.textMuted, fontSize: 18 }}>📅</Text>
        </TouchableOpacity>
      </View>
      {displayError && <Text className="text-error text-xs mt-1">{displayError}</Text>}

      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        date={parseValue(value) ?? new Date()}
        onConfirm={handlePickerConfirm}
        onCancel={() => setVisible(false)}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        buttonTextColorIOS={COLORS.primary}
      />
    </View>
  );
}
