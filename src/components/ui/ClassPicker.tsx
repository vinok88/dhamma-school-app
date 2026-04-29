import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ClassModel } from '@/types';
import { COLORS } from '@/constants';

interface ClassPickerProps {
  classes: ClassModel[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * Horizontal-scroll chip row for picking among the teacher's assigned classes.
 * Renders nothing when the teacher has zero or one class.
 */
export function ClassPicker({ classes, selectedId, onSelect }: ClassPickerProps) {
  if (classes.length <= 1) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-white border-b border-gray-100"
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
    >
      {classes.map((c) => {
        const active = c.id === selectedId;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelect(c.id)}
            className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-text-muted'}`}
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export { COLORS as _ };
