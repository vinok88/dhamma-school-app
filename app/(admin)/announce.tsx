import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/hooks/useClasses';
import { useAnnouncements, useCreateAnnouncement } from '@/hooks/useAnnouncements';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { announcementSchema } from '@/utils/schemas';
import { AnnouncementFormData, AnnouncementType } from '@/types';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants';
import { showFriendlyError } from '@/utils/errors';

const ALL_TYPES: AnnouncementType[] = ['school', 'class', 'emergency', 'event_reminder'];

export default function AdminAnnounceScreen() {
  const { profile } = useAuth();
  const { data: classes } = useClasses(profile?.schoolId ?? '');
  const { data: announcements } = useAnnouncements(profile?.schoolId ?? '');
  const createAnnouncement = useCreateAnnouncement();

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: 'school' },
  });

  const currentType = watch('type');

  async function onSubmit(data: AnnouncementFormData) {
    if (!profile) return;
    try {
      await createAnnouncement.mutateAsync({
        schoolId: profile.schoolId,
        authorId: profile.id,
        title: data.title,
        body: data.body,
        type: data.type,
        targetClassId: data.type === 'class' ? data.targetClassId : undefined,
      });
      Alert.alert('Published!', 'Announcement sent to all recipients.');
      reset();
    } catch (e: unknown) {
      showFriendlyError("Couldn't publish announcement", e, 'admin-announce');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Compose Announcement 📢" showBack dark />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-4 pt-5" keyboardShouldPersistTaps="handled">
          <Controller control={control} name="title" render={({ field }) => (
            <Input label="Title" required value={field.value} onChangeText={field.onChange}
              placeholder="Announcement headline" error={errors.title?.message} />
          )} />

          <Controller control={control} name="body" render={({ field }) => (
            <Input label="Message" required value={field.value} onChangeText={field.onChange}
              placeholder="Write the full announcement here…" multiline numberOfLines={8}
              error={errors.body?.message} />
          )} />

          {/* Type */}
          <Text className="text-sm font-sans-semibold text-text-primary mb-2">Type <Text className="text-primary">*</Text></Text>
          <Controller control={control} name="type" render={({ field }) => (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ALL_TYPES.map((t) => {
                const cfg = ANNOUNCEMENT_TYPE_CONFIG[t];
                const active = field.value === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => field.onChange(t)}
                    className={`px-4 py-2 rounded-xl border-2 ${active ? 'border-primary' : 'border-gray-200 bg-white'}`}
                    style={active ? { backgroundColor: cfg.color + '15', borderColor: cfg.color } : {}}
                  >
                    <Text className="text-sm font-sans-semibold" style={{ color: active ? cfg.color : '#6B7280' }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )} />

          {/* Class picker — only for class type */}
          {currentType === 'class' && (
            <>
              <Text className="text-sm font-sans-semibold text-text-primary mb-2">Target Class</Text>
              <Controller control={control} name="targetClassId" render={({ field }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {(classes ?? []).map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => field.onChange(c.id)}
                        className={`px-3 py-1.5 rounded-full border ${field.value === c.id ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`text-xs font-sans-semibold ${field.value === c.id ? 'text-white' : 'text-text-muted'}`}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )} />
            </>
          )}

          {currentType === 'emergency' && (
            <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
              <Text className="text-error text-sm">🚨 Emergency announcements are sent immediately to all parents and teachers.</Text>
            </View>
          )}

          <Button label="Publish Announcement" onPress={handleSubmit(onSubmit)}
            loading={createAnnouncement.isPending} fullWidth size="lg" />

          {/* Recent announcements — same look as the dashboard list */}
          <Text className="text-xs tracking-widest uppercase mt-8 mb-3" style={{ color: '#8B7D6B' }}>
            Recent Announcements
          </Text>
          {!announcements?.length ? (
            <Text className="text-sm text-text-muted mb-4">No announcements yet.</Text>
          ) : (
            announcements.slice(0, 10).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
