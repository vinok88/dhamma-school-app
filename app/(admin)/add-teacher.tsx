import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useInviteTeacher } from '@/hooks/useTeacherInvitations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { addTeacherSchema } from '@/utils/schemas';
import { COLORS } from '@/constants';
import { showFriendlyError } from '@/utils/errors';

type FormData = {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
};

export default function AddTeacherScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const inviteTeacher = useInviteTeacher();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: { fullName: '', email: '', phone: '', address: '' },
  });

  async function onSubmit(data: FormData) {
    if (!profile) return;
    setSubmitting(true);
    try {
      await inviteTeacher.mutateAsync({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        invitedBy: profile.id,
      });
      Alert.alert(
        'Teacher added',
        `When ${data.fullName} signs up with ${data.email}, they will automatically get teacher access.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: unknown) {
      showFriendlyError("Couldn't add teacher", e, 'add-teacher');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Add Teacher" showBack dark />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          <Text className="text-xs text-text-muted mb-4">
            Add the teacher's email. When they sign up with that email, they will
            automatically get teacher access.
          </Text>

          <Controller control={control} name="fullName" render={({ field }) => (
            <Input
              label="Full Name"
              required
              value={field.value}
              onChangeText={field.onChange}
              placeholder="e.g. Saman Kumar"
              error={errors.fullName?.message}
            />
          )} />

          <Controller control={control} name="email" render={({ field }) => (
            <Input
              label="Email"
              required
              value={field.value}
              onChangeText={field.onChange}
              placeholder="teacher@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )} />

          <Controller control={control} name="phone" render={({ field }) => (
            <Input
              label="Phone"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="+61 4XX XXX XXX (optional)"
              keyboardType="phone-pad"
            />
          )} />

          <Controller control={control} name="address" render={({ field }) => (
            <AddressAutocomplete
              label="Address"
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={errors.address?.message}
            />
          )} />

          <View className="h-4" />
          <Button
            label="Add Teacher"
            onPress={handleSubmit(onSubmit)}
            loading={submitting || inviteTeacher.isPending}
            fullWidth
            size="lg"
          />
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
