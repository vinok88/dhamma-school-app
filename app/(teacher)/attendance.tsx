import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useMyClass } from '@/hooks/useClasses';
import { useClassStudents } from '@/hooks/useStudents';
import { useTodayAttendance, useCheckIn, useCheckOut, useMarkAbsent } from '@/hooks/useAttendance';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toIsoDate, lastSunday, formatDate } from '@/utils/date';
import { COLORS, ATTENDANCE_STATUS_CONFIG } from '@/constants';
import { AttendanceModel } from '@/types';

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const [sessionDate] = useState<Date>(lastSunday());
  const sessionDateStr = toIsoDate(sessionDate);

  const { data: myClass } = useMyClass(profile?.id ?? '');
  const { data: students, isLoading: studentsLoading } = useClassStudents(myClass?.id ?? '');
  const { data: attendance, isLoading: attendanceLoading } = useTodayAttendance(myClass?.id ?? '', sessionDate);

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const markAbsent = useMarkAbsent();

  const isLoading = studentsLoading || attendanceLoading;

  function getRecord(studentId: string): AttendanceModel | undefined {
    return attendance?.find((a) => a.studentId === studentId);
  }

  const presentCount = attendance?.filter((a) => a.status !== 'absent').length ?? 0;

  async function handleCheckIn(studentId: string) {
    if (!profile || !myClass) return;
    try {
      await checkIn.mutateAsync({
        schoolId: profile.schoolId,
        studentId,
        teacherId: profile.id,
        classId: myClass.id,
        sessionDate: sessionDateStr,
      });
    } catch {
      Alert.alert('Error', 'Could not check in student');
    }
  }

  async function handleCheckOut(attendanceId: string) {
    if (!myClass) return;
    await checkOut.mutateAsync({ attendanceId, classId: myClass.id });
  }

  async function handleAbsent(studentId: string) {
    if (!profile || !myClass) return;
    await markAbsent.mutateAsync({
      schoolId: profile.schoolId,
      studentId,
      teacherId: profile.id,
      classId: myClass.id,
      sessionDate: sessionDateStr,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      {/* Header */}
      <View className="bg-navy px-5 pt-4 pb-5">
        <Text className="text-white" style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}>
          Attendance ✅
        </Text>
        <Text className="text-blue-200 text-sm mt-1">
          {myClass?.name} · {formatDate(sessionDateStr)}
        </Text>
        <View className="flex-row mt-3 gap-4">
          <View className="bg-white/10 rounded-xl px-4 py-2 items-center">
            <Text className="text-white font-sans-semibold text-lg">{presentCount}</Text>
            <Text className="text-blue-200 text-xs">Present</Text>
          </View>
          <View className="bg-white/10 rounded-xl px-4 py-2 items-center">
            <Text className="text-white font-sans-semibold text-lg">{(students?.length ?? 0) - presentCount}</Text>
            <Text className="text-blue-200 text-xs">Absent</Text>
          </View>
          <View className="bg-white/10 rounded-xl px-4 py-2 items-center">
            <Text className="text-white font-sans-semibold text-lg">{students?.length ?? 0}</Text>
            <Text className="text-blue-200 text-xs">Total</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen label="Loading class…" />
      ) : !students?.length ? (
        <EmptyState icon="👥" title="No students" subtitle="No active students in your class" />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: student }) => {
            const record = getRecord(student.id);
            const status = record?.status;
            const cfg = status ? ATTENDANCE_STATUS_CONFIG[status] : null;

            return (
              <View
                className="bg-white rounded-2xl p-4 flex-row items-center"
                style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              >
                <Avatar uri={student.photoUrl} name={`${student.firstName} ${student.lastName}`} size={48} />
                <View className="flex-1 ml-3">
                  <Text className="font-sans-semibold text-text-primary">
                    {student.preferredName ?? student.firstName} {student.lastName}
                  </Text>
                  {cfg ? (
                    <View className="mt-1 px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: cfg.bg }}>
                      <Text style={{ color: cfg.color, fontSize: 11 }}>{cfg.label}</Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-text-muted mt-1">Not recorded</Text>
                  )}
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-2">
                  {(!status || status === 'absent') && (
                    <TouchableOpacity
                      onPress={() => handleCheckIn(student.id)}
                      className="bg-success rounded-xl px-3 py-2"
                      activeOpacity={0.8}
                    >
                      <Text className="text-white text-xs font-sans-semibold">Check In</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'checked_in' && (
                    <TouchableOpacity
                      onPress={() => handleCheckOut(record!.id)}
                      className="rounded-xl px-3 py-2"
                      style={{ backgroundColor: '#8B5CF6' }}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white text-xs font-sans-semibold">Check Out</Text>
                    </TouchableOpacity>
                  )}
                  {!status && (
                    <TouchableOpacity
                      onPress={() => handleAbsent(student.id)}
                      className="bg-red-100 rounded-xl px-3 py-2"
                      activeOpacity={0.8}
                    >
                      <Text className="text-error text-xs font-sans-semibold">Absent</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
