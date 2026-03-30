import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationModel } from '@/types';
import { TABLES } from '@/constants';

function mapNotification(d: Record<string, unknown>): NotificationModel {
  return {
    id: d.id as string,
    userId: d.user_id as string,
    title: d.title as string,
    body: d.body as string,
    type: d.type as string,
    referenceId: d.reference_id as string | undefined,
    isRead: d.is_read as boolean,
    createdAt: d.created_at as string,
  };
}

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(mapNotification);
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, userId) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: (_, userId) =>
      qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}
