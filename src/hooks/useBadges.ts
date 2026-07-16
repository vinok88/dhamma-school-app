import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { BadgeModel, StudentBadgeModel } from '@/types';
import { TABLES, STORAGE } from '@/constants';

// ── Mapping ─────────────────────────────────────────────────────────────────

function mapBadge(d: Record<string, unknown>): BadgeModel {
  const klass = d.classes as Record<string, unknown> | null;
  return {
    id: d.id as string,
    schoolId: d.school_id as string,
    classId: (d.class_id as string | null) ?? undefined,
    className: klass?.name as string | undefined,
    name: d.name as string,
    description: d.description as string | undefined,
    imageUrl: d.image_url as string | undefined,
    createdBy: d.created_by as string | undefined,
    isActive: d.is_active as boolean,
    createdAt: d.created_at as string,
  };
}

function mapStudentBadge(d: Record<string, unknown>): StudentBadgeModel {
  const revoked = (d.revoked_at as string | null) ?? undefined;
  const expires = (d.expires_at as string | null) ?? undefined;
  const isActive = !revoked && (!expires || new Date(expires).getTime() > Date.now());
  return {
    id: d.id as string,
    studentId: d.student_id as string,
    badgeId: d.badge_id as string,
    note: d.note as string | undefined,
    awardedAt: d.awarded_at as string,
    expiresAt: expires,
    revokedAt: revoked,
    isActive,
    badge: d.badges ? mapBadge(d.badges as Record<string, unknown>) : undefined,
  };
}

/** Public URL for a badge image path (badge-images is a public bucket). */
export function publicBadgeUrl(path?: string): string | undefined {
  if (!path) return undefined;
  const { data } = supabase.storage.from(STORAGE.BADGE_IMAGES).getPublicUrl(path);
  return data?.publicUrl;
}

// ── Queries ─────────────────────────────────────────────────────────────────

/** All active badges for the school (school-wide + class-wide). */
export function useBadges(schoolId: string) {
  return useQuery({
    queryKey: ['badges', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.BADGES)
        .select('*, classes(name)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapBadge);
    },
    enabled: !!schoolId,
  });
}

/** A student's awards (joined to badge details), active first. */
export function useStudentBadges(studentId: string) {
  return useQuery({
    queryKey: ['studentBadges', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENT_BADGES)
        .select('*, badges(*, classes(name))')
        .eq('student_id', studentId)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map(mapStudentBadge)
        .sort((a, b) => Number(b.isActive) - Number(a.isActive));
    },
    enabled: !!studentId,
  });
}

export interface BadgeHolder {
  awardId: string;
  studentId: string;
  studentName: string;
  className?: string;
  awardedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  isActive: boolean;
}

/** Students who hold a given badge. RLS scopes the rows: a teacher sees only
 *  holders among their own students; a principal/admin sees all. */
export function useBadgeHolders(badgeId: string) {
  return useQuery({
    queryKey: ['badgeHolders', badgeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.STUDENT_BADGES)
        .select('*, students(first_name, last_name, classes(name))')
        .eq('badge_id', badgeId)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((row): BadgeHolder => {
          const d = row as Record<string, unknown>;
          const s = (d.students as Record<string, unknown> | null) ?? {};
          const klass = s.classes as Record<string, unknown> | null;
          const revoked = (d.revoked_at as string | null) ?? undefined;
          const expires = (d.expires_at as string | null) ?? undefined;
          const isActive = !revoked && (!expires || new Date(expires).getTime() > Date.now());
          return {
            awardId: d.id as string,
            studentId: d.student_id as string,
            studentName: `${(s.first_name as string) ?? ''} ${(s.last_name as string) ?? ''}`.trim() || 'Student',
            className: klass?.name as string | undefined,
            awardedAt: d.awarded_at as string,
            expiresAt: expires,
            revokedAt: revoked,
            isActive,
          };
        })
        .sort((a, b) => Number(b.isActive) - Number(a.isActive));
    },
    enabled: !!badgeId,
  });
}

// ── Badge definition CRUD ────────────────────────────────────────────────────

export interface BadgePayload {
  schoolId: string;
  classId?: string | null; // null/undefined → school-wide
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy?: string;
}

export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: BadgePayload) => {
      const { data, error } = await supabase
        .from(TABLES.BADGES)
        .insert({
          school_id: p.schoolId,
          class_id: p.classId ?? null,
          name: p.name.trim(),
          description: p.description?.trim() || null,
          image_url: p.imageUrl ?? null,
          created_by: p.createdBy ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  });
}

export function useUpdateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; name?: string; description?: string | null; imageUrl?: string }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (p.name !== undefined) update.name = p.name.trim();
      if (p.description !== undefined) update.description = p.description ? p.description.trim() : null;
      if (p.imageUrl !== undefined) update.image_url = p.imageUrl;
      const { error } = await supabase.from(TABLES.BADGES).update(update).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  });
}

/** Soft-delete: keeps awarded history intact (badge_id references remain valid). */
export function useArchiveBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.BADGES).update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  });
}

/** Upload a badge image to the public badge-images bucket; returns its path. */
export function useUploadBadgeImage() {
  return useMutation({
    mutationFn: async ({ schoolId, uri }: { schoolId: string; uri: string }) => {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
      const path = `${schoolId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from(STORAGE.BADGE_IMAGES)
        .upload(path, decode(base64), { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
      if (error) throw error;
      return path;
    },
  });
}

// ── Award / revoke (RPC) ─────────────────────────────────────────────────────

export function useAwardBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, badgeId, expiresAt, note }: {
      studentId: string; badgeId: string; expiresAt?: string | null; note?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('award_badge', {
        p_student_id: studentId,
        p_badge_id: badgeId,
        p_expires_at: expiresAt ?? null,
        p_note: note ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['studentBadges', v.studentId] }),
  });
}

export function useRevokeBadge(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (awardId: string) => {
      const { error } = await supabase.rpc('revoke_badge', { p_award_id: awardId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['studentBadges', studentId] }),
  });
}

// Decode base64 string to Uint8Array (Supabase storage upload expects bytes).
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
