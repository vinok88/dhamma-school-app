import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StudentModel, StudentStatus } from '@/types';
import { TABLES } from '@/constants';

function mapStudent(d: Record<string, unknown>): StudentModel {
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
    parentId: d.parent_id as string,
    classId: d.class_id as string | undefined,
    className: (d.classes as Record<string, unknown>)?.name as string | undefined,
    status: d.status as StudentStatus,
    statusNote: d.status_note as string | undefined,
    parentName: (d.user_profiles as Record<string, unknown>)?.full_name as string | undefined,
    parentPhone: (d.user_profiles as Record<string, unknown>)?.phone as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  };
}

export function useMyStudents(parentId: string) {
  return useQuery({
    queryKey: ['students', 'parent', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, classes(name)')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapStudent);
    },
    enabled: !!parentId,
  });
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, user_profiles(full_name, phone)')
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
        .select('*, classes(name), user_profiles(full_name, phone)')
        .eq('school_id', schoolId)
        .order('first_name');
      if (error) throw error;
      return (data ?? []).map(mapStudent);
    },
    enabled: !!schoolId,
  });
}

export function usePendingStudents(schoolId: string) {
  return useQuery({
    queryKey: ['students', 'pending', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select('*, user_profiles(full_name, phone)')
        .eq('school_id', schoolId)
        .in('status', ['pending', 'under_review'])
        .order('created_at');
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
        .select('*, classes(name), user_profiles(full_name, phone)')
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return mapStudent(data);
    },
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      schoolId: string;
      parentId: string;
      firstName: string;
      lastName: string;
      preferredName?: string;
      dob: string;
      gender: string;
      hasAllergies: boolean;
      allergyNotes?: string;
      photoPublishConsent: boolean;
      photoUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .insert({
          school_id: payload.schoolId,
          parent_id: payload.parentId,
          first_name: payload.firstName,
          last_name: payload.lastName,
          preferred_name: payload.preferredName,
          dob: payload.dob,
          gender: payload.gender,
          has_allergies: payload.hasAllergies,
          allergy_notes: payload.allergyNotes,
          photo_publish_consent: payload.photoPublishConsent,
          photo_url: payload.photoUrl,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useApproveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update({ status: 'active', class_id: classId })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useRejectStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, note }: { studentId: string; note?: string }) => {
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .update({ status: 'rejected', status_note: note })
        .eq('id', studentId);
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
