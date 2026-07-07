import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MessageModel, ConversationModel } from '@/types';
import { TABLES, STORAGE } from '@/constants';

/** Short personal name for a parent/teacher: preferred name, else first word of full name. */
function profileShortName(full?: string | null, preferred?: string | null): string {
  if (preferred && preferred.trim()) return preferred.trim();
  if (full && full.trim()) return full.trim().split(/\s+/)[0];
  return '';
}

/** Short name for a student: preferred name, else first name. */
function studentShortName(first?: string | null, preferred?: string | null): string {
  if (preferred && preferred.trim()) return preferred.trim();
  if (first && first.trim()) return first.trim();
  return '';
}

function mapMessage(d: Record<string, unknown>): MessageModel {
  const sender = d.sender as Record<string, unknown> | null;
  const short = profileShortName(
    sender?.full_name as string,
    sender?.preferred_name as string,
  );
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    senderId: d.sender_id as string,
    senderName: short || 'Unknown',
    recipientId: d.recipient_id as string,
    body: d.body as string,
    readAt: d.read_at as string | undefined,
    createdAt: d.created_at as string,
  };
}

export function useConversations(userId: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      // Get all messages involving this user, with both participants' profiles.
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select(
          '*, sender:user_profiles!sender_id(full_name, preferred_name, role, profile_photo_url), recipient:user_profiles!recipient_id(full_name, preferred_name, role, profile_photo_url)',
        )
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Collect unique conversation partners (most-recent message first).
      const seen = new Set<string>();
      type Partner = {
        id: string;
        profile: Record<string, unknown> | null;
        lastMessage: string;
        lastMessageAt: string;
      };
      const partners: Partner[] = [];
      for (const msg of data ?? []) {
        const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const partnerProfile = (msg.sender_id === userId ? msg.recipient : msg.sender) as
          | Record<string, unknown>
          | null;
        if (seen.has(partnerId)) continue;
        seen.add(partnerId);
        partners.push({
          id: partnerId,
          profile: partnerProfile,
          lastMessage: msg.body,
          lastMessageAt: msg.created_at,
        });
      }

      // For parent partners (i.e. the teacher's view), look up their children's
      // names so the conversation reads "Parent (Child1, Child2)". RLS limits the
      // teacher to students in their own class.
      const parentIds = partners
        .filter((p) => (p.profile?.role as string) === 'parent')
        .map((p) => p.id);
      const studentsByParent: Record<string, string[]> = {};
      if (parentIds.length) {
        const { data: links } = await supabase
          .from(TABLES.STUDENT_PARENTS)
          .select('parent_user_id, student:students(first_name, preferred_name)')
          .in('parent_user_id', parentIds);
        for (const link of (links ?? []) as Record<string, unknown>[]) {
          const pid = link.parent_user_id as string | null;
          const s = link.student as Record<string, unknown> | null;
          const nm = studentShortName(s?.first_name as string, s?.preferred_name as string);
          if (pid && nm) (studentsByParent[pid] ??= []).push(nm);
        }
      }

      // Profile photos live in a private bucket as storage paths — convert each
      // to a 1-hour signed URL so the avatar <Image> can render it. Without this
      // the raw path 404s and the avatar falls back to initials.
      const photoByPartner: Record<string, string | undefined> = {};
      await Promise.all(
        partners.map(async (p) => {
          const path = p.profile?.profile_photo_url as string | null | undefined;
          if (!path) return;
          if (path.startsWith('http')) {
            photoByPartner[p.id] = path;
            return;
          }
          try {
            const { data: urlData } = await supabase.storage
              .from(STORAGE.PROFILE_PHOTOS)
              .createSignedUrl(path, 3600);
            photoByPartner[p.id] = urlData?.signedUrl ?? undefined;
          } catch {
            // Non-fatal — avatar falls back to initials.
          }
        }),
      );

      return partners.map<ConversationModel>((p) => {
        const role = p.profile?.role as string | undefined;
        const base = profileShortName(
          p.profile?.full_name as string,
          p.profile?.preferred_name as string,
        );
        let displayName: string;
        if (role === 'parent') {
          // Teacher's view: parent first/preferred name + their student(s).
          const kids = studentsByParent[p.id] ?? [];
          const parentLabel = base || 'Parent';
          displayName = kids.length ? `${parentLabel} (${kids.join(', ')})` : parentLabel;
        } else {
          // Parent's view: the teacher's (or staff's) first/preferred name.
          displayName = base || 'Teacher';
        }
        const unread = (data ?? []).filter(
          (m) => m.recipient_id === userId && m.sender_id === p.id && !m.read_at,
        ).length;
        return {
          recipientId: p.id,
          recipientName: displayName,
          recipientPhotoUrl: photoByPartner[p.id],
          lastMessage: p.lastMessage,
          lastMessageAt: p.lastMessageAt,
          unreadCount: unread,
        };
      });
    },
    enabled: !!userId,
  });
}

export function useMessageThread(userId: string, recipientId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['messages', userId, recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*, sender:user_profiles!sender_id(full_name, preferred_name)')
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Mark unread as read. If any rows were actually updated, refresh the
      // conversations list so its unread badge clears immediately (not just on
      // the next focus/poll). `.select()` returns the rows that changed.
      const { data: marked } = await supabase
        .from(TABLES.MESSAGES)
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', recipientId)
        .eq('recipient_id', userId)
        .is('read_at', null)
        .select('id');
      if (marked && marked.length > 0) {
        qc.invalidateQueries({ queryKey: ['conversations', userId] });
      }

      return (data ?? []).map(mapMessage);
    },
    enabled: !!(userId && recipientId),
    refetchInterval: 30_000, // Poll every 30s for new messages
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      schoolId: string;
      senderId: string;
      recipientId: string;
      body: string;
    }) => {
      const { error } = await supabase.from(TABLES.MESSAGES).insert({
        school_id: payload.schoolId,
        sender_id: payload.senderId,
        recipient_id: payload.recipientId,
        body: payload.body,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.senderId, vars.recipientId] });
      qc.invalidateQueries({ queryKey: ['conversations', vars.senderId] });
    },
  });
}
