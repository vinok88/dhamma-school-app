import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, findNodeHandle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useEvents } from '@/hooks/useEvents';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { EventCard } from '@/components/EventCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toIsoDate } from '@/utils/date';
import { COLORS } from '@/constants';
import { AnnouncementType } from '@/types';

type FilterValue =
  | 'all'
  | 'announcements'
  | 'events'
  | AnnouncementType; // 'school' | 'class' | 'emergency' | 'event_reminder'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',           label: 'All' },
  { value: 'announcements', label: '📢 Notices' },
  { value: 'events',        label: '📅 Events' },
  { value: 'emergency',     label: '🚨 Emergency' },
  { value: 'school',        label: 'School' },
  { value: 'class',         label: 'Class' },
];

const EVENT_DOT       = COLORS.primary;        // red
const ANNOUNCEMENT_DOT = COLORS.gold;          // gold
const EMERGENCY_DOT   = COLORS.error;          // dark red
const SUNDAY_DOT      = '#94A3B8';             // muted

export default function FeedScreen() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const params = useLocalSearchParams<{ announcementId?: string; eventId?: string }>();

  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [filter, setFilter] = useState<FilterValue>('all');
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const { data: announcements, isLoading: aLoading } = useAnnouncements(schoolId);
  const { data: events,        isLoading: eLoading } = useEvents(schoolId);

  // Deep-link target: jump to the day of the referenced announcement / event,
  // briefly highlight the card.
  const scrollViewRef = useRef<ScrollView | null>(null);
  const highlightRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    if (!announcements && !events) return;
    const targetAnnouncement = params.announcementId
      ? (announcements ?? []).find((a) => a.id === params.announcementId)
      : null;
    const targetEvent = params.eventId
      ? (events ?? []).find((e) => e.id === params.eventId)
      : null;

    if (targetAnnouncement) {
      setSelectedDate(targetAnnouncement.publishedAt.slice(0, 10));
      setFilter('all');
      setHighlightId(`a-${targetAnnouncement.id}`);
    } else if (targetEvent) {
      setSelectedDate(targetEvent.startDatetime.slice(0, 10));
      setFilter('all');
      setHighlightId(`e-${targetEvent.id}`);
    }
  }, [params.announcementId, params.eventId, announcements?.length, events?.length]);

  // Scroll to and clear the highlight after a moment
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      const node = highlightRefs.current[highlightId];
      const scrollHandle = findNodeHandle(scrollViewRef.current as any);
      if (node && scrollHandle) {
        (node as any).measureLayout?.(
          scrollHandle,
          (_x: number, y: number) => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
          },
          () => {}
        );
      }
    }, 200);
    const clear = setTimeout(() => setHighlightId(null), 4000);
    return () => { clearTimeout(t); clearTimeout(clear); };
  }, [highlightId]);

  // ── Build calendar markers (multi-dot) ─────────────────────────────
  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    const ensure = (key: string) => {
      if (!m[key]) m[key] = { dots: [] as { color: string }[] };
      return m[key];
    };

    // Sundays (session days) — light marker
    const today = new Date();
    for (let i = -60; i < 120; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === 0) {
        const key = toIsoDate(d);
        ensure(key).dots.push({ color: SUNDAY_DOT, key: 'sunday' });
      }
    }

    // Events
    (events ?? []).forEach((e) => {
      const key = e.startDatetime.slice(0, 10);
      ensure(key).dots.push({ color: EVENT_DOT, key: `event-${e.id}` });
    });

    // Announcements (publish day)
    (announcements ?? []).forEach((a) => {
      const key = a.publishedAt.slice(0, 10);
      const color = a.type === 'emergency' ? EMERGENCY_DOT : ANNOUNCEMENT_DOT;
      ensure(key).dots.push({ color, key: `ann-${a.id}` });
    });

    // Selected day overlay
    if (m[selectedDate]) {
      m[selectedDate].selected = true;
      m[selectedDate].selectedColor = COLORS.primary;
    } else {
      m[selectedDate] = { selected: true, selectedColor: COLORS.primary, dots: [] };
    }

    return m;
  }, [events, announcements, selectedDate]);

  // ── Filter + slice the list shown below the calendar ───────────────
  const filteredItems = useMemo(() => {
    const dayEvents = (events ?? []).filter((e) =>
      e.startDatetime.startsWith(selectedDate)
    );
    const dayAnnouncements = (announcements ?? []).filter((a) =>
      a.publishedAt.startsWith(selectedDate)
    );

    let items: { kind: 'event' | 'announcement'; payload: any; date: string }[] = [
      ...dayEvents.map((e) => ({ kind: 'event' as const, payload: e, date: e.startDatetime })),
      ...dayAnnouncements.map((a) => ({ kind: 'announcement' as const, payload: a, date: a.publishedAt })),
    ];

    if (filter === 'events') {
      items = items.filter((i) => i.kind === 'event');
    } else if (filter === 'announcements') {
      items = items.filter((i) => i.kind === 'announcement');
    } else if (filter !== 'all') {
      // Specific announcement category
      items = items.filter(
        (i) => i.kind === 'announcement' && i.payload.type === filter
      );
    }

    return items.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [events, announcements, selectedDate, filter]);

  const isLoading = aLoading || eLoading;

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-3">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>
          Notice Board
        </Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Notices & Events 📢
        </Text>
      </View>

      {/* Filter chips — single horizontal row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-xs font-sans-semibold ${active ? 'text-white' : 'text-text-muted'}`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <Calendar
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
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

        {/* Legend */}
        <View className="flex-row flex-wrap px-4 py-3 gap-x-4 gap-y-2">
          <LegendDot color={EVENT_DOT}        label="Event" />
          <LegendDot color={ANNOUNCEMENT_DOT} label="Notice" />
          <LegendDot color={EMERGENCY_DOT}    label="Emergency" />
          <LegendDot color={SUNDAY_DOT}       label="Sunday" />
        </View>

        <View className="px-4 pt-2">
          <Text className="font-sans-semibold text-text-primary mb-3">
            {formatHeader(selectedDate)}
          </Text>
          {isLoading ? (
            <LoadingSpinner />
          ) : filteredItems.length === 0 ? (
            <EmptyState icon="📭" title="Nothing here" subtitle="No notices or events for this day" />
          ) : (
            filteredItems.map((item) => {
              const key = item.kind === 'event' ? `e-${item.payload.id}` : `a-${item.payload.id}`;
              const isHighlighted = highlightId === key;
              return (
                <View
                  key={key}
                  ref={(r) => { highlightRefs.current[key] = r; }}
                  style={isHighlighted ? {
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    borderRadius: 16,
                    padding: 2,
                    marginBottom: 12,
                  } : undefined}
                >
                  {item.kind === 'event'
                    ? <EventCard event={item.payload} />
                    : <AnnouncementCard announcement={item.payload} />}
                </View>
              );
            })
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
      <Text className="text-xs" style={{ color: COLORS.textMuted }}>{label}</Text>
    </View>
  );
}

function formatHeader(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = toIsoDate(new Date());
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

  if (iso === today)                  return `Today · ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  if (iso === toIsoDate(tomorrow))    return `Tomorrow · ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  if (iso === toIsoDate(yesterday))   return `Yesterday · ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
