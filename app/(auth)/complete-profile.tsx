import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { supabase } from '@/lib/supabase';
import { TABLES, COLORS } from '@/constants';
import { completeProfileSchema } from '@/utils/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

type FormData = {
  fullName: string;
  preferredName?: string;
  phone: string;
  address: string;
};

export default function CompleteProfileScreen() {
  const { user, refreshProfile, resolveRoleForSignup } = useAuth();
  const [saving, setSaving] = useState(false);

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
      const role = await resolveRoleForSignup(user.email);
      const { data: school } = await supabase.from(TABLES.SCHOOLS).select('id').limit(1).single();
      const { error } = await supabase.from(TABLES.USER_PROFILES).upsert({
        id: user.id,
        school_id: school?.id,
        full_name: data.fullName,
        preferred_name: data.preferredName,
        phone: `+61${data.phone}`,
        address: data.address,
        role,
        status: 'active',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      await refreshProfile();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save profile');
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
                <View className="mb-4">
                  <Text className="text-sm font-sans-semibold text-text-primary mb-1">
                    Phone Number<Text className="text-primary"> *</Text>
                  </Text>
                  <View className={`flex-row items-center bg-white border rounded-xl ${errors.phone ? 'border-error' : 'border-gray-200'}`}>
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
                  {errors.phone && <Text className="text-error text-xs mt-1">{errors.phone.message}</Text>}
                </View>
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

            <Text className="text-xs text-text-muted mb-4">
              Your role is determined automatically by your email.
            </Text>

            <Button
              label="Continue"
              onPress={handleSubmit(onSubmit)}
              loading={saving}
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
