import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserModel } from '@/types';
import { TABLES } from '@/constants';

function mapUser(d: Record<string, unknown>): UserModel {
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    fullName: d.full_name as string,
    preferredName: d.preferred_name as string | undefined,
    phone: d.phone as string | undefined,
    address: d.address as string | undefined,
    role: d.role as UserModel['role'],
    status: d.status as UserModel['status'],
    profilePhotoUrl: d.profile_photo_url as string | undefined,
    fcmToken: d.fcm_token as string | undefined,
    email: d.email as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  };
}

export function useAllUsers(schoolId: string) {
  return useQuery({
    queryKey: ['users', 'all', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('school_id', schoolId)
        .order('full_name');
      if (error) throw error;
      return (data ?? []).map(mapUser);
    },
    enabled: !!schoolId,
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ role, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['teachers'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

// Legacy aliases for backward compat
export function usePromoteToAdmin() {
  const changeRole = useChangeUserRole();
  return {
    ...changeRole,
    mutate: (userId: string) => changeRole.mutate({ userId, role: 'admin' }),
    mutateAsync: (userId: string) => changeRole.mutateAsync({ userId, role: 'admin' }),
  };
}

export function useDemoteAdmin() {
  const changeRole = useChangeUserRole();
  return {
    ...changeRole,
    mutate: (userId: string) => changeRole.mutate({ userId, role: 'parent' }),
    mutateAsync: (userId: string) => changeRole.mutateAsync({ userId, role: 'parent' }),
  };
}
