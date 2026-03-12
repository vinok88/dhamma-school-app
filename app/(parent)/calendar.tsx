import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/EventCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toIsoDate } from '@/utils/date';
import { COLORS } from '@/constants';

export default function CalendarScreen() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const { data: events, isLoading } = useEvents(profile?.schoolId ?? '');

  // Build marked dates: all Sundays + event dates
  const markedDates: Record<string, object> = {};

  // Mark Sundays (session days)
  const today = new Date();
  for (let i = -60; i < 120; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) {
      const key = toIsoDate(d);
      markedDates[key] = {
        ...(markedDates[key] ?? {}),
        marked: true,
        dotColor: COLORS.gold,
      };
    }
  }

  // Mark event dates
  (events ?? []).forEach((e) => {
    const key = e.startDatetime.slice(0, 10);
    markedDates[key] = {
      ...(markedDates[key] ?? {}),
      marked: true,
      dotColor: COLORS.primary,
    };
  });

  // Mark selected
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: COLORS.primary,
  };

  const dayEvents = (events ?? []).filter((e) => e.startDatetime.startsWith(selectedDate));

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-4">
        <Text
          className="text-white"
          style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}
        >
          Calendar 📅
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: COLORS.white,
            calendarBackground: COLORS.white,
            selectedDayBackgroundColor: COLORS.primary,
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.navy,
            textDayFontFamily: 'WorkSans_400Regular',
            textMonthFontFamily: 'DMSerifDisplay_400Regular',
          }}
        />

        <View className="px-4 pt-4">
          <Text className="font-sans-semibold text-text-primary mb-3">
            Events on {selectedDate}
          </Text>
          {isLoading ? (
            <LoadingSpinner />
          ) : dayEvents.length === 0 ? (
            <EmptyState icon="📭" title="No events" subtitle="Nothing scheduled for this day" />
          ) : (
            dayEvents.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
