import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAllStudents, useUpdateStudentStatus } from '@/hooks/useStudents';
import { useStudentPhotoUrl } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatAge } from '@/utils/date';
import { COLORS } from '@/constants';
import { StudentStatus } from '@/types';

const STATUS_FILTERS: (StudentStatus | 'all')[] = ['all', 'active', 'pending', 'under_review', 'inactive', 'dropped'];

function StudentRow({ student: s, onStatusChange }: { student: any; onStatusChange: (id: string, status: StudentStatus) => void }) {
  const { data: signedPhotoUrl } = useStudentPhotoUrl(s.photoUrl);
  return (
    <View
      className="bg-white rounded-2xl p-4 flex-row items-center"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      <Avatar uri={signedPhotoUrl ?? undefined} name={`${s.firstName} ${s.lastName}`} size={48} />
      <View className="flex-1 ml-3">
        <Text className="font-sans-semibold text-text-primary">{s.firstName} {s.lastName}</Text>
        <Text className="text-xs text-text-muted">{formatAge(s.dob)} · {s.className ?? 'Unassigned'}</Text>
        <View className="mt-1"><Badge label="" type="student" status={s.status} /></View>
      </View>
      <TouchableOpacity
        onPress={() => {
          const next: StudentStatus = s.status === 'active' ? 'inactive' : 'active';
          onStatusChange(s.id, next);
        }}
        className="ml-2 p-2"
      >
        <Text className="text-xs text-text-muted">⋮</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StudentsScreen() {
  const { profile } = useAuth();
  const { data: students, isLoading } = useAllStudents(profile?.schoolId ?? '');
  const updateStatus = useUpdateStudentStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');

  const filtered = (students ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      (s.className ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function confirmStatusChange(studentId: string, newStatus: StudentStatus) {
    Alert.alert(
      'Change Status',
      `Set student status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateStatus.mutate({ studentId, status: newStatus }) },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-5">
        <Text className="text-white" style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}>
          Students 🎒
        </Text>
        <Text className="text-blue-200 text-sm">{students?.length ?? 0} total</Text>
      </View>

      {/* Search */}
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <TextInput
          className="bg-scaffold-bg rounded-xl px-4 py-2.5 text-sm text-text-primary"
          placeholder="Search by name or class…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status filter */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
        style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider, maxHeight: 50 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatusFilter(item)}
            className={`px-3 py-1.5 rounded-full ${statusFilter === item ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-xs font-sans-semibold capitalize ${statusFilter === item ? 'text-white' : 'text-text-muted'}`}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !filtered.length ? (
        <EmptyState icon="🔍" title="No students found" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: s }) => (
            <StudentRow student={s} onStatusChange={confirmStatusChange} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
