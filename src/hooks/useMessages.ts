import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MessageModel, ConversationModel } from '@/types';
import { TABLES } from '@/constants';

function mapMessage(d: Record<string, unknown>): MessageModel {
  const sender = d.sender as Record<string, unknown> | null;
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    senderId: d.sender_id as string,
    senderName: (sender?.full_name as string) ?? 'Unknown',
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
      // Get all messages involving this user
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*, sender:user_profiles!sender_id(full_name, profile_photo_url), recipient:user_profiles!recipient_id(full_name, profile_photo_url)')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Group by conversation partner
      const seen = new Set<string>();
      const conversations: ConversationModel[] = [];
      for (const msg of data ?? []) {
        const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const partnerProfile = msg.sender_id === userId ? msg.recipient : msg.sender;
        if (!seen.has(partnerId)) {
          seen.add(partnerId);
          const unread = (data ?? []).filter(
            (m) => m.recipient_id === userId && m.sender_id === partnerId && !m.read_at
          ).length;
          conversations.push({
            recipientId: partnerId,
            recipientName: (partnerProfile as Record<string, unknown>)?.full_name as string ?? 'Unknown',
            recipientPhotoUrl: (partnerProfile as Record<string, unknown>)?.profile_photo_url as string | undefined,
            lastMessage: msg.body,
            lastMessageAt: msg.created_at,
            unreadCount: unread,
          });
        }
      }
      return conversations;
    },
    enabled: !!userId,
  });
}

export function useMessageThread(userId: string, recipientId: string) {
  return useQuery({
    queryKey: ['messages', userId, recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select('*, sender:user_profiles!sender_id(full_name)')
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Mark unread as read
      await supabase
        .from(TABLES.MESSAGES)
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', recipientId)
        .eq('recipient_id', userId)
        .is('read_at', null);

      return (data ?? []).map(mapMessage);
    },
    enabled: !!(userId && recipientId),
    refetchInterval: 5000, // Poll every 5s for new messages
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
