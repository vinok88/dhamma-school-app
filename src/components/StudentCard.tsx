import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StudentModel } from '@/types';
import { Avatar } from './ui/Avatar';
import { formatAge } from '@/utils/date';
import { useStudentPhotoUrl } from '@/hooks/useProfile';
import { COLORS } from '@/constants';

interface StudentCardProps {
  student: StudentModel;
  routePrefix?: string;
}

export function StudentCard({ student, routePrefix = '' }: StudentCardProps) {
  const router = useRouter();
  const { data: signedPhotoUrl } = useStudentPhotoUrl(student.photoUrl);

  return (
    <TouchableOpacity
      onPress={() => router.push(`${routePrefix}/student/${student.id}` as never)}
      className="rounded-2xl p-4 mb-3 flex-row items-center"
      style={{ backgroundColor: COLORS.primary, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}
      activeOpacity={0.85}
    >
      <Avatar uri={signedPhotoUrl ?? undefined} name={`${student.firstName} ${student.lastName}`} size={52} />
      <View className="flex-1 ml-3">
        <Text className="text-base font-sans-semibold text-white">
          {student.preferredName ?? student.firstName} {student.lastName}
        </Text>
        <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {formatAge(student.dob)}{student.className ? ` · ${student.className}` : ''}
        </Text>
      </View>
      {/* Status badge — outlined white on amber */}
      <View
        className="rounded-full px-3 py-1"
        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }}
      >
        <Text className="text-xs font-sans-semibold text-white capitalize">
          {student.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
