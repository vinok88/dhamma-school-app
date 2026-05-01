import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ClassModel } from '@/types';
import { COLORS } from '@/constants';

interface ClassPickerProps {
  classes: ClassModel[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * Dropdown picker for choosing among the teacher's assigned classes.
 * Renders nothing when the teacher has zero or one class.
 */
export function ClassPicker({ classes, selectedId, onSelect }: ClassPickerProps) {
  const [open, setOpen] = useState(false);

  if (classes.length <= 1) return null;

  const active = classes.find((c) => c.id === selectedId) ?? classes[0];

  return (
    <View className="bg-white border-b border-gray-100 px-4 py-3">
      <Text className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>
        Class
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        className="flex-row items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
      >
        <Text className="text-sm font-sans-semibold text-text-primary" numberOfLines={1}>
          {active.name}
          {active.gradeLevel ? `  ·  ${active.gradeLevel}` : ''}
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}
        >
          <Pressable className="bg-white rounded-2xl overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-sm font-sans-semibold text-text-primary">Choose a class</Text>
            </View>
            {classes.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    onSelect(c.id);
                    setOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3 ${isActive ? 'bg-red-50' : ''}`}
                  activeOpacity={0.6}
                >
                  <View className="flex-1 mr-2">
                    <Text
                      className={`text-sm ${isActive ? 'font-sans-semibold' : ''}`}
                      style={{ color: isActive ? COLORS.primary : '#1C1C1E' }}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    {c.gradeLevel ? (
                      <Text className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                        {c.gradeLevel}
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? <Text style={{ color: COLORS.primary }}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
