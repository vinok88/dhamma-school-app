import React from 'react';
import { View, Text } from 'react-native';
import { EventModel } from '@/types';
import { EVENT_TYPE_CONFIG } from '@/constants';
import { formatDateTime, formatDate } from '@/utils/date';

interface EventCardProps {
  event: EventModel;
}

export function EventCard({ event }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.eventType] ?? { label: event.eventType, color: '#6B7280', icon: '📅' };
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
    >
      <View className="flex-row items-center mb-2">
        <Text style={{ fontSize: 24 }}>{config.icon}</Text>
        <View className="ml-3 flex-1">
          <Text className="text-base font-sans-semibold text-text-primary">{event.title}</Text>
          <View
            className="self-start px-2 py-0.5 rounded-full mt-1"
            style={{ backgroundColor: config.color + '20' }}
          >
            <Text style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>{config.label}</Text>
          </View>
        </View>
      </View>
      {event.description && (
        <Text className="text-sm text-text-muted mb-2" numberOfLines={2}>{event.description}</Text>
      )}
      <Text className="text-xs text-text-muted">📅 {formatDateTime(event.startDatetime)}</Text>
      {event.location && <Text className="text-xs text-text-muted mt-0.5">📍 {event.location}</Text>}
    </View>
  );
}
