import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useMyClasses } from '@/hooks/useClasses';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
import { ClassPicker } from '@/components/ui/ClassPicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { announcementSchema } from '@/utils/schemas';
import { AnnouncementFormData } from '@/types';
import { showFriendlyError } from '@/utils/errors';

export default function SendAnnouncementScreen() {
  const { profile } = useAuth();
  const { data: classes } = useMyClasses(profile?.id ?? '');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    if (!classes?.length) return;
    if (!selectedClassId || !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const myClass = useMemo(
    () => (classes ?? []).find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );
  const createAnnouncement = useCreateAnnouncement();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: 'class' },
  });

  async function onSubmit(data: AnnouncementFormData) {
    if (!profile) return;
    if (!myClass?.id) {
      Alert.alert('No class assigned', 'You need to be assigned to a class before sending announcements.');
      return;
    }
    try {
      await createAnnouncement.mutateAsync({
        schoolId: profile.schoolId,
        authorId: profile.id,
        title: data.title,
        body: data.body,
        type: 'class',
        targetClassId: myClass.id,
      });
      Alert.alert('Sent!', 'Announcement published successfully.');
      reset();
    } catch (e: unknown) {
      showFriendlyError("Couldn't publish announcement", e, 'teacher-announce');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Notice Board</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Send Announcement 📢
        </Text>
        {myClass?.name ? (
          <Text className="text-sm mt-1" style={{ color: '#8B7D6B' }}>
            Class: {myClass.name}
          </Text>
        ) : null}
      </View>

      <ClassPicker
        classes={classes ?? []}
        selectedId={selectedClassId ?? undefined}
        onSelect={setSelectedClassId}
      />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-4 pt-5" keyboardShouldPersistTaps="handled">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input label="Title" required value={field.value} onChangeText={field.onChange}
                placeholder="Announcement title" error={errors.title?.message} />
            )}
          />

          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <Input label="Message" required value={field.value} onChangeText={field.onChange}
                placeholder="Write your announcement here…" multiline numberOfLines={6}
                error={errors.body?.message} />
            )}
          />

          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#F3F4F6' }}>
            <Text className="text-xs" style={{ color: '#6B7280' }}>
              This will be sent to parents and students of {myClass?.name ?? 'your class'} only.
            </Text>
          </View>

          <Button label="Publish Announcement" onPress={handleSubmit(onSubmit)}
            loading={createAnnouncement.isPending} fullWidth />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
