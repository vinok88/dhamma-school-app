import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/constants';

export interface BulkParent {
  email: string;
  name?: string;
  phone?: string;
}

export interface BulkStudentRow {
  // Source line for error messages
  lineNumber: number;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;            // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
  address?: string;
  classId: string;
  hasAllergies: boolean;
  allergyNotes?: string;
  photoPublishConsent: boolean;
  parents: BulkParent[];
}

export interface ResolvedRow extends BulkStudentRow {
  action: 'insert' | 'update';
  existingStudentId?: string;       // set when action === 'update'
  existingParentCount?: number;     // for the "links removed" preview
}

/**
 * Look up existing students in this school matching each row's natural key
 * (lower(first_name), lower(last_name), dob) and stamp each input row with
 * insert/update plus the id to overwrite. Pure read; the caller still needs
 * to ask the principal to confirm before mutating.
 */
export async function resolveRowsAgainstExisting(
  schoolId: string,
  rows: BulkStudentRow[],
): Promise<ResolvedRow[]> {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, first_name, last_name, dob, student_parents(id)')
    .eq('school_id', schoolId);
  if (error) throw error;

  const index = new Map<string, { id: string; parentCount: number }>();
  for (const s of (data ?? []) as any[]) {
    const key = `${(s.first_name as string).toLowerCase()}|${(s.last_name as string).toLowerCase()}|${s.dob}`;
    index.set(key, { id: s.id, parentCount: (s.student_parents ?? []).length });
  }

  return rows.map((r) => {
    const key = `${r.firstName.toLowerCase()}|${r.lastName.toLowerCase()}|${r.dob}`;
    const existing = index.get(key);
    return existing
      ? { ...r, action: 'update' as const, existingStudentId: existing.id, existingParentCount: existing.parentCount }
      : { ...r, action: 'insert' as const };
  });
}

export interface BulkResult {
  ok: number;
  failed: { lineNumber: number; message: string }[];
}

/**
 * Apply a confirmed batch. Inserts new students, updates existing ones, and
 * replaces the student_parents link list for every touched row.
 *
 * NOTE: not transactional — runs row-by-row. Each row is independent; one
 * failure does not roll back successful rows, but the per-row error is
 * surfaced to the caller for retry.
 */
export function useApplyBulkStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      rows,
    }: {
      schoolId: string;
      rows: ResolvedRow[];
    }): Promise<BulkResult> => {
      let ok = 0;
      const failed: BulkResult['failed'] = [];

      for (const r of rows) {
        try {
          let studentId = r.existingStudentId;

          const studentPayload = {
            first_name: r.firstName,
            last_name: r.lastName,
            preferred_name: r.preferredName?.trim() || null,
            dob: r.dob,
            gender: r.gender,
            address: r.address?.trim() || null,
            class_id: r.classId,
            has_allergies: r.hasAllergies,
            allergy_notes: r.hasAllergies ? (r.allergyNotes?.trim() || null) : null,
            photo_publish_consent: r.photoPublishConsent,
          };

          if (r.action === 'insert') {
            const { data, error } = await supabase
              .from(TABLES.STUDENTS)
              .insert({ school_id: schoolId, ...studentPayload, status: 'active' })
              .select('id')
              .single();
            if (error) throw error;
            studentId = data.id;
          } else {
            const { error } = await supabase
              .from(TABLES.STUDENTS)
              .update({ ...studentPayload, updated_at: new Date().toISOString() })
              .eq('id', studentId!);
            if (error) throw error;
          }

          // Replace policy: delete all existing parent links, insert the new set.
          // For insert rows there's nothing to delete; for update rows this is
          // the source-of-truth re-sync.
          if (r.action === 'update') {
            const { error: delErr } = await supabase
              .from(TABLES.STUDENT_PARENTS)
              .delete()
              .eq('student_id', studentId!);
            if (delErr) throw delErr;
          }
          if (r.parents.length) {
            const linkRows = r.parents.map((p) => ({
              student_id: studentId!,
              parent_email: p.email.toLowerCase().trim(),
              parent_name: p.name?.trim() || null,
              parent_phone: p.phone?.trim() || null,
            }));
            const { error: insErr } = await supabase
              .from(TABLES.STUDENT_PARENTS)
              .insert(linkRows);
            if (insErr) throw insErr;
          }

          ok++;
        } catch (e: unknown) {
          const message = e instanceof Error
            ? e.message
            : (e as { message?: string })?.message ?? 'Unknown error';
          failed.push({ lineNumber: r.lineNumber, message });
        }
      }

      return { ok, failed };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}
