import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/constants';
import { TeacherInvitation } from '@/types';

function mapInvitation(d: Record<string, unknown>): TeacherInvitation {
  return {
    id: d.id as string,
    email: d.email as string,
    fullName: d.full_name as string | undefined,
    phone: d.phone as string | undefined,
    address: d.address as string | undefined,
    invitedBy: d.invited_by as string | undefined,
    claimedBy: d.claimed_by as string | undefined,
    createdAt: d.created_at as string,
  };
}

export function useTeacherInvitations() {
  return useQuery({
    queryKey: ['teacher-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.TEACHER_INVITATIONS)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapInvitation);
    },
  });
}

export interface InviteTeacherPayload {
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  invitedBy: string;
}

export function useInviteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteTeacherPayload) => {
      const { data, error } = await supabase
        .from(TABLES.TEACHER_INVITATIONS)
        .insert({
          email: payload.email.toLowerCase().trim(),
          full_name: payload.fullName,
          phone: payload.phone,
          address: payload.address,
          invited_by: payload.invitedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-invitations'] }),
  });
}
