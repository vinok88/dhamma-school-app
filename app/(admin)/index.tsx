import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAllStudents } from '@/hooks/useStudents';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useAttendanceReport } from '@/hooks/useAttendance';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Card } from '@/components/ui/Card';
import { toIsoDate, lastNSundays } from '@/utils/date';
import { COLORS } from '@/constants';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';

  const { data: students } = useAllStudents(schoolId);
  const { data: teachers } = useTeachers(schoolId);
  const { data: classes } = useClasses(schoolId);
  const { data: events } = useUpcomingEvents(schoolId);
  const { data: announcements } = useAnnouncements(schoolId);

  const sundays = lastNSundays(4);
  const from = toIsoDate(sundays[3]);
  const to = toIsoDate(sundays[0]);
  const { data: attendanceReport } = useAttendanceReport(schoolId, '', from, to);

  // Build chart data for last 4 Sundays
  const chartData = sundays.reverse().map((d) => {
    const dateStr = toIsoDate(d);
    const dayRecords = (attendanceReport ?? []).filter((a) => a.sessionDate === dateStr);
    return dayRecords.filter((a) => a.status !== 'absent').length;
  });

  const activeStudents = students?.filter((s) => s.status === 'active').length ?? 0;
  const activeTeachers = teachers?.filter((t) => t.status === 'active').length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Admin Overview</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Dashboard 📊
        </Text>
        <Text className="text-sm" style={{ color: '#8B7D6B' }}>{APP_FULL_NAME}</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          <StatCard label="Active Students" value={activeStudents} icon="🎒" color={COLORS.primary} />
          <StatCard label="Teachers" value={activeTeachers} icon="👩‍🏫" color={COLORS.navy} />
          <StatCard label="Classes" value={classes?.length ?? 0} icon="🏫" color={COLORS.gold} />
          <StatCard label="Upcoming Events" value={events?.length ?? 0} icon="📅" color={COLORS.success} />
        </View>

        {/* Attendance chart */}
        <Card className="mb-4">
          <Text className="font-sans-semibold text-text-primary mb-3">Attendance — Last 4 Sundays</Text>
          {chartData.some((v) => v > 0) ? (
            <BarChart
              data={{
                labels: sundays.map((d) => toIsoDate(d).slice(5)),
                datasets: [{ data: chartData }],
              }}
              width={screenWidth - 64}
              height={160}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: () => COLORS.primary,
                labelColor: () => COLORS.textMuted,
              }}
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Text className="text-sm text-text-muted">No attendance data yet.</Text>
          )}
        </Card>

        {/* Quick nav */}
        <Text className="text-xs tracking-widest uppercase mb-3" style={{ color: '#8B7D6B' }}>Management</Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {[
            { label: 'Add Student', icon: '➕', route: '/(admin)/add-student' },
            { label: 'Add Teacher', icon: '📨', route: '/(admin)/add-teacher' },
            { label: 'Events', icon: '📅', route: '/(admin)/events' },
            { label: 'Announce', icon: '📢', route: '/(admin)/announce' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className="flex-1 bg-white rounded-xl p-3 items-center min-w-[80px]"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              <Text className="text-xs font-sans-semibold text-text-muted mt-1">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent announcements */}
        <Text className="text-xs tracking-widest uppercase mb-3" style={{ color: '#8B7D6B' }}>Recent Announcements</Text>
        {announcements?.slice(0, 3).map((a) => (
          <TouchableOpacity
            key={a.id}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(admin)/announcement-stats', params: { id: a.id, title: a.title } } as never)}
          >
            <AnnouncementCard announcement={a} />
          </TouchableOpacity>
        ))}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

// TODO: replace APP_FULL_NAME with import after constants are imported
const APP_FULL_NAME = 'Mahamevnawa Dhamma School – Melbourne';

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View
      className="flex-1 min-w-[44%] bg-white rounded-2xl p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text style={{ fontSize: 26 }}>{icon}</Text>
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </View>
      <Text className="text-2xl font-sans-semibold text-text-primary">{value}</Text>
      <Text className="text-xs text-text-muted">{label}</Text>
    </View>
  );
}
