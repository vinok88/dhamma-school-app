import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AttendanceModel, AttendanceStatus } from '@/types';
import { TABLES } from '@/constants';
import { toIsoDate } from '@/utils/date';

function mapAttendance(d: Record<string, unknown>): AttendanceModel {
  const student = d.students as Record<string, unknown> | null;
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    studentId: d.student_id as string,
    teacherId: d.teacher_id as string,
    classId: d.class_id as string,
    sessionDate: d.session_date as string,
    checkinTime: d.checkin_time as string | undefined,
    checkoutTime: d.checkout_time as string | undefined,
    status: d.status as AttendanceStatus,
    createdAt: d.created_at as string,
    studentFirstName: student?.first_name as string | undefined,
    studentLastName: student?.last_name as string | undefined,
    studentPhotoUrl: student?.photo_url as string | undefined,
  };
}

export function useTodayAttendance(classId: string, sessionDate?: Date) {
  const date = toIsoDate(sessionDate ?? new Date());
  return useQuery({
    queryKey: ['attendance', 'today', classId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('*, students(first_name, last_name, photo_url)')
        .eq('class_id', classId)
        .eq('session_date', date);
      if (error) throw error;
      return (data ?? []).map(mapAttendance);
    },
    enabled: !!classId,
  });
}

export function useStudentAttendanceHistory(studentId: string, limit = 8) {
  return useQuery({
    queryKey: ['attendance', 'history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('*')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapAttendance);
    },
    enabled: !!studentId,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      studentId,
      teacherId,
      classId,
      sessionDate,
    }: {
      schoolId: string;
      studentId: string;
      teacherId: string;
      classId: string;
      sessionDate: string;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from(TABLES.ATTENDANCE_RECORDS).upsert(
        {
          school_id: schoolId,
          student_id: studentId,
          teacher_id: teacherId,
          class_id: classId,
          session_date: sessionDate,
          checkin_time: now,
          status: 'checked_in',
        },
        { onConflict: 'student_id,session_date' }
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['attendance', 'today', vars.classId] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      attendanceId,
      classId,
    }: {
      attendanceId: string;
      classId: string;
    }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .update({ checkout_time: now, status: 'checked_out' })
        .eq('id', attendanceId);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['attendance', 'today', vars.classId] }),
  });
}

export function useMarkAbsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      studentId,
      teacherId,
      classId,
      sessionDate,
    }: {
      schoolId: string;
      studentId: string;
      teacherId: string;
      classId: string;
      sessionDate: string;
    }) => {
      const { error } = await supabase.from(TABLES.ATTENDANCE_RECORDS).upsert(
        {
          school_id: schoolId,
          student_id: studentId,
          teacher_id: teacherId,
          class_id: classId,
          session_date: sessionDate,
          status: 'absent',
        },
        { onConflict: 'student_id,session_date' }
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['attendance', 'today', vars.classId] }),
  });
}

export function useAttendanceReport(schoolId: string, classId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['attendance', 'report', schoolId, classId, from, to],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('*, students(first_name, last_name)')
        .eq('school_id', schoolId)
        .gte('session_date', from)
        .lte('session_date', to)
        .order('session_date', { ascending: false });
      if (classId) query = query.eq('class_id', classId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapAttendance);
    },
    enabled: !!(schoolId && from && to),
  });
}
