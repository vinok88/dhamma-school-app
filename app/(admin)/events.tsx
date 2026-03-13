import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { EventCard } from '@/components/EventCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventFormData, EventType } from '@/types';
import { EVENT_TYPE_CONFIG } from '@/constants';

export default function EventsScreen() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const { data: events, isLoading } = useEvents(schoolId);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const [modalVisible, setModalVisible] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>({
    defaultValues: { eventType: 'poya', location: '' },
  });

  async function onSubmit(data: EventFormData) {
    if (!profile) return;
    try {
      await createEvent.mutateAsync({
        schoolId,
        createdBy: profile.id,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startDatetime: data.startDatetime,
        endDatetime: data.endDatetime,
        location: data.location,
      });
      setModalVisible(false);
      reset();
    } catch {
      Alert.alert('Error', 'Could not create event');
    }
  }

  const EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG) as EventType[];

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-5 flex-row items-center justify-between">
        <View>
          <ScreenHeader title="Events 📅" dark />
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-primary rounded-xl px-4 py-2">
          <Text className="text-white font-sans-semibold text-sm">+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : !events?.length ? (
        <EmptyState icon="📅" title="No events" subtitle="Tap '+ New' to add one" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: event }) => (
            <TouchableOpacity
              onLongPress={() =>
                Alert.alert('Delete Event', `Delete "${event.title}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteEvent.mutate(event.id) },
                ])
              }
            >
              <EventCard event={event} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <ScrollView className="bg-white rounded-t-3xl" style={{ maxHeight: '90%' }}>
            <View className="px-5 pt-6 pb-10">
              <Text className="text-lg font-sans-semibold text-text-primary mb-4">New Event</Text>

              <Controller control={control} name="title" render={({ field }) => (
                <Input label="Title" required value={field.value} onChangeText={field.onChange}
                  placeholder="Event title" error={errors.title?.message} />
              )} />
              <Controller control={control} name="description" render={({ field }) => (
                <Input label="Description" value={field.value} onChangeText={field.onChange}
                  placeholder="Optional description" multiline numberOfLines={3} />
              )} />
              <Controller control={control} name="startDatetime" render={({ field }) => (
                <DatePicker
                  label="Start Date & Time"
                  required
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.startDatetime?.message}
                  mode="datetime"
                />
              )} />
              <Controller control={control} name="endDatetime" render={({ field }) => (
                <DatePicker
                  label="End Date & Time (optional)"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  mode="datetime"
                />
              )} />
              <Controller control={control} name="location" render={({ field }) => (
                <Input label="Location" required value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Monastery Hall" error={errors.location?.message} />
              )} />

              <Text className="text-sm font-sans-semibold text-text-primary mb-2">Event Type</Text>
              <Controller control={control} name="eventType" render={({ field }) => (
                <View className="flex-row flex-wrap gap-2 mb-5">
                  {EVENT_TYPES.map((t) => {
                    const cfg = EVENT_TYPE_CONFIG[t];
                    const active = field.value === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => field.onChange(t)}
                        className={`px-3 py-2 rounded-xl flex-row items-center border-2 ${active ? 'border-primary' : 'border-gray-200 bg-white'}`}
                        style={active ? { backgroundColor: cfg.color + '15', borderColor: cfg.color } : {}}
                      >
                        <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                        <Text className="ml-1 text-xs font-sans-semibold" style={{ color: active ? cfg.color : '#6B7280' }}>{cfg.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )} />

              <View className="flex-row gap-3">
                <View className="flex-1"><Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} fullWidth /></View>
                <View className="flex-1"><Button label="Create" onPress={handleSubmit(onSubmit)} loading={createEvent.isPending} fullWidth /></View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
