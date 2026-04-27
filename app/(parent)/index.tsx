import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
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
  const { profile, refreshMyRole } = useAuth();
  const { data: students, isLoading, refetch: refetchStudents } = useMyStudents(profile?.id ?? '');
  const { data: notifications } = useNotifications(profile?.id ?? '');
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const [refreshingRole, setRefreshingRole] = useState(false);

  const bellAnim = useRef(new Animated.Value(0)).current;
  const prevUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
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

  async function handleRefresh() {
    setRefreshingRole(true);
    try {
      await refreshMyRole();
      await refetchStudents();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not refresh');
    } finally {
      setRefreshingRole(false);
    }
  }

  const displayName = profile?.preferredName ?? profile?.fullName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
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
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleRefresh}
              className="p-2 mr-1"
              disabled={refreshingRole}
              accessibilityLabel="Refresh"
            >
              <Text style={{ fontSize: 20, opacity: refreshingRole ? 0.4 : 1 }}>🔄</Text>
            </TouchableOpacity>
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
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xs tracking-widest uppercase mb-3" style={{ color: COLORS.textMuted }}>
          My Children
        </Text>

        {isLoading ? (
          <LoadingSpinner label="Loading students…" />
        ) : !students?.length ? (
          <EmptyState
            icon="👶"
            title="No children linked yet"
            subtitle="If your child is enrolled, ask the school to add your email to their record, then tap the refresh icon above."
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
