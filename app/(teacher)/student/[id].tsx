import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStudentDetail } from '@/hooks/useStudents';
import { useStudentPhotoUrl } from '@/hooks/useProfile';
import { useStudentAttendanceHistory } from '@/hooks/useAttendance';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate, formatAge, formatDateShort, formatTime } from '@/utils/date';
import { ATTENDANCE_STATUS_CONFIG, COLORS } from '@/constants';

export default function StudentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student, isLoading } = useStudentDetail(id);
  const { data: history } = useStudentAttendanceHistory(id);
  const { data: signedPhotoUrl } = useStudentPhotoUrl(student?.photoUrl);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!student) return null;

  const presentCount = history?.filter((a) => a.status !== 'absent').length ?? 0;
  const totalCount = history?.length ?? 0;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Student Detail" showBack />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Card className="mb-4">
          <View className="flex-row items-center mb-4">
            {signedPhotoUrl ? (
              <Image source={{ uri: signedPhotoUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
            ) : (
              <View className="w-18 h-18 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.navy, width: 72, height: 72, borderRadius: 36 }}>
                <Text style={{ fontSize: 32 }}>🧒</Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-sans-semibold text-text-primary">
                {student.preferredName ?? student.firstName} {student.lastName}
              </Text>
              <Text className="text-sm text-text-muted">{formatAge(student.dob)}</Text>
              <Badge label="" type="student" status={student.status} />
            </View>
          </View>

          <View className="border-t border-gray-100 pt-3 gap-2">
            <Row label="DOB" value={formatDate(student.dob)} />
            <Row label="Gender" value={student.gender} />
            {student.hasAllergies && <Row label="Allergies" value={student.allergyNotes ?? 'Yes'} highlight />}
          </View>
        </Card>

        {/* Parent info */}
        <Card className="mb-4">
          <Text className="font-sans-semibold text-text-primary mb-2">Parents / Guardians</Text>
          {student.parents.length === 0 ? (
            <Row label="—" value="No parent linked" />
          ) : (
            student.parents.map((p, i) => (
              <View key={p.id} className={i > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
                <Row label="Name" value={p.parentName ?? '—'} />
                <Row label="Email" value={p.parentEmail} />
                <Row label="Phone" value={p.parentPhone ?? '—'} />
                {p.parentUserId ? (
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: `/messages/${p.parentUserId}`,
                      params: { name: p.parentName ?? p.parentEmail },
                    } as never)}
                    className="self-start mt-2 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: COLORS.primary }}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white text-xs font-sans-semibold">💬 Message Parent</Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-xs text-text-muted mt-1">
                    Hasn't signed up yet — messaging available once they log in.
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>

        {/* Attendance */}
        <Card className="mb-4">
          <Text className="font-sans-semibold text-text-primary mb-3">Attendance</Text>
          <View className="flex-row gap-3 mb-4">
            <StatBox value={`${presentCount}`} label="Present" bg="#D1FAE5" color="#4CAF87" />
            <StatBox value={`${totalCount - presentCount}`} label="Absent" bg="#FEE2E2" color="#C0392B" />
            <StatBox value={`${percentage}%`} label="Attendance %" bg="#FBF4C2" color="#614141" />
          </View>
          {history?.map((a) => {
            const cfg = ATTENDANCE_STATUS_CONFIG[a.status] ?? ATTENDANCE_STATUS_CONFIG.absent;
            return (
              <View key={a.id} className="flex-row items-start justify-between py-2 border-b border-gray-50">
                <View className="flex-1 mr-2">
                  <Text className="text-sm text-text-primary">{formatDateShort(a.sessionDate)}</Text>
                  {a.checkinTime ? (
                    <Text className="text-xs text-text-muted mt-0.5">
                      In · {formatTime(a.checkinTime)}
                      {a.checkoutTime ? `   ·   Out · ${formatTime(a.checkoutTime)}` : ''}
                    </Text>
                  ) : null}
                </View>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg }}>
                  <Text style={{ color: cfg.color, fontSize: 11 }}>{cfg.label}</Text>
                </View>
              </View>
            );
          })}
        </Card>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className={`text-sm font-sans-medium ${highlight ? 'text-error' : 'text-text-primary'}`}>{value}</Text>
    </View>
  );
}

function StatBox({ value, label, bg, color }: { value: string; label: string; bg: string; color: string }) {
  return (
    <View className="flex-1 items-center py-3 rounded-xl" style={{ backgroundColor: bg }}>
      <Text className="text-xl font-sans-semibold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-text-muted">{label}</Text>
    </View>
  );
}
