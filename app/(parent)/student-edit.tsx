import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Switch, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useStudentDetail, useUpdateStudent, useUpdateStudentPhoto } from '@/hooks/useStudents';
import { useUploadStudentPhoto, useStudentPhotoUrl } from '@/hooks/useProfile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COLORS } from '@/constants';

type FormData = {
  preferredName: string;
  address: string;
  hasAllergies: boolean;
  allergyNotes: string;
  photoPublishConsent: boolean;
};

export default function StudentEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student, isLoading } = useStudentDetail(id);
  const { data: signedPhotoUrl } = useStudentPhotoUrl(student?.photoUrl);
  const updateStudent = useUpdateStudent();
  const uploadPhoto = useUploadStudentPhoto();
  const updateStudentPhoto = useUpdateStudentPhoto();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: {
      preferredName: '',
      address: '',
      hasAllergies: false,
      allergyNotes: '',
      photoPublishConsent: false,
    },
  });

  // Hydrate form once student loads
  useEffect(() => {
    if (!student) return;
    reset({
      preferredName: student.preferredName ?? '',
      address: student.address ?? '',
      hasAllergies: student.hasAllergies,
      allergyNotes: student.allergyNotes ?? '',
      photoPublishConsent: student.photoPublishConsent,
    });
  }, [student?.id]);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change the picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      exif: false,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function onSubmit(data: FormData) {
    if (!student) return;
    setSaving(true);
    try {
      await updateStudent.mutateAsync({
        studentId: student.id,
        preferredName: data.preferredName.trim() || undefined,
        address: data.address.trim() || undefined,
        hasAllergies: data.hasAllergies,
        allergyNotes: data.hasAllergies ? data.allergyNotes.trim() : null,
        photoPublishConsent: data.photoPublishConsent,
      });

      if (photoUri) {
        const photoPath = await uploadPhoto.mutateAsync({ studentId: student.id, uri: photoUri });
        if (photoPath) {
          await updateStudentPhoto.mutateAsync({ studentId: student.id, photoPath });
        }
      }

      Alert.alert('Saved', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ?? 'Could not save changes';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !student) return <LoadingSpinner fullScreen />;

  const previewUri = photoUri ?? signedPhotoUrl ?? null;

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Edit Profile" showBack />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.7}>
              {previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.navy }}
                >
                  <Text style={{ fontSize: 48 }}>👧</Text>
                </View>
              )}
              <View
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  backgroundColor: COLORS.primary, padding: 8, borderRadius: 20,
                  borderWidth: 2, borderColor: COLORS.white,
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.white }}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
              Tap to change photo
            </Text>
          </View>

          {/* Read-only identity */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.textMuted }}>
              School-managed
            </Text>
            <Row label="Name"  value={`${student.firstName} ${student.lastName}`} />
            <Row label="DOB"   value={student.dob} />
            <Row label="Gender" value={student.gender || '—'} />
            <Row label="Class" value={student.className ?? 'Unassigned'} />
            <Text className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
              Contact the school to change these.
            </Text>
          </View>

          {/* Editable */}
          <Controller control={control} name="preferredName" render={({ field }) => (
            <Input
              label="Preferred Name"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Nickname (optional)"
            />
          )} />

          <Controller control={control} name="address" render={({ field }) => (
            <AddressAutocomplete
              label="Address"
              value={field.value}
              onChangeText={field.onChange}
            />
          )} />

          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 mr-4">
                <Text className="font-sans-semibold text-text-primary">Has Allergies?</Text>
                <Text className="text-xs text-text-muted">Food, medication, environmental</Text>
              </View>
              <Controller control={control} name="hasAllergies" render={({ field }) => (
                <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />
              )} />
            </View>
            {watch('hasAllergies') && (
              <Controller control={control} name="allergyNotes" render={({ field }) => (
                <Input
                  label="Allergy Notes"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Describe allergies and reactions…"
                  multiline
                  numberOfLines={3}
                />
              )} />
            )}
          </View>

          <View className="bg-white rounded-2xl p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="font-sans-semibold text-text-primary">Photo Publish Consent</Text>
                <Text className="text-xs text-text-muted">Allow school to publish child's photo</Text>
              </View>
              <Controller control={control} name="photoPublishConsent" render={({ field }) => (
                <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />
              )} />
            </View>
          </View>

          <Button
            label="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={saving || updateStudent.isPending || uploadPhoto.isPending}
            fullWidth
            size="lg"
          />
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="text-sm font-sans-medium text-text-primary">{value}</Text>
    </View>
  );
}
