import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/hooks/useClasses';
import { useAttendanceReport } from '@/hooks/useAttendance';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { toIsoDate, lastNSundays } from '@/utils/date';

type ReportType = 'weekly' | 'monthly';

export default function ReportsScreen() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const { data: classes } = useClasses(schoolId);
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  const sundays = lastNSundays(reportType === 'weekly' ? 4 : 16);
  const from = toIsoDate(sundays[sundays.length - 1]);
  const to = toIsoDate(sundays[0]);

  const { data: records, isLoading, refetch } = useAttendanceReport(
    loaded ? schoolId : '',
    selectedClassId,
    from,
    to
  );

  // Aggregate by student
  const studentMap: Record<string, { name: string; present: number; absent: number }> = {};
  (records ?? []).forEach((r) => {
    const key = r.studentId;
    if (!studentMap[key]) {
      studentMap[key] = {
        name: `${r.studentFirstName ?? ''} ${r.studentLastName ?? ''}`.trim(),
        present: 0,
        absent: 0,
      };
    }
    if (r.status === 'absent') studentMap[key].absent++;
    else studentMap[key].present++;
  });

  const rows = Object.entries(studentMap).map(([, v]) => ({
    name: v.name,
    present: v.present,
    absent: v.absent,
    total: v.present + v.absent,
    percentage: v.present + v.absent > 0 ? Math.round((v.present / (v.present + v.absent)) * 100) : 0,
  })).sort((a, b) => b.percentage - a.percentage);

  function exportCSV() {
    const header = 'Name,Present,Absent,Total,Percentage\n';
    const csv = rows.map((r) => `${r.name},${r.present},${r.absent},${r.total},${r.percentage}%`).join('\n');
    Share.share({ message: header + csv, title: 'Attendance Report' });
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Attendance Reports 📋" showBack dark />

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Report type */}
        <View className="flex-row gap-3 mb-4">
          {(['weekly', 'monthly'] as ReportType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => { setReportType(t); setLoaded(false); }}
              className={`flex-1 py-3 rounded-xl items-center ${reportType === t ? 'bg-primary' : 'bg-white'}`}
            >
              <Text className={`font-sans-semibold text-sm capitalize ${reportType === t ? 'text-white' : 'text-text-muted'}`}>{t}</Text>
              <Text className={`text-xs ${reportType === t ? 'text-red-200' : 'text-text-muted'}`}>
                {reportType === t ? (t === 'weekly' ? 'Last 4 Sundays' : 'Last 16 Sundays') : t === 'weekly' ? 'Last 4' : 'Last 16'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Class filter */}
        <Text className="text-sm font-sans-semibold text-text-primary mb-2">Class (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSelectedClassId('')}
              className={`px-3 py-1.5 rounded-full border ${!selectedClassId ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-xs font-sans-semibold ${!selectedClassId ? 'text-white' : 'text-text-muted'}`}>All Classes</Text>
            </TouchableOpacity>
            {(classes ?? []).map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedClassId(c.id)}
                className={`px-3 py-1.5 rounded-full border ${selectedClassId === c.id ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-xs font-sans-semibold ${selectedClassId === c.id ? 'text-white' : 'text-text-muted'}`}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="mb-4">
          <Button label="Load Report" onPress={() => { setLoaded(true); refetch(); }} fullWidth />
        </View>

        {isLoading && loaded && <LoadingSpinner label="Generating report…" />}

        {loaded && !isLoading && !rows.length && (
          <EmptyState icon="📋" title="No data" subtitle="No attendance records found for this period" />
        )}

        {rows.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-sans-semibold text-text-primary">{rows.length} students</Text>
              <TouchableOpacity onPress={exportCSV} className="bg-navy rounded-lg px-3 py-1.5">
                <Text className="text-white text-xs font-sans-semibold">Export CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Table header */}
            <View className="bg-navy rounded-t-xl px-3 py-2 flex-row">
              <Text className="flex-1 text-white text-xs font-sans-semibold">Student</Text>
              <Text className="w-12 text-white text-xs font-sans-semibold text-center">Pres.</Text>
              <Text className="w-12 text-white text-xs font-sans-semibold text-center">Abs.</Text>
              <Text className="w-20 text-white text-xs font-sans-semibold text-center">Attendance %</Text>
            </View>
            {rows.map((r, i) => (
              <View
                key={r.name + i}
                className={`px-3 py-3 flex-row items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${i === rows.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                <Text className="flex-1 text-sm text-text-primary" numberOfLines={1}>{r.name}</Text>
                <Text className="w-12 text-sm text-success text-center">{r.present}</Text>
                <Text className="w-12 text-sm text-error text-center">{r.absent}</Text>
                <Text className={`w-20 text-sm font-sans-semibold text-center ${r.percentage >= 80 ? 'text-success' : r.percentage >= 60 ? 'text-pending' : 'text-error'}`}>
                  {r.percentage}%
                </Text>
              </View>
            ))}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
