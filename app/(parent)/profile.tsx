import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProfileFormData } from '@/types';

export default function ParentProfile() {
  const { profile, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const [editing, setEditing] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: profile?.fullName ?? '',
      preferredName: profile?.preferredName ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
    },
  });

  async function onSave(data: ProfileFormData) {
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({ userId: profile.id, ...data });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not update profile');
    }
  }

  async function pickPhoto() {
    if (!profile) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      await uploadPhoto.mutateAsync({ userId: profile.id, uri: result.assets[0].uri });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Your Account</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Profile 👤
        </Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-4 pt-5" keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
              <Avatar uri={profile?.profilePhotoUrl} name={profile?.fullName ?? '?'} size={88} />
              <View className="absolute bottom-0 right-0 bg-primary rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-white text-xs">✏️</Text>
              </View>
            </TouchableOpacity>
            <Text className="mt-3 text-base font-sans-semibold text-text-primary">{profile?.fullName}</Text>
            <Text className="text-sm text-text-muted capitalize">{profile?.role}</Text>
          </View>

          <Card className="mb-4">
            {editing ? (
              <View>
                <Controller control={control} name="fullName" render={({ field }) => (
                  <Input label="Full Name" required value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />
                )} />
                <Controller control={control} name="preferredName" render={({ field }) => (
                  <Input label="Preferred Name" value={field.value} onChangeText={field.onChange} />
                )} />
                <Controller control={control} name="phone" render={({ field }) => (
                  <Input label="Phone" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" />
                )} />
                <Controller control={control} name="address" render={({ field }) => (
                  <Input label="Address" value={field.value} onChangeText={field.onChange} multiline numberOfLines={2} />
                )} />
                <View className="flex-row gap-3 mt-2">
                  <View className="flex-1"><Button label="Cancel" variant="outline" onPress={() => setEditing(false)} fullWidth /></View>
                  <View className="flex-1"><Button label="Save" onPress={handleSubmit(onSave)} loading={updateProfile.isPending} fullWidth /></View>
                </View>
              </View>
            ) : (
              <View>
                <InfoRow label="Email" value={profile?.email ?? '—'} />
                <InfoRow label="Phone" value={profile?.phone ?? '—'} />
                <InfoRow label="Address" value={profile?.address ?? '—'} />
                <TouchableOpacity onPress={() => setEditing(true)} className="mt-4">
                  <Text className="text-primary font-sans-semibold text-sm text-center">Edit Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          <Button
            label="Sign Out"
            variant="danger"
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ])}
            fullWidth
          />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="text-sm text-text-primary flex-1 text-right ml-4" numberOfLines={2}>{value}</Text>
    </View>
  );
}
