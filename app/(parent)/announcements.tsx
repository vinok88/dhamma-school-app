import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnnouncementType } from '@/types';

const FILTERS: { value: AnnouncementType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'school', label: 'School' },
  { value: 'class', label: 'Class' },
  { value: 'emergency', label: '🚨 Emergency' },
  { value: 'event_reminder', label: 'Events' },
];

export default function AnnouncementsScreen() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<AnnouncementType | 'all'>('all');
  const { data: announcements, isLoading } = useAnnouncements(profile?.schoolId ?? '');

  const filtered =
    filter === 'all' ? announcements : announcements?.filter((a) => a.type === filter);

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Notice Board</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Announcements 📢
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full ${
              filter === f.value ? 'bg-primary' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-sans-semibold ${
                filter === f.value ? 'text-white' : 'text-text-muted'
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <LoadingSpinner label="Loading announcements…" />
        ) : !filtered?.length ? (
          <EmptyState icon="📭" title="No announcements" subtitle="Nothing to show here yet" />
        ) : (
          filtered.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
