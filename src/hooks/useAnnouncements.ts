import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AnnouncementModel, AnnouncementType } from '@/types';
import { TABLES } from '@/constants';

function mapAnnouncement(d: Record<string, unknown>): AnnouncementModel {
  const author = d.user_profiles as Record<string, unknown> | null;
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    authorId: d.author_id as string,
    authorName: (author?.full_name as string) ?? 'Unknown',
    title: d.title as string,
    body: d.body as string,
    type: d.type as AnnouncementType,
    targetClassId: d.target_class_id as string | undefined,
    publishedAt: d.published_at as string,
    createdAt: d.created_at as string,
  };
}

export function useAnnouncements(schoolId: string, classId?: string) {
  return useQuery({
    queryKey: ['announcements', schoolId, classId],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*, user_profiles(full_name)')
        .eq('school_id', schoolId)
        .order('published_at', { ascending: false });

      if (classId) {
        query = query.or(`type.eq.school,target_class_id.eq.${classId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapAnnouncement);
    },
    enabled: !!schoolId,
    refetchInterval: 30_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      schoolId: string;
      authorId: string;
      title: string;
      body: string;
      type: AnnouncementType;
      targetClassId?: string;
    }) => {
      const { error } = await supabase.from(TABLES.ANNOUNCEMENTS).insert({
        school_id: payload.schoolId,
        author_id: payload.authorId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        target_class_id: payload.targetClassId,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export interface AnnouncementViewStat {
  user_id: string;
  full_name: string;
  role: string;
  viewed: boolean;
}

export function useAnnouncementViewStats(announcementId: string) {
  return useQuery({
    queryKey: ['announcement-view-stats', announcementId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_announcement_view_stats', {
        p_announcement_id: announcementId,
      });
      if (error) throw error;
      return (data ?? []) as AnnouncementViewStat[];
    },
    enabled: !!announcementId,
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.ANNOUNCEMENTS).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
