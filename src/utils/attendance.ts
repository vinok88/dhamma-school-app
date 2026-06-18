import { AttendanceModel, AttendanceStatus } from '@/types';

// A student counts as "present" for a session in any of these states.
export const PRESENT_STATUSES: ReadonlySet<AttendanceStatus> = new Set([
  'checked_in',
  'checked_out',
  'present',
]);

export function isPresentStatus(status: AttendanceStatus): boolean {
  return PRESENT_STATUSES.has(status);
}

export interface ReportRecord {
  studentId: string;
  classId: string;
  sessionDate: string;
  status: AttendanceStatus;
}

export interface RosterStudent {
  id: string;
  classId: string;
  name: string;
}

export interface AttendanceReportRow {
  studentId: string;
  name: string;
  present: number;
  absent: number;
}

export interface SessionStatusRecord {
  sessionDate: string;
  status: AttendanceStatus;
}

/**
 * Derive present/absent counts per student.
 *
 * A session (class + date) only counts when at least one student was checked in
 * — that separates a real session from a holiday (no check-ins). For each such
 * active session, every enrolled student who wasn't checked in is counted
 * absent, whether explicitly marked or never recorded.
 */
export function computeAttendanceReport(
  records: ReportRecord[],
  roster: RosterStudent[],
): AttendanceReportRow[] {
  const activeDatesByClass = new Map<string, Set<string>>();
  const presentSet = new Set<string>(); // `${studentId}|${date}`

  for (const r of records) {
    if (!isPresentStatus(r.status)) continue;
    let dates = activeDatesByClass.get(r.classId);
    if (!dates) {
      dates = new Set();
      activeDatesByClass.set(r.classId, dates);
    }
    dates.add(r.sessionDate);
    presentSet.add(`${r.studentId}|${r.sessionDate}`);
  }

  return roster.map((s) => {
    const activeDates = activeDatesByClass.get(s.classId) ?? new Set<string>();
    let present = 0;
    let absent = 0;
    for (const date of activeDates) {
      if (presentSet.has(`${s.id}|${date}`)) present++;
      else absent++;
    }
    return { studentId: s.id, name: s.name, present, absent };
  });
}

/** Number of students present per session date (for dashboard trend charts). */
export function computePresentCountsByDate(
  records: SessionStatusRecord[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of records) {
    if (!isPresentStatus(r.status)) continue;
    counts[r.sessionDate] = (counts[r.sessionDate] ?? 0) + 1;
  }
  return counts;
}

/**
 * A student's recent attendance with derived absence: for the class's most
 * recent active sessions (a date with >=1 check-in), the student is present if
 * checked in, otherwise absent — even with no record. Holidays never appear.
 */
export function computeStudentHistory(
  ownRecords: AttendanceModel[],
  classRecords: SessionStatusRecord[],
  studentId: string,
  classId: string,
  limit = 8,
): AttendanceModel[] {
  const activeDates = Array.from(
    new Set(classRecords.filter((r) => isPresentStatus(r.status)).map((r) => r.sessionDate)),
  )
    .sort((a, b) => (a < b ? 1 : -1)) // most recent first
    .slice(0, limit);

  const ownByDate = new Map(ownRecords.map((r) => [r.sessionDate, r]));

  return activeDates.map((date): AttendanceModel => {
    const rec = ownByDate.get(date);
    if (rec) return rec;
    return {
      id: `derived-${studentId}-${date}`,
      schoolId: '',
      studentId,
      teacherId: '',
      classId,
      sessionDate: date,
      status: 'absent',
      createdAt: date,
    };
  });
}
