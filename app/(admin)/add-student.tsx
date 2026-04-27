import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useCreateStudent } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePicker } from '@/components/ui/DatePicker';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { addStudentSchema } from '@/utils/schemas';
import { calculateAge } from '@/utils/date';
import { COLORS } from '@/constants';

type FormData = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  classId: string;
  hasAllergies: boolean;
  allergyNotes?: string;
  photoPublishConsent: boolean;
  parents: { email: string; name?: string; phone?: string }[];
};

export default function AddStudentScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const createStudent = useCreateStudent();
  const { data: classes, isLoading: classesLoading } = useClasses(profile?.schoolId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(addStudentSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      dob: '',
      gender: 'male',
      address: '',
      classId: '',
      hasAllergies: false,
      allergyNotes: '',
      photoPublishConsent: false,
      parents: [{ email: '', name: '', phone: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'parents' });

  async function onSubmit(data: FormData) {
    if (!profile) return;
    const age = calculateAge(data.dob);
    if (age < 3 || age > 18) {
      Alert.alert('Age Error', 'Child must be between 3 and 18 years old.');
      return;
    }
    // Normalise emails and prefix phones with +61
    const cleanParents = data.parents
      .map((p) => ({
        email: p.email.trim(),
        name: p.name?.trim(),
        phone: p.phone ? `+61${p.phone}` : undefined,
      }))
      .filter((p) => p.email.length > 0);
    if (!cleanParents.length) {
      Alert.alert('Parent/Guardian required', 'Please add at least one Parent/Guardian.');
      return;
    }

    setSubmitting(true);
    try {
      await createStudent.mutateAsync({
        schoolId: profile.schoolId,
        classId: data.classId,
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
        hasAllergies: data.hasAllergies,
        allergyNotes: data.allergyNotes,
        photoPublishConsent: data.photoPublishConsent,
        parents: cleanParents,
      });
      Alert.alert('Added!', 'Student has been added successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : (e as { message?: string; details?: string; hint?: string })?.message
            ?? JSON.stringify(e);
      Alert.alert('Error', msg || 'Could not add student');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Add Student" showBack dark />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
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

          <Text className="text-sm font-sans-semibold text-text-primary mb-2">
            Class <Text className="text-primary">*</Text>
          </Text>
          {classesLoading ? (
            <Text className="text-xs text-text-muted mb-4">Loading classes…</Text>
          ) : !classes?.length ? (
            <View className="bg-yellow-50 rounded-xl p-3 mb-4">
              <Text className="text-xs" style={{ color: COLORS.brown }}>
                No classes exist yet. Create a class first from the Classes tab.
              </Text>
            </View>
          ) : (
            <Controller control={control} name="classId" render={({ field }) => (
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-2">
                  {classes.map((c) => {
                    const active = field.value === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => field.onChange(c.id)}
                        className={`px-3 py-2 rounded-xl border-2 ${active ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'}`}
                      >
                        <Text className={`text-sm font-sans-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
                          {c.name}
                        </Text>
                        {!!c.gradeLevel && (
                          <Text className={`text-xs ${active ? 'text-primary' : 'text-text-muted'}`}>
                            {c.gradeLevel}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.classId && (
                  <Text className="text-error text-xs mt-1">{errors.classId.message}</Text>
                )}
              </View>
            )} />
          )}

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

          <View className="bg-white rounded-2xl p-4 mb-4">
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

          <Text className="text-xs tracking-widest uppercase mt-2 mb-2" style={{ color: COLORS.textMuted }}>
            Parents/Guardians ({fields.length})
          </Text>
          <Text className="text-xs text-text-muted mb-3">
            At least one Parent/Guardian is required. They sign up with the same email to be linked.
          </Text>

          {fields.map((f, idx) => (
            <View key={f.id} className="bg-white rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-sans-semibold text-text-primary">Parent/Guardian {idx + 1}</Text>
                {fields.length > 1 && (
                  <TouchableOpacity onPress={() => remove(idx)}>
                    <Text className="text-error text-xs">Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Controller
                control={control}
                name={`parents.${idx}.name` as const}
                render={({ field }) => (
                  <Input
                    label="Parent/Guardian Name"
                    required
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Full name"
                    error={errors.parents?.[idx]?.name?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name={`parents.${idx}.email` as const}
                render={({ field }) => (
                  <Input
                    label="Email"
                    required
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="parent@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.parents?.[idx]?.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name={`parents.${idx}.phone` as const}
                render={({ field }) => (
                  <View className="mb-4">
                    <Text className="text-sm font-sans-semibold text-text-primary mb-1">
                      Phone Number<Text className="text-primary"> *</Text>
                    </Text>
                    <View className={`flex-row items-center bg-white border rounded-xl ${errors.parents?.[idx]?.phone ? 'border-error' : 'border-gray-200'}`}>
                      <View className="bg-gray-100 px-3 py-3 rounded-l-xl border-r border-gray-200">
                        <Text className="text-base text-text-primary">+61</Text>
                      </View>
                      <TextInput
                        className="flex-1 px-3 py-3 text-base text-text-primary"
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder="4XX XXX XXX"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.parents?.[idx]?.phone && (
                      <Text className="text-error text-xs mt-1">{errors.parents[idx]?.phone?.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>
          ))}

          <Button
            label="+ Add another Parent/Guardian"
            variant="outline"
            onPress={() => append({ email: '', name: '', phone: '' })}
            fullWidth
          />

          <View className="h-4" />
          <Button
            label="Add Student"
            onPress={handleSubmit(onSubmit)}
            loading={submitting || createStudent.isPending}
            fullWidth
            size="lg"
          />
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
