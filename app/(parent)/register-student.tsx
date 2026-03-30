import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useCreateStudent, useUpdateStudentPhoto, useMyStudents } from '@/hooks/useStudents';
import { useUploadStudentPhoto } from '@/hooks/useProfile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  registerStudentStep1Schema,
  registerStudentStep2Schema,
} from '@/utils/schemas';
import { calculateAge } from '@/utils/date';
import { COLORS } from '@/constants';

type Step1Data = { firstName: string; lastName: string; preferredName?: string; dob: string; gender: string };
type Step2Data = { hasAllergies: boolean; allergyNotes?: string; photoPublishConsent: boolean };

const STEP_LABELS = ['Child Details', 'Health & Consent', 'Photo'];

export default function RegisterStudentScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const createStudent = useCreateStudent();
  const uploadPhoto = useUploadStudentPhoto();
  const updateStudentPhoto = useUpdateStudentPhoto();

  const { data: existingStudents } = useMyStudents(profile?.id ?? '');

  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const form1DefaultValues: Step1Data = { firstName: '', lastName: '', preferredName: '', dob: '', gender: '' };
  const form2DefaultValues: Step2Data = { hasAllergies: false, allergyNotes: '', photoPublishConsent: false };

  const form1 = useForm<Step1Data>({ resolver: zodResolver(registerStudentStep1Schema), defaultValues: form1DefaultValues });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(registerStudentStep2Schema),
    defaultValues: form2DefaultValues,
  });

  useFocusEffect(
    useCallback(() => {
      // Reset every time screen gains focus so each visit starts clean
      setStep(0);
      setStep1Data(null);
      setStep2Data(null);
      setPhotoUri(null);
      form1.reset(form1DefaultValues);
      form2.reset(form2DefaultValues);
    }, [])
  );
  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      exif: false,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!profile || !step1Data || !step2Data) return;

    // Validate no duplicate name for this parent
    const duplicate = existingStudents?.find(
      (s) =>
        s.firstName.toLowerCase() === step1Data.firstName.toLowerCase() &&
        s.lastName.toLowerCase() === step1Data.lastName.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate', `A child named ${step1Data.firstName} ${step1Data.lastName} is already registered under your account.`);
      return;
    }

    // Validate age
    const age = calculateAge(step1Data.dob);
    if (age < 3 || age > 18) {
      Alert.alert('Age Error', 'Child must be between 3 and 18 years old.');
      return;
    }

    try {
      const result = await createStudent.mutateAsync({
        schoolId: profile.schoolId,
        parentId: profile.id,
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        preferredName: step1Data.preferredName,
        dob: step1Data.dob,
        gender: step1Data.gender,
        hasAllergies: step2Data.hasAllergies,
        allergyNotes: step2Data.allergyNotes,
        photoPublishConsent: step2Data.photoPublishConsent,
      });

      // Upload photo and save path to student record
      if (photoUri && result?.id) {
        const photoPath = await uploadPhoto.mutateAsync({ studentId: result.id, uri: photoUri });
        if (photoPath) {
          await updateStudentPhoto.mutateAsync({ studentId: result.id, photoPath });
        }
      }

      Alert.alert('Submitted!', 'Registration submitted. Awaiting admin approval.', [
        {
          text: 'OK',
          onPress: () => {
            setStep(0);
            setStep1Data(null);
            setStep2Data(null);
            setPhotoUri(null);
            form1.reset(form1DefaultValues);
            form2.reset(form2DefaultValues);
            router.back();
          },
        },
      ]);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit registration');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Register a Child" showBack />

      {/* Step indicator */}
      <View className="flex-row px-5 py-3 bg-white border-b border-gray-100">
        {STEP_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center mb-1 ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <Text className="text-white text-xs font-sans-semibold">{i + 1}</Text>
            </View>
            <Text className={`text-xs ${i <= step ? 'text-primary' : 'text-text-muted'}`}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">

          {/* STEP 1 */}
          {step === 0 && (
            <View>
              <Controller control={form1.control} name="firstName" render={({ field }) => (
                <Input label="First Name" required value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Sithumi" error={form1.formState.errors.firstName?.message} />
              )} />
              <Controller control={form1.control} name="lastName" render={({ field }) => (
                <Input label="Last Name" required value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Perera" error={form1.formState.errors.lastName?.message} />
              )} />
              <Controller control={form1.control} name="preferredName" render={({ field }) => (
                <Input label="Preferred Name" value={field.value} onChangeText={field.onChange} placeholder="Nickname (optional)" />
              )} />
              <Controller control={form1.control} name="dob" render={({ field }) => (
                <DatePicker
                  label="Date of Birth"
                  required
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={form1.formState.errors.dob?.message}
                  mode="date"
                  maximumDate={new Date()}
                  minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
                />
              )} />

              {/* Gender */}
              <Text className="text-sm font-sans-semibold text-text-primary mb-2">Gender <Text className="text-primary">*</Text></Text>
              <Controller control={form1.control} name="gender" render={({ field }) => (
                <View className="flex-row gap-3 mb-4">
                  {['male', 'female', 'other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => field.onChange(g)}
                      className={`flex-1 py-3 rounded-xl items-center border-2 ${field.value === g ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'}`}
                    >
                      <Text className={`text-sm font-sans-semibold capitalize ${field.value === g ? 'text-primary' : 'text-text-muted'}`}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )} />

              <Button label="Next →" onPress={form1.handleSubmit((d) => { setStep1Data(d); setStep(1); })} fullWidth />
            </View>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <View>
              <View className="bg-white rounded-2xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1 mr-4">
                    <Text className="font-sans-semibold text-text-primary">Has Allergies?</Text>
                    <Text className="text-xs text-text-muted">Food, medication, or environmental</Text>
                  </View>
                  <Controller control={form2.control} name="hasAllergies" render={({ field }) => (
                    <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />
                  )} />
                </View>
                {form2.watch('hasAllergies') && (
                  <Controller control={form2.control} name="allergyNotes" render={({ field }) => (
                    <Input label="Allergy Notes" value={field.value} onChangeText={field.onChange}
                      placeholder="Describe allergies and reactions…" multiline numberOfLines={3} />
                  )} />
                )}
              </View>

              <View className="bg-white rounded-2xl p-4 mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="font-sans-semibold text-text-primary">Photo Consent</Text>
                    <Text className="text-xs text-text-muted">Allow school to publish child's photo</Text>
                  </View>
                  <Controller control={form2.control} name="photoPublishConsent" render={({ field }) => (
                    <Switch value={field.value} onValueChange={field.onChange} trackColor={{ true: COLORS.primary }} />
                  )} />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1"><Button label="← Back" variant="outline" onPress={() => setStep(0)} fullWidth /></View>
                <View className="flex-1"><Button label="Next →" onPress={form2.handleSubmit((d) => { setStep2Data(d); setStep(2); })} fullWidth /></View>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <View>
              <Text className="text-sm text-text-muted mb-4">
                Upload a recent photo of your child (optional).
              </Text>
              <TouchableOpacity
                onPress={pickPhoto}
                className="bg-white rounded-2xl items-center justify-center mb-6 border-2 border-dashed border-gray-200"
                style={{ height: 200 }}
                activeOpacity={0.7}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <Text style={{ fontSize: 40 }}>📷</Text>
                    <Text className="text-text-muted text-sm mt-2">Tap to select photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <View className="flex-1"><Button label="← Back" variant="outline" onPress={() => setStep(1)} fullWidth /></View>
                <View className="flex-1">
                  <Button
                    label="Submit"
                    onPress={handleSubmit}
                    loading={createStudent.isPending || uploadPhoto.isPending || updateStudentPhoto.isPending}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          )}
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
