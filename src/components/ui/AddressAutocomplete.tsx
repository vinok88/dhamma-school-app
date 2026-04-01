import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '@/constants';

interface Suggestion {
  placeId: string;
  text: string;
}

interface AddressAutocompleteProps {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
}

export function AddressAutocomplete({
  label,
  required,
  value,
  onChangeText,
  error,
  placeholder = '15 Test St, Carlton, VIC, 3053',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
          },
          body: JSON.stringify({
            input,
            includedRegionCodes: ['au'],
          }),
        }
      );
      const json = await response.json();
      if (json.suggestions) {
        setSuggestions(
          json.suggestions.map((s: any) => ({
            placeId: s.placePrediction?.placeId ?? '',
            text: s.placePrediction?.text?.text ?? '',
          }))
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      // Network error — silently fail, user can type manually
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChangeText(text: string) {
    onChangeText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(text), 300);
  }

  function handleSelect(suggestion: Suggestion) {
    onChangeText(suggestion.text);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <View style={{ marginBottom: 16, zIndex: 10 }}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View>
        <TextInput
          style={[styles.input, error ? styles.inputError : styles.inputNormal]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.spinner}
          />
        )}
      </View>
      {showSuggestions && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          style={styles.listView}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.description}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: 'WorkSans_600SemiBold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  required: {
    color: COLORS.primary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'WorkSans_400Regular',
    color: '#1C1C1E',
    borderWidth: 1,
    height: 48,
  },
  inputNormal: {
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  spinner: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  listView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  description: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'WorkSans_400Regular',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
