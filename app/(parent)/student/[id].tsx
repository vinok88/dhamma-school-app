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
import { studentDisplayName } from '@/utils/display';

export default function StudentStatusScreen() {
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
      <ScreenHeader title="Student Status" showBack />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

        {/* Edit CTA */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(parent)/student-edit', params: { id: student.id } })}
          className="self-end mb-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: COLORS.primary }}
          activeOpacity={0.8}
        >
          <Text className="text-white text-xs font-sans-semibold">✏️  Edit profile</Text>
        </TouchableOpacity>

        {/* Profile card */}
        <Card className="mb-4">
          <View className="flex-row items-center mb-4">
            {signedPhotoUrl ? (
              <Image
                source={{ uri: signedPhotoUrl }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.navy }}
              >
                <Text style={{ fontSize: 36 }}>👧</Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text
                className="text-text-primary"
                style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}
              >
                {studentDisplayName(student)}
              </Text>
              <Text className="text-text-muted text-sm">{formatAge(student.dob)}</Text>
              <View className="mt-2">
                <Badge label="" type="student" status={student.status} />
              </View>
            </View>
          </View>

          <View className="border-t border-gray-100 pt-4 gap-2">
            <Row label="Full Name" value={`${student.firstName} ${student.lastName}`} />
            <Row label="Date of Birth" value={formatDate(student.dob)} />
            <Row label="Gender" value={student.gender} />
            <Row label="Class" value={student.className ?? 'Not assigned'} />
            {student.classTeachers.length > 0 && (
              <Row
                label={student.classTeachers.length > 1 ? 'Teachers' : 'Teacher'}
                value={student.classTeachers.map((t) => t.name).filter(Boolean).join(', ')}
              />
            )}
            {student.hasAllergies && (
              <Row label="Allergies" value={student.allergyNotes ?? 'Yes (no notes)'} highlight />
            )}
          </View>

          {student.classTeachers.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {student.classTeachers.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push({
                    pathname: `/messages/${t.id}`,
                    params: { name: t.name || 'Teacher' },
                  } as never)}
                  className="rounded-full px-3 py-1.5"
                  style={{ backgroundColor: COLORS.primary }}
                  activeOpacity={0.85}
                >
                  <Text className="text-white text-xs font-sans-semibold">
                    💬 Message {t.name || 'Teacher'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Status note */}
        {student.statusNote && (
          <Card className="mb-4 bg-yellow-50 border border-yellow-200">
            <Text className="text-xs font-sans-semibold text-yellow-800 mb-1">Admin Note</Text>
            <Text className="text-sm text-yellow-900">{student.statusNote}</Text>
          </Card>
        )}

        {/* Attendance summary */}
        <Card className="mb-4">
          <Text className="font-sans-semibold text-text-primary mb-3">Attendance (last 8 sessions)</Text>
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 items-center py-3 bg-green-50 rounded-xl">
              <Text className="text-2xl font-sans-semibold text-success">{presentCount}</Text>
              <Text className="text-xs text-text-muted">Present</Text>
            </View>
            <View className="flex-1 items-center py-3 bg-red-50 rounded-xl">
              <Text className="text-2xl font-sans-semibold text-error">{totalCount - presentCount}</Text>
              <Text className="text-xs text-text-muted">Absent</Text>
            </View>
            <View className="flex-1 items-center py-3 rounded-xl" style={{ backgroundColor: COLORS.cream }}>
              <Text className="text-2xl font-sans-semibold text-brown">{percentage}%</Text>
              <Text className="text-xs text-text-muted">Attendance %</Text>
            </View>
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
    <View className="flex-row justify-between">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className={`text-sm font-sans-medium ${highlight ? 'text-error' : 'text-text-primary'}`}>{value}</Text>
    </View>
  );
}
