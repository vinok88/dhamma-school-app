import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMyClass } from '@/hooks/useClasses';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useTodayAttendance } from '@/hooks/useAttendance';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toIsoDate, lastSunday } from '@/utils/date';
import { COLORS } from '@/constants';

export default function TeacherHome() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const isPending = profile?.status !== 'active';
  const { data: myClass, isLoading: classLoading } = useMyClass(profile?.id ?? '');
  const { data: attendance } = useTodayAttendance(myClass?.id ?? '', lastSunday());
  const { data: announcements } = useAnnouncements(profile?.schoolId ?? '', myClass?.id);

  const presentCount = attendance?.filter((a) => a.status !== 'absent').length ?? 0;
  const totalCount = attendance?.length ?? 0;

  const displayName = profile?.preferredName ?? profile?.fullName?.split(' ')[0] ?? 'Teacher';

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-scaffold-bg">
        <View className="bg-scaffold-bg px-5 pt-4 pb-6">
          <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Awaiting Approval</Text>
          <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
            {displayName} 🙏
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 48 }}>⏳</Text>
          <Text className="text-text-primary text-lg font-sans-semibold mt-4 text-center">
            Awaiting Approval
          </Text>
          <Text className="text-text-muted text-sm mt-2 text-center">
            Your teacher account is pending approval from an administrator. You will be able to access all features once approved.
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ])}
            className="mt-8 px-6 py-3 rounded-xl bg-red-100"
          >
            <Text className="text-error font-sans-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Welcome back</Text>
            <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
              {displayName} 🙏
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="p-2">
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Class card */}
        {classLoading ? (
          <LoadingSpinner />
        ) : myClass ? (
          <Card className="mb-4" style={{ backgroundColor: COLORS.primary }}>
            <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Your Class</Text>
            <Text className="text-white text-xl font-sans-semibold">{myClass.name}</Text>
            <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{myClass.gradeLevel}</Text>
            <View className="flex-row mt-4 gap-4">
              <View className="flex-1 items-center py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Text className="text-white text-xl font-sans-semibold">{myClass.studentCount}</Text>
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Students</Text>
              </View>
              <View className="flex-1 items-center py-2 rounded-xl" style={{ backgroundColor: 'rgba(76,175,135,0.35)' }}>
                <Text className="text-white text-xl font-sans-semibold">{presentCount}</Text>
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Present</Text>
              </View>
              <View className="flex-1 items-center py-2 rounded-xl" style={{ backgroundColor: 'rgba(192,57,43,0.35)' }}>
                <Text className="text-white text-xl font-sans-semibold">{totalCount - presentCount}</Text>
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Absent</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card className="mb-4">
            <Text className="text-text-muted text-sm">You haven't been assigned to a class yet.</Text>
          </Card>
        )}

        {/* Quick actions */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => router.push('/(teacher)/attendance')}
            className="flex-1 bg-primary rounded-xl p-4 items-center"
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28 }}>✅</Text>
            <Text className="text-white font-sans-semibold text-sm mt-1">Take Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(teacher)/announce')}
            className="flex-1 rounded-xl p-4 items-center"
            style={{ backgroundColor: COLORS.gold }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28 }}>📢</Text>
            <Text className="text-brown font-sans-semibold text-sm mt-1">Send Notice</Text>
          </TouchableOpacity>
        </View>

        {/* Recent announcements */}
        <Text className="text-xs tracking-widest uppercase mb-3" style={{ color: '#8B7D6B' }}>Recent Announcements</Text>
        {announcements?.slice(0, 3).map((a) => <AnnouncementCard key={a.id} announcement={a} />)}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
