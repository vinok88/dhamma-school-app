import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useMyClass } from '@/hooks/useClasses';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { announcementSchema } from '@/utils/schemas';
import { AnnouncementFormData, AnnouncementType } from '@/types';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants';

export default function SendAnnouncementScreen() {
  const { profile } = useAuth();
  const { data: myClass } = useMyClass(profile?.id ?? '');
  const createAnnouncement = useCreateAnnouncement();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: 'class' },
  });

  async function onSubmit(data: AnnouncementFormData) {
    if (!profile) return;
    try {
      await createAnnouncement.mutateAsync({
        schoolId: profile.schoolId,
        authorId: profile.id,
        title: data.title,
        body: data.body,
        type: data.type,
        targetClassId: data.type === 'class' ? myClass?.id : undefined,
      });
      Alert.alert('Sent!', 'Announcement published successfully.');
      reset();
    } catch {
      Alert.alert('Error', 'Could not publish announcement');
    }
  }

  const types: AnnouncementType[] = ['school', 'class', 'emergency'];

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Notice Board</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Send Announcement 📢
        </Text>
      </View>

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

          {/* Type picker */}
          <Text className="text-sm font-sans-semibold text-text-primary mb-2">Type <Text className="text-primary">*</Text></Text>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <View className="flex-row gap-2 mb-6">
                {types.map((t) => {
                  const cfg = ANNOUNCEMENT_TYPE_CONFIG[t];
                  const active = field.value === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => field.onChange(t)}
                      className={`flex-1 py-3 rounded-xl items-center border-2 ${active ? 'border-primary' : 'border-gray-200 bg-white'}`}
                      style={active ? { backgroundColor: cfg.color + '15', borderColor: cfg.color } : {}}
                    >
                      <Text className="text-xs font-sans-semibold" style={active ? { color: cfg.color } : { color: '#6B7280' }}>
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />

          <Button label="Publish Announcement" onPress={handleSubmit(onSubmit)}
            loading={createAnnouncement.isPending} fullWidth />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
