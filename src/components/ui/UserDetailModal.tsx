import React from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { COLORS } from '@/constants';
import { UserModel, StudentModel } from '@/types';
import { formatDate, formatAge } from '@/utils/date';

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  user?: UserModel | null;
  student?: StudentModel | null;
  /** Signed photo URL for student (since student.photoUrl needs signing) */
  studentPhotoUrl?: string | null;
}

const ROLE_STYLES: Record<string, { color: string; bg: string }> = {
  admin: { color: COLORS.error, bg: '#FEE2E2' },
  principal: { color: COLORS.gold, bg: '#FEF3C7' },
  teacher: { color: COLORS.navy, bg: '#DBEAFE' },
  parent: { color: COLORS.primary, bg: '#FEE2E2' },
};

function DetailRow({ label, value, onPress }: { label: string; value?: string | null; onPress?: () => void }) {
  if (!value) return null;
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      className="flex-row py-3 border-b border-gray-100"
    >
      <Text className="text-xs text-text-muted w-24">{label}</Text>
      <Text
        className="flex-1 text-sm text-text-primary"
        style={onPress ? { color: COLORS.navy, textDecorationLine: 'underline' } : {}}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export function UserDetailModal({ visible, onClose, user, student, studentPhotoUrl }: UserDetailModalProps) {
  if (!user && !student) return null;

  const isStudent = !!student;
  const name = isStudent ? `${student!.firstName} ${student!.lastName}` : user!.fullName;
  const photoUri = isStudent ? (studentPhotoUrl ?? undefined) : user!.profilePhotoUrl;
  const role = isStudent ? undefined : user!.role;
  const rc = role ? (ROLE_STYLES[role] ?? ROLE_STYLES.parent) : undefined;

  function dialPhone(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View className="bg-white rounded-t-3xl px-5 pt-6 pb-10" style={{ maxHeight: '80%' }}>
            {/* Handle bar */}
            <View className="w-10 h-1 rounded-full bg-gray-300 self-center mb-4" />

            {/* Header */}
            <View className="items-center mb-4">
              <Avatar uri={photoUri} name={name} size={80} />
              <Text className="text-lg font-sans-semibold text-text-primary mt-3">{name}</Text>
              {rc && role && (
                <View className="mt-1">
                  <Badge label={role} color={rc.color} bg={rc.bg} />
                </View>
              )}
              {isStudent && (
                <View className="mt-1">
                  <Badge label="" type="student" status={student!.status} />
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* User details */}
              {!isStudent && user && (
                <>
                  <DetailRow label="Email" value={user.email} />
                  <DetailRow
                    label="Phone"
                    value={user.phone}
                    onPress={user.phone ? () => dialPhone(user.phone!) : undefined}
                  />
                  <DetailRow label="Address" value={user.address} />
                  <DetailRow label="Status" value={user.status} />
                </>
              )}

              {/* Student details */}
              {isStudent && student && (
                <>
                  {student.preferredName && (
                    <DetailRow label="Nickname" value={student.preferredName} />
                  )}
                  <DetailRow label="Date of Birth" value={`${formatDate(student.dob)} (${formatAge(student.dob)})`} />
                  <DetailRow label="Gender" value={student.gender} />
                  <DetailRow label="Class" value={student.className ?? 'Unassigned'} />
                  <DetailRow label="Status" value={student.status} />

                  {/* Allergy details */}
                  <DetailRow
                    label="Allergies"
                    value={student.hasAllergies ? (student.allergyNotes ?? 'Yes (no details)') : 'None'}
                  />

                  {/* Photo consent */}
                  <DetailRow
                    label="Photo Consent"
                    value={student.photoPublishConsent ? 'Approved' : 'Not approved'}
                  />

                  {/* Parent info */}
                  <View className="mt-3 mb-1">
                    <Text className="text-xs font-sans-semibold" style={{ color: COLORS.navy }}>Parent Info</Text>
                  </View>
                  <DetailRow label="Name" value={student.parentName} />
                  <DetailRow
                    label="Phone"
                    value={student.parentPhone}
                    onPress={student.parentPhone ? () => dialPhone(student.parentPhone!) : undefined}
                  />
                  <DetailRow label="Email" value={student.parentEmail} />
                  <DetailRow label="Address" value={student.parentAddress} />
                </>
              )}
            </ScrollView>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              className="mt-4 bg-gray-100 rounded-xl py-3 items-center"
            >
              <Text className="text-sm font-sans-semibold text-text-muted">Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
