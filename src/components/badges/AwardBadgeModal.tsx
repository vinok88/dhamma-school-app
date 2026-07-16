import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useAwardBadge } from '@/hooks/useBadges';
import { BadgeAvatar } from './AchievementBadge';
import { DatePicker } from '@/components/ui/DatePicker';
import { COLORS } from '@/constants';
import { showFriendlyError } from '@/utils/errors';
import { BadgeModel, StudentModel } from '@/types';

/** Teacher/principal awards a badge to a student, optionally time-bound. */
export function AwardBadgeModal({ visible, student, badges, onClose }: {
  visible: boolean;
  student: StudentModel | null;
  badges: BadgeModel[];
  onClose: () => void;
}) {
  const award = useAwardBadge();
  const [badgeId, setBadgeId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) { setBadgeId(''); setExpiry(''); setNote(''); }
  }, [visible, student?.id]);

  async function submit() {
    if (!student) return;
    if (!badgeId) { Alert.alert('Pick a badge', 'Select a badge to award.'); return; }
    try {
      await award.mutateAsync({
        studentId: student.id,
        badgeId,
        expiresAt: expiry ? `${expiry}T23:59:59` : null,
        note: note.trim() || null,
      });
      Alert.alert('Awarded 🏅', 'The badge has been given and the parents notified.');
      onClose();
    } catch (e: unknown) {
      showFriendlyError("Couldn't award badge", e, 'award-badge');
    }
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
          <View className="w-10 h-1 rounded-full bg-gray-300 self-center my-3" />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 18, fontFamily: 'DMSerifDisplay_400Regular', color: COLORS.textPrimary }} className="mb-1">
              Award a Badge
            </Text>
            <Text className="text-xs text-text-muted mb-4">
              To {student?.firstName} {student?.lastName}
            </Text>

            {!badges.length ? (
              <Text className="text-sm text-text-muted mb-4">No badges available yet — create one first.</Text>
            ) : (
              <View className="mb-4">
                {badges.map((b) => {
                  const active = badgeId === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setBadgeId(b.id)}
                      className={`flex-row items-center p-2 rounded-xl mb-2 border ${active ? 'border-primary bg-red-50' : 'border-gray-200'}`}
                    >
                      <BadgeAvatar imageUrl={b.imageUrl} size={40} />
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-sans-semibold text-text-primary">{b.name}</Text>
                        <Text className="text-xs text-text-muted">{b.classId ? (b.className ?? 'Class') : 'School-wide'}</Text>
                      </View>
                      {active ? <Text style={{ color: COLORS.primary }}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <DatePicker
              label="Expiry date (optional)"
              value={expiry}
              onChange={setExpiry}
              mode="date"
              placeholder="DD/MM/YYYY — blank = permanent"
              minimumDate={new Date()}
            />

            <Text className="text-sm font-sans-semibold text-text-primary mb-1">Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Great effort in class"
              className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-text-primary mb-4"
              multiline
            />
          </ScrollView>
          <View className="px-5 py-3 border-t border-gray-100 flex-row gap-2">
            <TouchableOpacity onPress={onClose} className="flex-1 bg-gray-100 rounded-xl py-3 items-center">
              <Text className="text-sm font-sans-semibold text-text-muted">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={award.isPending || !badgeId}
              className="flex-1 rounded-xl py-3 items-center"
              style={{ backgroundColor: COLORS.primary, opacity: award.isPending || !badgeId ? 0.5 : 1 }}
            >
              <Text className="text-sm font-sans-semibold text-white">
                {award.isPending ? 'Awarding…' : 'Award Badge'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
