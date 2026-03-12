import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserModel } from '@/types';
import { TABLES } from '@/constants';

function mapTeacher(d: Record<string, unknown>): UserModel {
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    fullName: d.full_name as string,
    preferredName: d.preferred_name as string | undefined,
    phone: d.phone as string | undefined,
    address: d.address as string | undefined,
    role: 'teacher',
    status: d.status as UserModel['status'],
    profilePhotoUrl: d.profile_photo_url as string | undefined,
    fcmToken: d.fcm_token as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  };
}

export function useTeachers(schoolId: string) {
  return useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .order('full_name');
      if (error) throw error;
      return (data ?? []).map(mapTeacher);
    },
    enabled: !!schoolId,
  });
}

export function usePendingTeachers(schoolId: string) {
  return useQuery({
    queryKey: ['teachers', 'pending', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .eq('status', 'pending')
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapTeacher);
    },
    enabled: !!schoolId,
  });
}

export function useApproveTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ status: 'active' })
        .eq('id', teacherId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

export function useRejectTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ status: 'inactive' })
        .eq('id', teacherId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
}

export function useDeactivateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ status: 'inactive' })
        .eq('id', teacherId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
}
