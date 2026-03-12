import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StudentModel } from '@/types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { formatAge } from '@/utils/date';

interface StudentCardProps {
  student: StudentModel;
  routePrefix?: string;
}

export function StudentCard({ student, routePrefix = '' }: StudentCardProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push(`${routePrefix}/student/${student.id}` as never)}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
      activeOpacity={0.7}
    >
      <Avatar uri={student.photoUrl} name={`${student.firstName} ${student.lastName}`} size={52} />
      <View className="flex-1 ml-3">
        <Text className="text-base font-sans-semibold text-text-primary">
          {student.preferredName ?? student.firstName} {student.lastName}
        </Text>
        <Text className="text-sm text-text-muted">
          {formatAge(student.dob)} {student.className ? `· ${student.className}` : ''}
        </Text>
      </View>
      <Badge label="" type="student" status={student.status} />
    </TouchableOpacity>
  );
}
