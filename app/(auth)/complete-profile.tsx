import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useUploadTeacherDocument } from '@/hooks/useTeacherDocs';
import { supabase } from '@/lib/supabase';
import { TABLES, COLORS } from '@/constants';
import { UserRole } from '@/types';
import { completeProfileSchema } from '@/utils/schemas';
import { showFriendlyError } from '@/utils/errors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { TeacherDocumentPicker } from '@/components/ui/TeacherDocuments';

type PickedFile = { uri: string; name: string };

type FormData = {
  fullName: string;
  preferredName?: string;
  phone: string;
  address: string;
};

export default function CompleteProfileScreen() {
  const { user, refreshProfile, resolveRoleForSignup } = useAuth();
  const uploadDoc = useUploadTeacherDocument();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [wwccFile, setWwccFile] = useState<PickedFile | null>(null);
  const [resumeFile, setResumeFile] = useState<PickedFile | null>(null);

  // Resolve the role up front (from the email whitelist) so teachers see the
  // document-upload fields during registration.
  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    Promise.resolve()
      .then(() => resolveRoleForSignup(email))
      .then(setRole)
      .catch(() => setRole(null));
  }, [user?.email]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { fullName: '', phone: '', address: '' },
  });

  const fullName = watch('fullName');
  const phone = watch('phone');
  const address = watch('address');
  const isFormValid = !!fullName?.trim() && fullName.length >= 2 && !!phone?.trim() && !!address?.trim();

  async function onSubmit(data: FormData) {
    if (!user?.email) return;
    setSaving(true);
    try {
      const resolvedRole = await resolveRoleForSignup(user.email);
      const { data: school } = await supabase.from(TABLES.SCHOOLS).select('id').limit(1).single();
      const { error } = await supabase.from(TABLES.USER_PROFILES).upsert({
        id: user.id,
        school_id: school?.id,
        full_name: data.fullName,
        preferred_name: data.preferredName,
        phone: `+61${data.phone}`,
        address: data.address,
        role: resolvedRole,
        // Teachers await principal approval (WWCC review); others are active.
        status: resolvedRole === 'teacher' ? 'pending' : 'active',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Upload any teacher documents now that the profile row exists.
      if (resolvedRole === 'teacher') {
        if (wwccFile) await uploadDoc.mutateAsync({ userId: user.id, uri: wwccFile.uri, kind: 'wwcc' });
        if (resumeFile) await uploadDoc.mutateAsync({ userId: user.id, uri: resumeFile.uri, kind: 'resume' });
      }

      await refreshProfile();
    } catch (e: unknown) {
      showFriendlyError("Couldn't save profile", e, 'complete-profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FAF6F0' }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', height: 220, backgroundColor: '#FAF6F0', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('../../assets/images/pagoda.png')}
              style={{ width: '100%', height: 220 }}
              resizeMode="contain"
            />
          </View>

          <View className="px-5 pt-4 pb-6">
            <Text className="text-center text-xs tracking-widest uppercase mb-2" style={{ color: '#8B7D6B' }}>
              Welcome
            </Text>
            <Text
              className="text-center mb-6"
              style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}
            >
              Tell us about yourself
            </Text>

            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <Input
                  label="Full Name"
                  required
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="e.g. Nimali Perera"
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="preferredName"
              render={({ field }) => (
                <Input
                  label="Preferred Name"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Nickname (optional)"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  required
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <AddressAutocomplete
                  label="Address"
                  required
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.address?.message}
                />
              )}
            />

            {role === 'teacher' && (
              <View className="mb-2">
                <Text className="text-xs tracking-widest uppercase mb-2" style={{ color: COLORS.textMuted }}>
                  Teacher Documents (optional)
                </Text>
                <Text className="text-xs text-text-muted mb-3">
                  Add your Working With Children Check and resume. The principal reviews these
                  before approving your account — you can also add or update them later in your profile.
                </Text>
                <TeacherDocumentPicker
                  label="Working With Children Check (WWCC)"
                  hint="PDF"
                  pickedName={wwccFile?.name}
                  onPick={setWwccFile}
                />
                <TeacherDocumentPicker
                  label="Resume"
                  hint="PDF"
                  pickedName={resumeFile?.name}
                  onPick={setResumeFile}
                />
              </View>
            )}

            <Text className="text-xs text-text-muted mb-4">
              Your role is determined automatically by your email.
            </Text>

            <Button
              label="Continue"
              onPress={handleSubmit(onSubmit)}
              loading={saving || uploadDoc.isPending}
              disabled={!isFormValid}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
