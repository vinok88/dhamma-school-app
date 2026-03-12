import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/utils/date';
import { COLORS } from '@/constants';

const TYPE_ICONS: Record<string, string> = {
  announcement: '📢',
  message: '💬',
  event: '📅',
  registration: '📝',
  attendance: '✅',
};

export default function NotificationsScreen() {
  const { profile } = useAuth();
  const { data: notifications, isLoading } = useNotifications(profile?.id ?? '');
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader
        title="Notifications 🔔"
        showBack
        right={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllRead.mutate(profile?.id ?? '')} className="px-3 py-1.5 bg-primary rounded-lg">
              <Text className="text-white text-xs font-sans-semibold">Mark all read</Text>
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
            <View
              className={`rounded-2xl p-4 flex-row ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.cream }}>
                <Text style={{ fontSize: 20 }}>{TYPE_ICONS[n.type] ?? '🔔'}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className={`text-sm font-sans-semibold ${n.isRead ? 'text-text-primary' : 'text-navy'}`}>{n.title}</Text>
                <Text className="text-xs text-text-muted mt-0.5" numberOfLines={2}>{n.body}</Text>
                <Text className="text-xs text-text-muted mt-1">{timeAgo(n.createdAt)}</Text>
              </View>
              {!n.isRead && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1 ml-2" />
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
