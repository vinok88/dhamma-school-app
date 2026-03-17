import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePendingStudents, useApproveStudent, useRejectStudent } from '@/hooks/useStudents';
import { usePendingTeachers, useApproveTeacher, useRejectTeacher } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatAge } from '@/utils/date';
import { COLORS } from '@/constants';

export default function RegistrationsScreen() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const [tab, setTab] = useState<'students' | 'teachers'>('students');

  const { data: pendingStudents, isLoading: studentsLoading } = usePendingStudents(schoolId);
  const { data: pendingTeachers, isLoading: teachersLoading } = usePendingTeachers(schoolId);
  const { data: classes } = useClasses(schoolId);

  const approveStudent = useApproveStudent();
  const rejectStudent = useRejectStudent();
  const approveTeacher = useApproveTeacher();
  const rejectTeacher = useRejectTeacher();

  const [selectedClassId, setSelectedClassId] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-4">
        <Text className="text-white" style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}>
          Pending Registrations ⏳
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-100 px-4 pt-2">
        {(['students', 'teachers'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            className={`mr-6 pb-2 border-b-2 ${tab === t ? 'border-primary' : 'border-transparent'}`}
          >
            <Text className={`font-sans-semibold ${tab === t ? 'text-primary' : 'text-text-muted'}`}>
              {t === 'students' ? `Students (${pendingStudents?.length ?? 0})` : `Teachers (${pendingTeachers?.length ?? 0})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {tab === 'students' && (
          studentsLoading ? <LoadingSpinner /> :
          !pendingStudents?.length ? <EmptyState icon="✅" title="All clear" subtitle="No pending student registrations" /> :
          pendingStudents.map((student) => (
            <Card key={student.id} className="mb-4">
              <View className="flex-row items-center mb-3">
                <Avatar uri={student.photoUrl} name={`${student.firstName} ${student.lastName}`} size={52} />
                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-text-primary">{student.firstName} {student.lastName}</Text>
                  <Text className="text-xs text-text-muted">DOB: {formatDate(student.dob)} ({formatAge(student.dob)})</Text>
                  <Text className="text-xs text-text-muted">Parent: {student.parentName ?? '—'}</Text>
                  {student.hasAllergies && <Text className="text-xs text-error mt-0.5">⚠️ Has allergies</Text>}
                </View>
              </View>

              {/* Class assignment */}
              <Text className="text-xs font-sans-semibold text-text-muted mb-1">Assign to Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  {(classes ?? []).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedClassId((prev) => ({ ...prev, [student.id]: c.id }))}
                      className={`px-3 py-1.5 rounded-full border ${selectedClassId[student.id] === c.id ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`text-xs font-sans-semibold ${selectedClassId[student.id] === c.id ? 'text-white' : 'text-text-muted'}`}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TextInput
                className="bg-scaffold-bg rounded-xl px-3 py-2 text-sm text-text-primary mb-3"
                placeholder="Rejection note (optional)"
                placeholderTextColor={COLORS.textMuted}
                value={rejectNotes[student.id] ?? ''}
                onChangeText={(t) => setRejectNotes((prev) => ({ ...prev, [student.id]: t }))}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    const classId = selectedClassId[student.id];
                    if (!classId) { Alert.alert('Select a class first'); return; }
                    approveStudent.mutate({ studentId: student.id, classId });
                  }}
                  className="flex-1 bg-success py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-sans-semibold text-sm">✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => rejectStudent.mutate({ studentId: student.id, note: rejectNotes[student.id] })}
                  className="flex-1 bg-red-100 py-3 rounded-xl items-center"
                >
                  <Text className="text-error font-sans-semibold text-sm">✗ Reject</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {tab === 'teachers' && (
          teachersLoading ? <LoadingSpinner /> :
          !pendingTeachers?.length ? <EmptyState icon="✅" title="All clear" subtitle="No pending teacher registrations" /> :
          pendingTeachers.map((teacher) => (
            <Card key={teacher.id} className="mb-4">
              <View className="flex-row items-center mb-4">
                <Avatar uri={teacher.profilePhotoUrl} name={teacher.fullName} size={52} />
                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-text-primary">{teacher.fullName}</Text>
                  <Text className="text-xs text-text-muted">{teacher.phone ?? '—'}</Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => approveTeacher.mutate(teacher.id)}
                  className="flex-1 bg-success py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-sans-semibold text-sm">✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => rejectTeacher.mutate(teacher.id)}
                  className="flex-1 bg-red-100 py-3 rounded-xl items-center"
                >
                  <Text className="text-error font-sans-semibold text-sm">✗ Reject</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
