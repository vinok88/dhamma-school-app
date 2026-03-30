import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMyStudents } from '@/hooks/useStudents';
import { useNotifications } from '@/hooks/useNotifications';
import { StudentCard } from '@/components/StudentCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS } from '@/constants';

export default function ParentHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: students, isLoading } = useMyStudents(profile?.id ?? '');
  const { data: notifications } = useNotifications(profile?.id ?? '');
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const bellAnim = useRef(new Animated.Value(0)).current;
  const prevUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      // Shake animation when new notifications arrive
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const displayName = profile?.preferredName ?? profile?.fullName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      {/* Header — cream background */}
      <View className="bg-scaffold-bg px-5 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: COLORS.textMuted }}>
              Good Morning
            </Text>
            <Text
              style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}
            >
              {displayName} 🙏
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="p-2">
            <Animated.View style={{ transform: [{ translateX: bellAnim }] }}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'WorkSans_600SemiBold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
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
            <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Enrol your child in the Dhamma school
            </Text>
          </View>
          <Text className="text-white text-xl">›</Text>
        </TouchableOpacity>

        {/* Children section */}
        <Text className="text-xs tracking-widest uppercase mb-3" style={{ color: COLORS.textMuted }}>
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
