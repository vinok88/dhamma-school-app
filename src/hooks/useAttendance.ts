import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AttendanceModel, AttendanceStatus } from '@/types';
import { TABLES } from '@/constants';
import { toIsoDate } from '@/utils/date';
import {
  computeAttendanceReport,
  computePresentCountsByDate,
  computeStudentHistory,
  type AttendanceReportRow,
} from '@/utils/attendance';

export type { AttendanceReportRow };

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

/**
 * A student's recent attendance with *derived* absence (mirrors the report
 * logic): for each of the class's most recent active sessions (a date with >=1
 * check-in), the student is shown present if they were checked in, otherwise
 * absent — even when no record exists. Holidays (no check-ins) never appear.
 * Falls back to the student's raw records when `classId` is unknown.
 */
export function useStudentAttendanceHistory(studentId: string, classId?: string, limit = 8) {
  return useQuery<AttendanceModel[]>({
    queryKey: ['attendance', 'history', studentId, classId ?? '', limit],
    queryFn: async () => {
      // The student's own records.
      const { data: ownRecs, error: ownErr } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('*')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false });
      if (ownErr) throw ownErr;
      const own = (ownRecs ?? []).map(mapAttendance);

      // Without the class we can't tell which sessions actually ran.
      if (!classId) return own.slice(0, limit);

      const { data: clsRecs, error: clsErr } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('session_date, status')
        .eq('class_id', classId);
      if (clsErr) throw clsErr;

      return computeStudentHistory(
        own,
        (clsRecs ?? []).map((r) => ({
          sessionDate: r.session_date as string,
          status: r.status as AttendanceStatus,
        })),
        studentId,
        classId,
        limit,
      );
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

// Remove the attendance record entirely — used to undo a mistakenly entered
// check-in for the day so the teacher can re-record from a clean state.
export function useUndoCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attendanceId, classId: _classId }: { attendanceId: string; classId: string }) => {
      // Use .select() so Supabase returns the deleted rows and we can detect
      // when RLS silently blocked the delete (0 rows affected, no error).
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .delete()
        .eq('id', attendanceId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No attendance row was deleted');
      }
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['attendance', 'today', vars.classId] }),
  });
}

// Revert a check-out: clear checkout_time and roll status back to checked_in.
export function useUndoCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attendanceId, classId: _classId }: { attendanceId: string; classId: string }) => {
      const { error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .update({ checkout_time: null, status: 'checked_in' })
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

/** Number of students present per session date (for dashboard trend charts). */
export function usePresentCountsByDate(schoolId: string, from: string, to: string) {
  return useQuery<Record<string, number>>({
    queryKey: ['attendance', 'present-counts', schoolId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('session_date, status')
        .eq('school_id', schoolId)
        .gte('session_date', from)
        .lte('session_date', to);
      if (error) throw error;
      return computePresentCountsByDate(
        (data ?? []).map((r) => ({
          sessionDate: r.session_date as string,
          status: r.status as AttendanceStatus,
        })),
      );
    },
    enabled: !!(schoolId && from && to),
  });
}

/**
 * Attendance report with *derived* absence.
 *
 * A session (class + date) only counts if at least one student was checked in —
 * that distinguishes a real session from a holiday/cancelled day, which has no
 * check-ins. For every such active session, each enrolled student who wasn't
 * checked in is counted absent, whether they were explicitly marked absent or
 * simply never recorded. This keeps attendance % honest without relying on
 * teachers manually marking every no-show.
 */
export function useAttendanceReport(schoolId: string, classId: string, from: string, to: string) {
  return useQuery<AttendanceReportRow[]>({
    queryKey: ['attendance', 'report', schoolId, classId, from, to],
    queryFn: async () => {
      // 1. Attendance records in range.
      let recQuery = supabase
        .from(TABLES.ATTENDANCE_RECORDS)
        .select('student_id, class_id, session_date, status')
        .eq('school_id', schoolId)
        .gte('session_date', from)
        .lte('session_date', to);
      if (classId) recQuery = recQuery.eq('class_id', classId);
      const { data: recs, error: recErr } = await recQuery;
      if (recErr) throw recErr;

      // 2. Active student roster (a student belongs to a single class).
      let rosterQuery = supabase
        .from(TABLES.STUDENTS)
        .select('id, class_id, first_name, last_name')
        .eq('school_id', schoolId)
        .eq('status', 'active');
      if (classId) rosterQuery = rosterQuery.eq('class_id', classId);
      const { data: roster, error: rosterErr } = await rosterQuery;
      if (rosterErr) throw rosterErr;

      // 3. Derive present/absent per student (absence inferred for active sessions).
      return computeAttendanceReport(
        (recs ?? []).map((r) => ({
          studentId: r.student_id as string,
          classId: r.class_id as string,
          sessionDate: r.session_date as string,
          status: r.status as AttendanceStatus,
        })),
        (roster ?? []).map((s) => ({
          id: s.id as string,
          classId: s.class_id as string,
          name: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
        })),
      );
    },
    enabled: !!(schoolId && from && to),
  });
}
