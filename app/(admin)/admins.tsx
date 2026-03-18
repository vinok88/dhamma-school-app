import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAllUsers, usePromoteToAdmin, useDemoteAdmin } from '@/hooks/useUsers';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants';
import { UserModel } from '@/types';

export default function AdminsScreen() {
  const { profile } = useAuth();
  const { data: users, isLoading } = useAllUsers(profile?.schoolId ?? '');
  const promoteToAdmin = usePromoteToAdmin();
  const demoteAdmin = useDemoteAdmin();
  const [search, setSearch] = useState('');

  const admins = (users ?? []).filter((u) => u.role === 'admin');
  const nonAdmins = (users ?? []).filter(
    (u) => u.role !== 'admin' && u.status === 'active' && u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  function handlePromote(user: UserModel) {
    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to make ${user.fullName} an administrator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: () => promoteToAdmin.mutate(user.id),
        },
      ]
    );
  }

  function handleDemote(user: UserModel) {
    if (user.id === profile?.id) {
      Alert.alert('Cannot Remove', 'You cannot remove your own admin access.');
      return;
    }
    Alert.alert(
      'Remove Admin',
      `Remove admin access from ${user.fullName}? They will be reverted to their previous role.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => demoteAdmin.mutate(user.id),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Manage Admins" showBack dark />

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => 'header'}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Current admins */}
            <Text className="font-sans-semibold text-text-primary mb-3">Current Administrators</Text>
            {isLoading ? (
              <LoadingSpinner />
            ) : !admins.length ? (
              <Text className="text-text-muted text-sm mb-4">No administrators found.</Text>
            ) : (
              admins.map((admin) => (
                <View
                  key={admin.id}
                  className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                >
                  <Avatar uri={admin.profilePhotoUrl} name={admin.fullName} size={48} />
                  <View className="flex-1 ml-3">
                    <Text className="font-sans-semibold text-text-primary">
                      {admin.fullName}
                      {admin.id === profile?.id ? ' (You)' : ''}
                    </Text>
                    <Text className="text-xs text-text-muted">{admin.email ?? admin.phone ?? '—'}</Text>
                  </View>
                  {admin.id !== profile?.id && (
                    <TouchableOpacity
                      onPress={() => handleDemote(admin)}
                      className="bg-red-50 rounded-lg px-3 py-1.5 ml-2"
                    >
                      <Text className="text-xs text-error">Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}

            {/* Promote section */}
            <Text className="font-sans-semibold text-text-primary mt-4 mb-2">Promote User to Admin</Text>
            <Text className="text-xs text-text-muted mb-3">
              Only active teachers and parents can be promoted to admin.
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-text-primary mb-3"
              placeholder="Search users by name…"
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {!search.trim() ? (
              <Text className="text-text-muted text-sm text-center py-4">
                Type a name to search for users to promote.
              </Text>
            ) : !nonAdmins.length ? (
              <EmptyState icon="🔍" title="No matching users" subtitle="No active users found with that name" />
            ) : (
              nonAdmins.map((user) => (
                <View
                  key={user.id}
                  className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                  style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                >
                  <Avatar uri={user.profilePhotoUrl} name={user.fullName} size={48} />
                  <View className="flex-1 ml-3">
                    <Text className="font-sans-semibold text-text-primary">{user.fullName}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Badge
                        label={user.role}
                        color={user.role === 'teacher' ? COLORS.navy : COLORS.primary}
                        bg={user.role === 'teacher' ? '#DBEAFE' : '#FEE2E2'}
                      />
                      <Text className="text-xs text-text-muted">{user.email ?? user.phone ?? '—'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handlePromote(user)}
                    className="bg-green-50 rounded-lg px-3 py-1.5 ml-2"
                  >
                    <Text className="text-xs text-success font-sans-semibold">Promote</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View className="h-8" />
          </View>
        }
      />
    </SafeAreaView>
  );
}
