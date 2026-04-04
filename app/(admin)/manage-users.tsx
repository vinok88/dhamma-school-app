import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAllUsers, useChangeUserRole, useDeactivateUser } from '@/hooks/useUsers';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants';
import { UserModel } from '@/types';

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  teacher: { color: COLORS.navy, bg: '#DBEAFE' },
  parent: { color: COLORS.primary, bg: '#FEE2E2' },
};

export default function ManageUsersScreen() {
  const { profile } = useAuth();
  const { data: users, isLoading } = useAllUsers(profile?.schoolId ?? '');
  const changeRole = useChangeUserRole();
  const deactivateUser = useDeactivateUser();
  const [search, setSearch] = useState('');

  // Only show parents and teachers, exclude self
  const filtered = (users ?? []).filter(
    (u) =>
      (u.role === 'parent' || u.role === 'teacher') &&
      u.status === 'active' &&
      u.id !== profile?.id &&
      u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  function handleChangeRole(user: UserModel) {
    const newRole = user.role === 'parent' ? 'teacher' : 'parent';
    const newLabel = newRole === 'teacher' ? 'Teacher' : 'Parent';
    const currentLabel = user.role === 'teacher' ? 'Teacher' : 'Parent';

    Alert.alert(
      'Change Role',
      `Are you sure you want to change ${user.fullName}'s role from ${currentLabel} to ${newLabel}?\n\nThis will affect their access and permissions immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Change to ${newLabel}`,
          onPress: () => changeRole.mutate({ userId: user.id, role: newRole }),
        },
      ]
    );
  }

  function handleRemove(user: UserModel) {
    Alert.alert(
      'Remove User',
      `Are you sure you want to deactivate ${user.fullName}?\n\nThis will revoke their access to the app. This action can be reversed by an admin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Confirm Removal',
              `Please confirm: deactivate ${user.fullName}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Remove',
                  style: 'destructive',
                  onPress: () => deactivateUser.mutate(user.id),
                },
              ]
            ),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Manage Users" showBack dark />

      <View className="px-4 pt-4">
        <Text className="text-xs text-text-muted mb-3">
          Search for teachers and parents to change their role or remove them.
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-text-primary mb-3"
          placeholder="Search users by name…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !search.trim() ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 40 }}>👥</Text>
          <Text className="text-text-muted text-sm text-center mt-2">
            Type a name to search for users.
          </Text>
        </View>
      ) : !filtered.length ? (
        <EmptyState icon="🔍" title="No matching users" subtitle="No active teachers or parents found with that name" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item: user }) => {
            const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.parent;
            const toggleLabel = user.role === 'parent' ? 'Make Teacher' : 'Make Parent';
            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              >
                <View className="flex-row items-center">
                  <Avatar uri={user.profilePhotoUrl} name={user.fullName} size={48} />
                  <View className="flex-1 ml-3">
                    <Text className="font-sans-semibold text-text-primary">{user.fullName}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Badge label={user.role} color={rc.color} bg={rc.bg} />
                      <Text className="text-xs text-text-muted">{user.email ?? user.phone ?? '—'}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    onPress={() => handleChangeRole(user)}
                    className="flex-1 bg-blue-50 rounded-lg py-2 items-center"
                  >
                    <Text className="text-xs font-sans-semibold" style={{ color: COLORS.navy }}>{toggleLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(user)}
                    className="flex-1 bg-red-50 rounded-lg py-2 items-center"
                  >
                    <Text className="text-xs font-sans-semibold text-error">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
