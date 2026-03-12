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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { TABLES, COLORS } from '@/constants';
import { roleSelectSchema } from '@/utils/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types';

type FormData = {
  role: UserRole;
  fullName: string;
  preferredName?: string;
  phone?: string;
  address?: string;
};

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'parent', label: 'Parent / Guardian', icon: '👨‍👩‍👧', desc: 'Register and track your child' },
  { value: 'teacher', label: 'Teacher', icon: '👩‍🏫', desc: 'Manage your class and attendance' },
  { value: 'admin', label: 'Administrator', icon: '⚙️', desc: 'Full school management access' },
];

export default function RoleSelectScreen() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(roleSelectSchema),
    defaultValues: { role: 'parent' },
  });

  const selectedRole = watch('role');

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
        phone: data.phone,
        address: data.address,
        role: data.role,
        status: data.role === 'admin' ? 'active' : 'pending',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-8 pb-6">
            <Text
              className="text-navy mb-1"
              style={{ fontSize: 26, fontFamily: 'DMSerifDisplay_400Regular' }}
            >
              Welcome 🙏
            </Text>
            <Text className="text-text-muted text-sm mb-8">
              Tell us who you are to get started.
            </Text>

            {/* Role selector */}
            <Text className="text-sm font-sans-semibold text-text-primary mb-3">I am a…</Text>
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
                        className={`rounded-xl p-4 flex-row items-center border-2 ${
                          active ? 'border-primary bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 28 }}>{r.icon}</Text>
                        <View className="ml-3 flex-1">
                          <Text className={`font-sans-semibold text-base ${active ? 'text-primary' : 'text-text-primary'}`}>
                            {r.label}
                          </Text>
                          <Text className="text-xs text-text-muted">{r.desc}</Text>
                        </View>
                        {active && (
                          <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                );
              })}
            </View>

            {/* Profile fields */}
            <Text className="text-sm font-sans-semibold text-text-primary mb-3">Your details</Text>

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
                <Input
                  label="Phone Number"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="+61 4XX XXX XXX"
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <Input
                  label="Address"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Street, Suburb, State"
                  multiline
                  numberOfLines={2}
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
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
