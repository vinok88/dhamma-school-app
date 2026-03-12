import React from 'react';
import { View, Text } from 'react-native';
import { AnnouncementModel } from '@/types';
import { Badge } from './ui/Badge';
import { timeAgo } from '@/utils/date';
import { COLORS } from '@/constants';

interface AnnouncementCardProps {
  announcement: AnnouncementModel;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const isEmergency = announcement.type === 'emergency';
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
        borderLeftWidth: isEmergency ? 4 : 0,
        borderLeftColor: isEmergency ? COLORS.error : 'transparent',
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="flex-1 text-base font-sans-semibold text-text-primary mr-2" numberOfLines={2}>
          {announcement.title}
        </Text>
        <Badge label="" type="announcement" status={announcement.type} />
      </View>
      <Text className="text-sm text-text-muted mb-3" numberOfLines={3}>
        {announcement.body}
      </Text>
      <Text className="text-xs text-text-muted">
        {announcement.authorName} · {timeAgo(announcement.publishedAt)}
      </Text>
    </View>
  );
}
