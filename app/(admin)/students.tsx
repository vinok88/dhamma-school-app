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
import { UserDetailModal } from '@/components/ui/UserDetailModal';
import { formatAge } from '@/utils/date';
import { COLORS } from '@/constants';
import { StudentModel, StudentStatus } from '@/types';

// 'pending' surfaces parent-submitted registrations awaiting approval; tap a row
// to review and (in the detail modal) assign a class + set the status to active.
const STATUS_FILTERS: (StudentStatus | 'all')[] = ['all', 'pending', 'active', 'inactive'];

function StudentRow({ student: s, onStatusChange, onPress }: { student: any; onStatusChange: (id: string, status: StudentStatus) => void; onPress: () => void }) {
  const { data: signedPhotoUrl } = useStudentPhotoUrl(s.photoUrl);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress()}
      className="bg-white rounded-2xl p-4 flex-row items-center"
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      <Avatar uri={signedPhotoUrl ?? undefined} name={`${s.firstName} ${s.lastName}`} size={48} />
      <View className="flex-1 ml-3">
        <Text className="font-sans-semibold text-text-primary">{s.firstName} {s.lastName}</Text>
        <Text className="text-xs text-text-muted">{formatAge(s.dob)} · {s.className ?? 'Unassigned'}</Text>
        <View className="mt-1"><Badge label="" type="student" status={s.status} /></View>
      </View>
      {s.status === 'pending' ? (
        <TouchableOpacity
          onPress={onPress}
          className="ml-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-xs font-sans-semibold text-white">Review</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            const next: StudentStatus = s.status === 'active' ? 'inactive' : 'active';
            onStatusChange(s.id, next);
          }}
          className="ml-2 p-2"
        >
          <Text className="text-xs text-text-muted">⋮</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function StudentsScreen() {
  const { profile } = useAuth();
  const { data: students, isLoading } = useAllStudents(profile?.schoolId ?? '');
  const updateStatus = useUpdateStudentStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentModel | null>(null);
  const [selectedStudentPhotoUrl, setSelectedStudentPhotoUrl] = useState<string | null>(null);

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

      {/* Status filter — fixed height so it never gets squeezed by the list below */}
      <View
        style={{
          height: 50,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.divider,
          flexShrink: 0,
        }}
      >
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', gap: 8 }}
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
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !filtered.length ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="🔍" title="No students found" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: s }) => (
            <StudentRow
              student={s}
              onStatusChange={confirmStatusChange}
              onPress={() => setSelectedStudent(s as unknown as StudentModel)}
            />
          )}
        />
      )}
      <UserDetailModal
        visible={!!selectedStudent}
        student={selectedStudent}
        editable
        onClose={() => { setSelectedStudent(null); setSelectedStudentPhotoUrl(null); }}
      />
    </SafeAreaView>
  );
}
