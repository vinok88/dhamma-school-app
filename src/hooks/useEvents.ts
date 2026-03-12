import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EventModel, EventType } from '@/types';
import { TABLES } from '@/constants';

function mapEvent(d: Record<string, unknown>): EventModel {
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    title: d.title as string,
    description: d.description as string | undefined,
    eventType: d.event_type as EventType,
    startDatetime: d.start_datetime as string,
    endDatetime: d.end_datetime as string | undefined,
    location: d.location as string,
    createdBy: d.created_by as string,
    createdAt: d.created_at as string,
  };
}

export function useEvents(schoolId: string) {
  return useQuery({
    queryKey: ['events', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('school_id', schoolId)
        .order('start_datetime', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapEvent);
    },
    enabled: !!schoolId,
  });
}

export function useUpcomingEvents(schoolId: string) {
  return useQuery({
    queryKey: ['events', 'upcoming', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('school_id', schoolId)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map(mapEvent);
    },
    enabled: !!schoolId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      schoolId: string;
      createdBy: string;
      title: string;
      description?: string;
      eventType: EventType;
      startDatetime: string;
      endDatetime?: string;
      location: string;
    }) => {
      const { error } = await supabase.from(TABLES.EVENTS).insert({
        school_id: payload.schoolId,
        created_by: payload.createdBy,
        title: payload.title,
        description: payload.description,
        event_type: payload.eventType,
        start_datetime: payload.startDatetime,
        end_datetime: payload.endDatetime,
        location: payload.location,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<EventModel> & { id: string }) => {
      const { error } = await supabase
        .from(TABLES.EVENTS)
        .update({
          title: payload.title,
          description: payload.description,
          event_type: payload.eventType,
          start_datetime: payload.startDatetime,
          end_datetime: payload.endDatetime,
          location: payload.location,
        })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.EVENTS).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
