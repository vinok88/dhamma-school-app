import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAnnouncementViewStats } from '@/hooks/useAnnouncements';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';

type Tab = 'all' | 'viewed' | 'not_viewed';

const ROLE_LABELS: Record<string, string> = {
  parent: 'Parent',
  teacher: 'Teacher',
  admin: 'Admin',
};

export default function AnnouncementStatsScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { data: stats, isLoading } = useAnnouncementViewStats(id ?? '');
  const [tab, setTab] = useState<Tab>('all');

  const viewedCount = stats?.filter((s) => s.viewed).length ?? 0;
  const totalCount = stats?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((viewedCount / totalCount) * 100) : 0;

  const filtered = stats?.filter((s) => {
    if (tab === 'viewed') return s.viewed;
    if (tab === 'not_viewed') return !s.viewed;
    return true;
  }) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="View Stats" showBack />

      {/* Announcement title */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-base font-sans-semibold text-text-primary" numberOfLines={2}>
          {title ?? 'Announcement'}
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !stats?.length ? (
        <EmptyState icon="📊" title="No recipients" subtitle="No users were targeted by this announcement." />
      ) : (
        <>
          {/* Summary bar */}
          <View className="mx-4 mb-3 bg-white rounded-2xl p-4" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-sans-semibold text-text-primary">
                {viewedCount}/{totalCount} viewed
              </Text>
              <Text className="text-2xl font-sans-semibold" style={{ color: pct >= 75 ? COLORS.success : pct >= 40 ? COLORS.gold : COLORS.primary }}>
                {pct}%
              </Text>
            </View>
            {/* Progress bar */}
            <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 75 ? COLORS.success : pct >= 40 ? COLORS.gold : COLORS.primary,
                }}
              />
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row mx-4 mb-3 bg-white rounded-xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
            {([
              { key: 'all' as Tab, label: `All (${totalCount})` },
              { key: 'viewed' as Tab, label: `Viewed (${viewedCount})` },
              { key: 'not_viewed' as Tab, label: `Pending (${totalCount - viewedCount})` },
            ]).map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                className="flex-1 py-2.5 items-center"
                style={tab === t.key ? { backgroundColor: COLORS.primary } : {}}
              >
                <Text
                  className="text-xs font-sans-semibold"
                  style={{ color: tab === t.key ? '#FFFFFF' : COLORS.textMuted }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* User list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View
                className="flex-row items-center bg-white rounded-xl p-3 mb-2"
                style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 }}
              >
                {/* Status icon */}
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: item.viewed ? '#E8F5E9' : '#FFF3E0' }}
                >
                  <Text style={{ fontSize: 14 }}>{item.viewed ? '✅' : '⏳'}</Text>
                </View>
                {/* Name */}
                <View className="flex-1">
                  <Text className="text-sm font-sans-semibold text-text-primary">
                    {item.full_name ?? 'Unknown'}
                  </Text>
                  <Text className="text-xs text-text-muted">
                    {ROLE_LABELS[item.role] ?? item.role}
                  </Text>
                </View>
                {/* Status label */}
                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: item.viewed ? '#E8F5E9' : '#FFF3E0' }}
                >
                  <Text
                    className="text-xs font-sans-semibold"
                    style={{ color: item.viewed ? COLORS.success : COLORS.gold }}
                  >
                    {item.viewed ? 'Viewed' : 'Pending'}
                  </Text>
                </View>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}
