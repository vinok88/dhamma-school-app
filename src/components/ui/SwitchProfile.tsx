import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useMyStudents } from '@/hooks/useStudents';
import {
  availableViewModes,
  VIEW_MODE_LABEL,
  VIEW_MODE_ICON,
} from '@/lib/view-mode';
import { COLORS } from '@/constants';
import { UserRole } from '@/types';

/**
 * Tile that opens a modal letting the current user switch their UI view.
 * Renders nothing for users whose actual role only has one available view
 * (parents, guests, and teachers without any linked children).
 */
export function SwitchProfile() {
  const { profile, viewMode, setViewMode } = useAuth();
  const [open, setOpen] = useState(false);

  // Only check student linkage for teachers — admins/principals always get
  // full switch options regardless.
  const { data: linkedChildren } = useMyStudents(
    profile?.role === 'teacher' ? profile.id : ''
  );
  const hasLinkedChildren = (linkedChildren?.length ?? 0) > 0;

  const options = availableViewModes(profile?.role, hasLinkedChildren);
  if (options.length <= 1) return null;

  const current = (viewMode ?? profile?.role) as UserRole | undefined;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
        style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
        activeOpacity={0.7}
      >
        <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: COLORS.cream }}>
          <Text style={{ fontSize: 22 }}>🔄</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-sans-semibold text-text-primary">Switch Profile</Text>
          <Text className="text-xs" style={{ color: COLORS.textMuted }}>
            Currently viewing as {current ? VIEW_MODE_LABEL[current] : '—'}
          </Text>
        </View>
        <Text className="text-text-muted text-lg">›</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}
        >
          <Pressable className="bg-white rounded-2xl overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-sm font-sans-semibold text-text-primary">Switch profile view</Text>
              <Text className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                Your account remains a {VIEW_MODE_LABEL[profile?.role ?? 'guest']}.
              </Text>
            </View>
            {options.map((role) => {
              const isActive = current === role;
              return (
                <TouchableOpacity
                  key={role}
                  onPress={async () => {
                    setOpen(false);
                    if (role !== current) await setViewMode(role);
                  }}
                  className={`flex-row items-center px-4 py-3 ${isActive ? 'bg-red-50' : ''}`}
                  activeOpacity={0.6}
                >
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{VIEW_MODE_ICON[role]}</Text>
                  <View className="flex-1">
                    <Text
                      className={`text-sm ${isActive ? 'font-sans-semibold' : ''}`}
                      style={{ color: isActive ? COLORS.primary : '#1C1C1E' }}
                    >
                      {VIEW_MODE_LABEL[role]} view
                    </Text>
                    {role === profile?.role ? (
                      <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                        Your account
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
