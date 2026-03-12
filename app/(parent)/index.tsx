import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMyStudents } from '@/hooks/useStudents';
import { StudentCard } from '@/components/StudentCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';

export default function ParentHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: students, isLoading } = useMyStudents(profile?.id ?? '');

  const displayName = profile?.preferredName ?? profile?.fullName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      {/* Header */}
      <View className="bg-navy px-5 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-blue-200 text-sm">Good day,</Text>
            <Text
              className="text-white"
              style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular' }}
            >
              {displayName} 🙏
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="p-2">
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Register CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(parent)/register-student')}
          className="rounded-2xl p-4 mb-5 flex-row items-center"
          style={{ backgroundColor: COLORS.primary }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 32 }}>✏️</Text>
          <View className="ml-4 flex-1">
            <Text className="text-white font-sans-semibold text-base">Register a Child</Text>
            <Text className="text-red-100 text-sm">Enrol your child in the Dhamma school</Text>
          </View>
          <Text className="text-white text-xl">›</Text>
        </TouchableOpacity>

        {/* Children section */}
        <Text className="text-base font-sans-semibold text-text-primary mb-3">
          My Children
        </Text>

        {isLoading ? (
          <LoadingSpinner label="Loading students…" />
        ) : !students?.length ? (
          <EmptyState
            icon="👶"
            title="No children registered"
            subtitle="Tap 'Register a Child' above to get started"
          />
        ) : (
          students.map((s) => (
            <StudentCard key={s.id} student={s} routePrefix="/(parent)" />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
