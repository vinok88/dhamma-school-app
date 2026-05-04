import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StudentModel, StudentParentLink, StudentStatus } from '@/types';
import { TABLES } from '@/constants';

function mapParentLinks(rows: unknown): StudentParentLink[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const d = r as Record<string, unknown>;
    return {
      id: d.id as string,
      studentId: d.student_id as string,
      parentEmail: d.parent_email as string,
      parentName: d.parent_name as string | undefined,
      parentPhone: d.parent_phone as string | undefined,
      parentUserId: d.parent_user_id as string | undefined,
    };
  });
}

function mapStudent(d: Record<string, unknown>): StudentModel {
  const klass = d.classes as Record<string, unknown> | null;
  const ctRows = (klass?.class_teachers as Record<string, unknown>[] | undefined) ?? [];
  const classTeachers = ctRows.map((row) => {
    const profile = row.user_profiles as Record<string, unknown> | null;
    return {
      id: row.teacher_id as string,
      name: (profile?.full_name as string) ?? '',
    };
  });
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    firstName: d.first_name as string,
    lastName: d.last_name as string,
    preferredName: d.preferred_name as string | undefined,
    dob: d.dob as string,
    gender: d.gender as string,
    hasAllergies: d.has_allergies as boolean,
    allergyNotes: d.allergy_notes as string | undefined,
    photoUrl: d.photo_url as string | undefined,
    photoPublishConsent: d.photo_publish_consent as boolean,
    address: d.address as string | undefined,
    classId: d.class_id as string | undefined,
    className: klass?.name as string | undefined,
    classTeachers,
    status: d.status as StudentStatus,
    statusNote: d.status_note as string | undefined,
    parents: mapParentLinks(d.student_parents),
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  };
}

export function useMyStudents(userId: string) {
  return useQuery({
    queryKey: ['students', 'parent', userId],
    queryFn: async () => {
      // Find every student the user is linked to as a parent
      const { data: links, error: linkErr } = await supabase
        .from(TABLES.STUDENT_PARENTS)
        .select('student_id')
        .eq('parent_user_id', userId);
      if (linkErr) throw linkErr;
      const ids = (links ?? []).map((l: any) => l.student_id);
      if (!ids.length) return [];

      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, classes(name, class_teachers(teacher_id, user_profiles(full_name))), student_parents(*)')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapStudent);
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, student_parents(*)')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return (data ?? []).map(mapStudent);
    },
    enabled: !!classId,
  });
}

export function useAllStudents(schoolId: string) {
  return useQuery({
    queryKey: ['students', 'all', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, classes(name, class_teachers(teacher_id, user_profiles(full_name))), student_parents(*)')
        .eq('school_id', schoolId)
        .order('first_name');
      if (error) throw error;
      return (data ?? []).map(mapStudent);
    },
    enabled: !!schoolId,
  });
}

export function useStudentDetail(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, classes(name, class_teachers(teacher_id, user_profiles(full_name))), student_parents(*)')
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return mapStudent(data);
    },
    enabled: !!studentId,
  });
}

export interface CreateStudentPayload {
  schoolId: string;
  classId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob: string;
  gender: string;
  address?: string;
  hasAllergies: boolean;
  allergyNotes?: string;
  photoPublishConsent: boolean;
  parents: { email: string; name?: string; phone?: string }[];
}

// Principal-only: create an active student + link parent emails.
// (No photo handled here — can be added separately later.)
export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStudentPayload) => {
      const { data: student, error } = await supabase
        .from(TABLES.STUDENTS)
        .insert({
          school_id: payload.schoolId,
          class_id: payload.classId,
          first_name: payload.firstName,
          last_name: payload.lastName,
          preferred_name: payload.preferredName,
          dob: payload.dob,
          gender: payload.gender,
          address: payload.address,
          has_allergies: payload.hasAllergies,
          allergy_notes: payload.allergyNotes,
          photo_publish_consent: payload.photoPublishConsent,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;

      const linkRows = payload.parents.map((p) => ({
        student_id: student.id,
        parent_email: p.email.toLowerCase().trim(),
        parent_name: p.name,
        parent_phone: p.phone,
      }));
      const { error: linkErr } = await supabase
        .from(TABLES.STUDENT_PARENTS)
        .insert(linkRows);
      if (linkErr) {
        // Compensating delete to avoid orphan student
        await supabase.from(TABLES.STUDENTS).delete().eq('id', student.id);
        throw linkErr;
      }
      return student;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudentPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, photoPath }: { studentId: string; photoPath: string }) => {
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update({ photo_url: photoPath })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export interface UpdateStudentPayload {
  studentId: string;
  preferredName?: string;
  address?: string;
  hasAllergies?: boolean;
  allergyNotes?: string | null;
  photoPublishConsent?: boolean;
}

// Parent-safe student update — only exposes columns parents are allowed to edit.
// (RLS still permits more, but the app form does not.)
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateStudentPayload) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.preferredName !== undefined)        update.preferred_name        = payload.preferredName;
      if (payload.address !== undefined)              update.address               = payload.address;
      if (payload.hasAllergies !== undefined)         update.has_allergies         = payload.hasAllergies;
      if (payload.allergyNotes !== undefined)         update.allergy_notes         = payload.allergyNotes;
      if (payload.photoPublishConsent !== undefined)  update.photo_publish_consent = payload.photoPublishConsent;
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update(update)
        .eq('id', payload.studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, status, note }: { studentId: string; status: StudentStatus; note?: string }) => {
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update({ status, status_note: note })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}
