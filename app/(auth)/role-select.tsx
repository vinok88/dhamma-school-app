import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
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
import { roleSelectSchema } from '@/utils/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { UserRole } from '@/types';

type FormData = {
  role: UserRole;
  fullName: string;
  preferredName?: string;
  phone: string;
  address: string;
};

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'parent', label: 'Parent / Guardian', icon: '👨‍👩‍👧', desc: 'Register and track your child' },
  { value: 'teacher', label: 'Teacher', icon: '👩‍🏫', desc: 'Manage your class and attendance' },
];

export default function RoleSelectScreen() {
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(roleSelectSchema),
    defaultValues: { role: 'parent', fullName: '', phone: '', address: '' },
  });

  const selectedRole = watch('role');
  const fullName = watch('fullName');
  const phone = watch('phone');
  const address = watch('address');
  const isFormValid = !!fullName?.trim() && fullName.length >= 2 && !!phone?.trim() && !!address?.trim();

  async function onSubmit(data: FormData) {
    if (!user) return;
    setSaving(true);
    try {
      // Get default school_id
      const { data: school } = await supabase.from(TABLES.SCHOOLS).select('id').limit(1).single();
      const { error } = await supabase.from(TABLES.USER_PROFILES).upsert({
        id: user.id,
        school_id: school?.id,
        full_name: data.fullName,
        preferred_name: data.preferredName,
        phone: `+61${data.phone}`,
        address: data.address,
        role: data.role,
        status: 'pending',
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
          {/* Temple illustration */}
          <View style={{ width: '100%', height: 260, backgroundColor: '#FAF6F0', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('../../assets/images/pagoda.png')}
              style={{ width: '100%', height: 260 }}
              resizeMode="contain"
            />
          </View>
          <View className="px-5 pt-4 pb-6">
            <Text className="text-center text-xs tracking-widest uppercase mb-6" style={{ color: '#8B7D6B' }}>
              Please choose your role
            </Text>

            {/* Role selector */}
            <View className="mb-6 gap-3">
              {ROLES.map((r) => {
                const active = selectedRole === r.value;
                return (
                  <Controller
                    key={r.value}
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <TouchableOpacity
                        onPress={() => field.onChange(r.value)}
                        className="rounded-xl p-4 flex-row items-center bg-white"
                        style={{
                          borderWidth: 1,
                          borderColor: active ? COLORS.primary : '#EDE8E0',
                          borderLeftWidth: 4,
                          borderLeftColor: active ? COLORS.primary : '#EDE8E0',
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: active ? '#FDF3E7' : '#F5EFE6' }}
                        >
                          <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-sans-semibold text-base" style={{ color: active ? COLORS.primary : '#1C1C1E' }}>
                            {r.label}
                          </Text>
                          <Text className="text-xs" style={{ color: '#8B7D6B' }}>{r.desc}</Text>
                        </View>
                        <Text style={{ color: '#8B7D6B', fontSize: 18 }}>›</Text>
                      </TouchableOpacity>
                    )}
                  />
                );
              })}
            </View>

            {/* Profile fields */}
            <Text className="text-sm font-sans-semibold mb-3" style={{ color: '#1C1C1E' }}>Your details</Text>

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

            {selectedRole === 'teacher' && (
              <View className="bg-gold/10 rounded-xl p-3 mb-4">
                <Text className="text-sm text-brown">
                  🔔 Teacher accounts require admin approval before access is granted.
                </Text>
              </View>
            )}

            <Button
              label="Create Profile"
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
