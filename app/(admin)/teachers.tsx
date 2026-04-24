import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTeachers, useDeactivateTeacher } from '@/hooks/useTeachers';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { UserDetailModal } from '@/components/ui/UserDetailModal';
import { COLORS } from '@/constants';
import { UserModel } from '@/types';

export default function TeachersScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: teachers, isLoading } = useTeachers(profile?.schoolId ?? '');
  const deactivate = useDeactivateTeacher();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);

  const filtered = (teachers ?? []).filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Teachers 👩‍🏫" showBack dark />

      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <TextInput
          className="bg-scaffold-bg rounded-xl px-4 py-2.5 text-sm text-text-primary"
          placeholder="Search teachers…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !filtered.length ? (
        <EmptyState icon="👩‍🏫" title="No teachers found" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedUser(t as unknown as UserModel)}
              className="bg-white rounded-2xl p-4 flex-row items-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <Avatar uri={t.profilePhotoUrl} name={t.fullName} size={52} />
              <View className="flex-1 ml-3">
                <Text className="font-sans-semibold text-text-primary">{t.fullName}</Text>
                <Text className="text-xs text-text-muted">{t.phone ?? '—'}</Text>
                <View className="mt-1">
                  <Badge
                    label={t.status}
                    color={t.status === 'active' ? COLORS.success : COLORS.pending}
                    bg={t.status === 'active' ? '#D1FAE5' : '#FEF3C7'}
                  />
                </View>
              </View>
              {t.status === 'active' && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Deactivate', `Deactivate ${t.fullName}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Deactivate', style: 'destructive', onPress: () => deactivate.mutate(t.id) },
                    ])
                  }
                  className="bg-red-50 rounded-lg px-3 py-1.5 ml-2"
                >
                  <Text className="text-xs text-error">Deactivate</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      <UserDetailModal visible={!!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} />
    </SafeAreaView>
  );
}
