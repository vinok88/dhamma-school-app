import {
  isPresentStatus,
  computeAttendanceReport,
  computePresentCountsByDate,
  computeStudentHistory,
  type ReportRecord,
  type RosterStudent,
  type SessionStatusRecord,
} from '@/utils/attendance';
import { AttendanceModel, AttendanceStatus } from '@/types';

// Minimal AttendanceModel builder for the student-history tests.
function rec(over: Partial<AttendanceModel> & { sessionDate: string; status: AttendanceStatus }): AttendanceModel {
  return {
    id: `rec-${over.sessionDate}`,
    schoolId: 'sch',
    studentId: 's1',
    teacherId: 't1',
    classId: 'c1',
    checkinTime: undefined,
    checkoutTime: undefined,
    createdAt: over.sessionDate,
    ...over,
  };
}

describe('isPresentStatus', () => {
  it('treats checked_in / checked_out / present as present', () => {
    expect(isPresentStatus('checked_in')).toBe(true);
    expect(isPresentStatus('checked_out')).toBe(true);
    expect(isPresentStatus('present')).toBe(true);
  });
  it('treats absent as not present', () => {
    expect(isPresentStatus('absent')).toBe(false);
  });
});

describe('computeAttendanceReport', () => {
  const roster: RosterStudent[] = [
    { id: 's1', classId: 'c1', name: 'Anna' },
    { id: 's2', classId: 'c1', name: 'Ben' },
  ];

  it('counts an enrolled student with no record as absent on an active session', () => {
    const records: ReportRecord[] = [
      { studentId: 's1', classId: 'c1', sessionDate: '2026-06-07', status: 'checked_in' },
    ];
    const rows = computeAttendanceReport(records, roster);
    expect(rows).toEqual([
      { studentId: 's1', name: 'Anna', present: 1, absent: 0 },
      { studentId: 's2', name: 'Ben', present: 0, absent: 1 },
    ]);
  });

  it('does not penalize anyone on a holiday (no check-ins → no active session)', () => {
    const rows = computeAttendanceReport([], roster);
    expect(rows).toEqual([
      { studentId: 's1', name: 'Anna', present: 0, absent: 0 },
      { studentId: 's2', name: 'Ben', present: 0, absent: 0 },
    ]);
  });

  it('does NOT treat an absent-only date (no check-in) as an active session', () => {
    // A day where the only record is an explicit "absent" and nobody checked in
    // is not a real session, so it should not count against the other student.
    const records: ReportRecord[] = [
      { studentId: 's2', classId: 'c1', sessionDate: '2026-06-07', status: 'absent' },
    ];
    const rows = computeAttendanceReport(records, roster);
    expect(rows).toEqual([
      { studentId: 's1', name: 'Anna', present: 0, absent: 0 },
      { studentId: 's2', name: 'Ben', present: 0, absent: 0 },
    ]);
  });

  it('counts checked_out and present as present, and explicit absent as absent', () => {
    const records: ReportRecord[] = [
      { studentId: 's1', classId: 'c1', sessionDate: '2026-06-07', status: 'checked_out' },
      { studentId: 's2', classId: 'c1', sessionDate: '2026-06-07', status: 'absent' },
    ];
    const rows = computeAttendanceReport(records, roster);
    expect(rows).toEqual([
      { studentId: 's1', name: 'Anna', present: 1, absent: 0 },
      { studentId: 's2', name: 'Ben', present: 0, absent: 1 },
    ]);
  });

  it('tallies across multiple sessions', () => {
    const records: ReportRecord[] = [
      { studentId: 's1', classId: 'c1', sessionDate: '2026-06-07', status: 'checked_in' },
      { studentId: 's1', classId: 'c1', sessionDate: '2026-06-14', status: 'checked_in' },
      { studentId: 's2', classId: 'c1', sessionDate: '2026-06-07', status: 'checked_in' },
      // s2 missed 2026-06-14 (active because s1 checked in) → absent
    ];
    const rows = computeAttendanceReport(records, roster);
    expect(rows).toContainEqual({ studentId: 's1', name: 'Anna', present: 2, absent: 0 });
    expect(rows).toContainEqual({ studentId: 's2', name: 'Ben', present: 1, absent: 1 });
  });

  it('scopes active sessions per class — a student is only judged on their own class', () => {
    const multiRoster: RosterStudent[] = [
      { id: 's1', classId: 'c1', name: 'Anna' },
      { id: 's2', classId: 'c1', name: 'Ben' },
      { id: 's3', classId: 'c2', name: 'Cara' },
      { id: 's4', classId: 'c2', name: 'Dan' },
    ];
    const records: ReportRecord[] = [
      { studentId: 's1', classId: 'c1', sessionDate: '2026-06-07', status: 'checked_in' }, // c1 active on 06-07
      { studentId: 's3', classId: 'c2', sessionDate: '2026-06-14', status: 'checked_in' }, // c2 active on 06-14
    ];
    const rows = computeAttendanceReport(records, multiRoster);
    expect(rows).toContainEqual({ studentId: 's1', name: 'Anna', present: 1, absent: 0 });
    expect(rows).toContainEqual({ studentId: 's2', name: 'Ben', present: 0, absent: 1 });
    expect(rows).toContainEqual({ studentId: 's3', name: 'Cara', present: 1, absent: 0 });
    expect(rows).toContainEqual({ studentId: 's4', name: 'Dan', present: 0, absent: 1 });
  });
});

