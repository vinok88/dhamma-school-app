import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useDeleteNotification, useClearAllNotifications } from '@/hooks/useNotifications';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/utils/date';
import { COLORS } from '@/constants';
import { NotificationModel } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  announcement: '📢',
  message: '💬',
  event: '📅',
  registration: '📝',
  attendance: '✅',
};

function isAdminOrPrincipal(role?: string) {
  return role === 'admin' || role === 'principal';
}

function getDestination(n: NotificationModel, role?: string): string {
  switch (n.type) {
    case 'announcement':
      return role === 'teacher' ? '/(teacher)' : '/(parent)/announcements';
    case 'message':
      return n.referenceId ? `/messages/${n.referenceId}` : '/(parent)';
    case 'event':
      return role === 'parent' ? '/(parent)/calendar' : '/(teacher)';
    case 'registration':
      return isAdminOrPrincipal(role) ? '/(admin)/registrations' : '/(parent)';
    case 'attendance':
      return role === 'teacher' ? '/(teacher)/attendance' : '/(parent)';
    default:
      return role === 'teacher' ? '/(teacher)' : isAdminOrPrincipal(role) ? '/(admin)' : '/(parent)';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: notifications, isLoading } = useNotifications(profile?.id ?? '');
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  function handleTap(n: NotificationModel) {
    if (profile?.id) {
      deleteNotification.mutate({ notificationId: n.id, userId: profile.id });
    }
    router.push(getDestination(n, profile?.role) as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader
        title="Notifications 🔔"
        showBack
        right={
          notifications?.length ? (
            <TouchableOpacity
              onPress={() => clearAll.mutate(profile?.id ?? '')}
              className="px-3 py-1.5 bg-primary rounded-lg"
            >
              <Text className="text-white text-xs font-sans-semibold">Clear all</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !notifications?.length ? (
        <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: n }) => (
            <TouchableOpacity
              onPress={() => handleTap(n)}
              activeOpacity={0.7}
              className="rounded-2xl p-4 flex-row"
              style={{
                backgroundColor: n.isRead ? '#FFFFFF' : '#FEF3E6',
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.cream }}>
                <Text style={{ fontSize: 20 }}>{TYPE_ICONS[n.type] ?? '🔔'}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-sans-semibold" style={{ color: n.isRead ? '#1C1C1E' : '#D4873A' }}>
                  {n.title}
                </Text>
                <Text className="text-xs text-text-muted mt-0.5" numberOfLines={2}>{n.body}</Text>
                <Text className="text-xs text-text-muted mt-1">{timeAgo(n.createdAt)}</Text>
              </View>
              {!n.isRead && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1 ml-2" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
