import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useRequestAddStudent, useLinkStudentByCode } from '@/hooks/useStudents';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePicker } from '@/components/ui/DatePicker';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { PhotoConsentPolicyLink } from '@/components/ui/PhotoConsentPolicy';
import { requestChildSchema, linkChildSchema } from '@/utils/schemas';
import { calculateAge } from '@/utils/date';
import { COLORS } from '@/constants';
import { showFriendlyError } from '@/utils/errors';

type Mode = 'new' | 'link';

type FormData = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  hasAllergies: boolean;
  allergyNotes?: string;
  photoPublishConsent: boolean;
};

export default function AddChildScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const requestAdd = useRequestAddStudent();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>('new');

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(requestChildSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      dob: '',
      gender: 'male',
      address: profile?.address ?? '',
      hasAllergies: false,
      allergyNotes: '',
      photoPublishConsent: false,
    },
  });

  async function onSubmit(data: FormData) {
    if (!profile) return;
    const age = calculateAge(data.dob);
    if (age < 3 || age > 18) {
      Alert.alert('Age Error', 'Child must be between 3 and 18 years old.');
      return;
    }

    setSubmitting(true);
    try {
      await requestAdd.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
        hasAllergies: data.hasAllergies,
        allergyNotes: data.allergyNotes,
        photoPublishConsent: data.photoPublishConsent,
      });
      Alert.alert(
        'Request submitted',
        "Your child has been submitted for approval. The school principal will review the registration and assign a class. You'll see the status update here.",
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: unknown) {
      showFriendlyError("Couldn't submit registration", e, 'add-child');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Add a Child" showBack />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {/* Mode toggle: register a new child vs link to one that already exists */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
            {([['new', 'Add new child'], ['link', 'Link existing child']] as const).map(([m, label]) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg items-center"
                style={{ backgroundColor: mode === m ? COLORS.white : 'transparent' }}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-sans-semibold ${mode === m ? 'text-primary' : 'text-text-muted'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'link' ? (
            <LinkExistingChild onDone={() => router.back()} />
          ) : (
          <>
          <View className="bg-blue-50 rounded-2xl p-4 mb-4">
            <Text className="text-sm" style={{ color: COLORS.navy }}>
              Tell us about your child. Once you submit, the request goes to the school
              principal for approval and class assignment.
            </Text>
          </View>

          <Text className="text-xs tracking-widest uppercase mb-2" style={{ color: COLORS.textMuted }}>
            Child Details
          </Text>

          <Controller control={control} name="firstName" render={({ field }) => (
            <Input label="First Name" required value={field.value} onChangeText={field.onChange}
              placeholder="e.g. Sithumi" error={errors.firstName?.message} />
          )} />
          <Controller control={control} name="lastName" render={({ field }) => (
            <Input label="Last Name" required value={field.value} onChangeText={field.onChange}
              placeholder="e.g. Perera" error={errors.lastName?.message} />
          )} />
          <Controller control={control} name="preferredName" render={({ field }) => (
            <Input label="Preferred Name" value={field.value} onChangeText={field.onChange}
              placeholder="Nickname (optional)" />
          )} />
          <Controller control={control} name="dob" render={({ field }) => (
            <DatePicker
              label="Date of Birth"
              required
              value={field.value ?? ''}
              onChange={field.onChange}
              error={errors.dob?.message}
              mode="date"
              maximumDate={new Date()}
              minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
            />
          )} />

          <Text className="text-sm font-sans-semibold text-text-primary mb-2">
            Gender <Text className="text-primary">*</Text>
          </Text>
          <Controller control={control} name="gender" render={({ field }) => (
            <View className="flex-row gap-3 mb-4">
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => field.onChange(g)}
                  className={`flex-1 py-3 rounded-xl items-center border-2 ${field.value === g ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'}`}
                >
                  <Text className={`text-sm font-sans-semibold capitalize ${field.value === g ? 'text-primary' : 'text-text-muted'}`}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )} />

          <Controller control={control} name="address" render={({ field }) => (
            <AddressAutocomplete
              label="Address"
              required
              value={field.value}
              onChangeText={field.onChange}
              error={errors.address?.message}
            />
          )} />

          <Text className="text-xs tracking-widest uppercase mt-4 mb-2" style={{ color: COLORS.textMuted }}>
            Health & Consent
          </Text>

          <View className="bg-white rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 mr-4">
                <Text className="font-sans-semibold text-text-primary">Has Allergies?</Text>
                <Text className="text-xs text-text-muted">Food, medication, or environmental</Text>
              </View>
              <Controller control={control} name="hasAllergies" render={({ field }) => (
                <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />
              )} />
            </View>
            {watch('hasAllergies') && (
              <Controller control={control} name="allergyNotes" render={({ field }) => (
                <Input label="Allergy Notes" value={field.value} onChangeText={field.onChange}
                  placeholder="Describe allergies and reactions…" multiline numberOfLines={3} />
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
            <PhotoConsentPolicyLink />
          </View>

          <Button
            label="Submit for Approval"
            onPress={handleSubmit(onSubmit)}
            loading={submitting || requestAdd.isPending}
            fullWidth
            size="lg"
          />
          <View className="h-10" />
          </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type LinkFormData = {
  displayId: string;
  verifyLastName: string;
  verifyDob: string;
};

function LinkExistingChild({ onDone }: { onDone: () => void }) {
  const linkChild = useLinkStudentByCode();
  const { control, handleSubmit, formState: { errors } } = useForm<LinkFormData>({
    resolver: zodResolver(linkChildSchema) as any,
    defaultValues: { displayId: '', verifyLastName: '', verifyDob: '' },
  });

  async function onSubmit(data: LinkFormData) {
    try {
      await linkChild.mutateAsync({
        displayId: data.displayId,
        verifyLastName: data.verifyLastName,
        verifyDob: data.verifyDob,
      });
      Alert.alert(
        'Linked!',
        'You are now linked to this child and can see their details.',
        [{ text: 'OK', onPress: onDone }],
      );
    } catch (e: unknown) {
      showFriendlyError("Couldn't link to this child", e, 'link-child');
    }
  }

  return (
    <View>
      <View className="bg-blue-50 rounded-2xl p-4 mb-4">
        <Text className="text-sm" style={{ color: COLORS.navy }}>
          Ask the other parent/guardian for the child's Student ID, then confirm with the
          child's last name and date of birth.
        </Text>
      </View>

      <Controller control={control} name="displayId" render={({ field }) => (
        <Input
          label="Student ID"
          required
          value={field.value}
          onChangeText={field.onChange}
          placeholder="e.g. SUN-00042"
          autoCapitalize="characters"
          error={errors.displayId?.message}
        />
      )} />
      <Controller control={control} name="verifyLastName" render={({ field }) => (
        <Input
          label="Child's Last Name"
          required
          value={field.value}
          onChangeText={field.onChange}
          placeholder="e.g. Perera"
          error={errors.verifyLastName?.message}
        />
      )} />
      <Controller control={control} name="verifyDob" render={({ field }) => (
        <DatePicker
          label="Child's Date of Birth"
          required
          value={field.value ?? ''}
          onChange={field.onChange}
          error={errors.verifyDob?.message}
          mode="date"
          maximumDate={new Date()}
          minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
        />
      )} />

      <View className="h-2" />
      <Button
        label="Link to Child"
        onPress={handleSubmit(onSubmit)}
        loading={linkChild.isPending}
        fullWidth
        size="lg"
      />
      <View className="h-10" />
    </View>
  );
}
