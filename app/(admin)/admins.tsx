import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAllUsers, useChangeUserRole } from '@/hooks/useUsers';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { UserDetailModal } from '@/components/ui/UserDetailModal';
import { COLORS } from '@/constants';
import { UserModel } from '@/types';

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  admin: { color: COLORS.error, bg: '#FEE2E2' },
  principal: { color: COLORS.gold, bg: '#FEF3C7' },
  teacher: { color: COLORS.navy, bg: '#DBEAFE' },
  parent: { color: COLORS.primary, bg: '#FEE2E2' },
};

export default function AdminsScreen() {
  const { profile } = useAuth();
  const { data: users, isLoading } = useAllUsers(profile?.schoolId ?? '');
  const changeRole = useChangeUserRole();
  const [search, setSearch] = useState('');
  const [promoteRole, setPromoteRole] = useState<'admin' | 'principal'>('principal');
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);

  const elevated = (users ?? []).filter((u) => u.role === 'admin' || u.role === 'principal');
  const nonElevated = (users ?? []).filter(
    (u) =>
      u.role !== 'admin' &&
      u.role !== 'principal' &&
      u.status === 'active' &&
      u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  function handlePromote(user: UserModel) {
    const roleLabel = promoteRole === 'admin' ? 'Admin' : 'Principal';
    Alert.alert(
      `Promote to ${roleLabel}`,
      `Are you sure you want to make ${user.fullName} a ${roleLabel.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: () => changeRole.mutate({ userId: user.id, role: promoteRole }),
        },
      ]
    );
  }

  function handleDemote(user: UserModel) {
    if (user.id === profile?.id) {
      Alert.alert('Cannot Remove', 'You cannot remove your own access.');
      return;
    }
    const roleLabel = user.role === 'admin' ? 'admin' : 'principal';
    Alert.alert(
      `Remove ${roleLabel} access`,
      `Remove ${roleLabel} access from ${user.fullName}? They will be reverted to a parent role.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => changeRole.mutate({ userId: user.id, role: 'parent' }),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Manage Admins & Principals" showBack dark />

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => 'header'}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* Current admins & principals */}
            <Text className="font-sans-semibold text-text-primary mb-3">Current Admins & Principals</Text>
            {isLoading ? (
              <LoadingSpinner />
            ) : !elevated.length ? (
              <Text className="text-text-muted text-sm mb-4">No administrators found.</Text>
            ) : (
              elevated.map((user) => {
                const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.parent;
                return (
                  <TouchableOpacity
                    key={user.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedUser(user)}
                    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                    style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                  >
                    <Avatar uri={user.profilePhotoUrl} name={user.fullName} size={48} />
                    <View className="flex-1 ml-3">
                      <Text className="font-sans-semibold text-text-primary">
                        {user.fullName}
                        {user.id === profile?.id ? ' (You)' : ''}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <Badge label={user.role} color={rc.color} bg={rc.bg} />
                        <Text className="text-xs text-text-muted">{user.email ?? user.phone ?? '—'}</Text>
                      </View>
                    </View>
                    {user.id !== profile?.id && (
                      <TouchableOpacity
                        onPress={() => handleDemote(user)}
                        className="bg-red-50 rounded-lg px-3 py-1.5 ml-2"
                      >
                        <Text className="text-xs text-error">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Promote section */}
            <Text className="font-sans-semibold text-text-primary mt-4 mb-2">Promote User</Text>
            <Text className="text-xs text-text-muted mb-3">
              Search active teachers or parents to promote.
            </Text>

            {/* Role selector */}
            <View className="flex-row gap-2 mb-3">
              {(['principal', 'admin'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setPromoteRole(r)}
                  className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
                    promoteRole === r ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className={`text-sm font-sans-semibold capitalize ${promoteRole === r ? 'text-primary' : 'text-text-muted'}`}>
                    {r === 'admin' ? 'Admin' : 'Principal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
            ) : !nonElevated.length ? (
              <EmptyState icon="🔍" title="No matching users" subtitle="No active users found with that name" />
            ) : (
              nonElevated.map((user) => {
                const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.parent;
                return (
                  <TouchableOpacity
                    key={user.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedUser(user)}
                    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                    style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                  >
                    <Avatar uri={user.profilePhotoUrl} name={user.fullName} size={48} />
                    <View className="flex-1 ml-3">
                      <Text className="font-sans-semibold text-text-primary">{user.fullName}</Text>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <Badge label={user.role} color={rc.color} bg={rc.bg} />
                        <Text className="text-xs text-text-muted">{user.email ?? user.phone ?? '—'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handlePromote(user)}
                      className="bg-green-50 rounded-lg px-3 py-1.5 ml-2"
                    >
                      <Text className="text-xs text-success font-sans-semibold">Promote</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
            <View className="h-8" />
          </View>
        }
      />
      <UserDetailModal visible={!!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} />
    </SafeAreaView>
  );
}