describe('computePresentCountsByDate', () => {
  it('counts present students per date and ignores absent records', () => {
    const records: SessionStatusRecord[] = [
      { sessionDate: '2026-06-07', status: 'checked_in' },
      { sessionDate: '2026-06-07', status: 'checked_out' },
      { sessionDate: '2026-06-07', status: 'absent' }, // ignored
      { sessionDate: '2026-06-14', status: 'present' },
    ];
    expect(computePresentCountsByDate(records)).toEqual({ '2026-06-07': 2, '2026-06-14': 1 });
  });

  it('returns an empty map when there are no records', () => {
    expect(computePresentCountsByDate([])).toEqual({});
  });
});

describe('computeStudentHistory', () => {
  const classRecords: SessionStatusRecord[] = [
    { sessionDate: '2026-06-07', status: 'checked_in' },
    { sessionDate: '2026-06-14', status: 'checked_in' },
    { sessionDate: '2026-06-21', status: 'checked_in' },
  ];

  it('returns active sessions most-recent first, inferring absence for missed ones', () => {
    const own = [
      rec({ sessionDate: '2026-06-07', status: 'checked_in' }),
      // 2026-06-14 has no record for this student → derived absent
      rec({ sessionDate: '2026-06-21', status: 'absent' }), // explicitly marked absent
    ];
    const history = computeStudentHistory(own, classRecords, 's1', 'c1', 8);

    expect(history.map((h) => [h.sessionDate, h.status])).toEqual([
      ['2026-06-21', 'absent'],
      ['2026-06-14', 'absent'],
      ['2026-06-07', 'checked_in'],
    ]);
    // The missed session is a synthesized (derived) row.
    const missed = history.find((h) => h.sessionDate === '2026-06-14')!;
    expect(missed.id).toBe('derived-s1-2026-06-14');
  });

  it('excludes holidays (dates with no check-in never appear)', () => {
    const withHoliday: SessionStatusRecord[] = [
      { sessionDate: '2026-06-07', status: 'checked_in' },
      { sessionDate: '2026-06-14', status: 'absent' }, // nobody checked in → holiday/not active
    ];
    const history = computeStudentHistory([], withHoliday, 's1', 'c1', 8);
    expect(history.map((h) => h.sessionDate)).toEqual(['2026-06-07']);
    expect(history[0].status).toBe('absent'); // derived absence for the active session
  });

  it('respects the limit, keeping the most recent active sessions', () => {
    const many: SessionStatusRecord[] = Array.from({ length: 10 }, (_, i) => ({
      sessionDate: `2026-06-${String(i + 1).padStart(2, '0')}`,
      status: 'checked_in' as AttendanceStatus,
    }));
    const history = computeStudentHistory([], many, 's1', 'c1', 8);
    expect(history).toHaveLength(8);
    expect(history[0].sessionDate).toBe('2026-06-10'); // most recent
    expect(history[7].sessionDate).toBe('2026-06-03');
  });

  it('falls back gracefully with no class sessions', () => {
    expect(computeStudentHistory([], [], 's1', 'c1', 8)).toEqual([]);
  });
});
