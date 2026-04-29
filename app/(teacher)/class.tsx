import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useMyClasses } from '@/hooks/useClasses';
import { useClassStudents } from '@/hooks/useStudents';
import { StudentCard } from '@/components/StudentCard';
import { ClassPicker } from '@/components/ui/ClassPicker';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';

export default function ClassRosterScreen() {
  const { profile } = useAuth();
  const { data: classes } = useMyClasses(profile?.id ?? '');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    if (!classes?.length) return;
    if (!selectedClassId || !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const myClass = useMemo(
    () => (classes ?? []).find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );
  const { data: students, isLoading } = useClassStudents(myClass?.id ?? '');
  const [search, setSearch] = useState('');

  const filtered = (students ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      (s.preferredName ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Class Roster</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          {myClass?.name ?? 'My Class'} 👥
        </Text>
        <Text className="text-sm" style={{ color: '#8B7D6B' }}>{myClass?.gradeLevel} · {students?.length ?? 0} students</Text>
      </View>

      <ClassPicker
        classes={classes ?? []}
        selectedId={selectedClassId ?? undefined}
        onSelect={setSelectedClassId}
      />

      {/* Search */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <TextInput
          className="bg-scaffold-bg rounded-xl px-4 py-2.5 text-sm text-text-primary"
          placeholder="Search students…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen label="Loading students…" />
      ) : !filtered.length ? (
        <EmptyState icon="🔍" title="No students found" subtitle="Try a different search" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <StudentCard student={item} routePrefix="/(teacher)" />}
        />
      )}
    </SafeAreaView>
  );
}
