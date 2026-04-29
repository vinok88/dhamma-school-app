import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES, STORAGE } from '@/constants';
import * as FileSystem from 'expo-file-system';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      fullName: string;
      preferredName?: string;
      phone?: string;
      address?: string;
    }) => {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({
          full_name: payload.fullName,
          preferred_name: payload.preferredName,
          phone: payload.phone,
          address: payload.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUploadProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, uri }: { userId: string; uri: string }) => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `${userId}/profile.${ext}`;
      const { error } = await supabase.storage
        .from(STORAGE.PROFILE_PHOTOS)
        .upload(path, decode(base64), { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;

      // Persist the path on the user's profile so other places (header avatars,
      // admin views) pick it up after a refresh.
      const { error: updateErr } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ profile_photo_url: path, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (updateErr) throw updateErr;

      return path;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUploadStudentPhoto() {
  return useMutation({
    mutationFn: async ({ studentId, uri }: { studentId: string; uri: string }) => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split('.').pop() ?? 'jpg';
      const path = `${studentId}/photo.${ext}`;
      const { error } = await supabase.storage
        .from(STORAGE.STUDENT_PHOTOS)
        .upload(path, decode(base64), { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      // Return path so caller can persist it; signed URLs are generated on display
      return path;
    },
  });
}

export function useStudentPhotoUrl(path: string | undefined) {
  return useQuery({
    queryKey: ['signed-url', STORAGE.STUDENT_PHOTOS, path],
    queryFn: async () => {
      const { data } = await supabase.storage
        .from(STORAGE.STUDENT_PHOTOS)
        .createSignedUrl(path!, 3600);
      return data?.signedUrl ?? null;
    },
    enabled: !!path && !path.startsWith('http'),
    staleTime: 50 * 60 * 1000, // 50 min — refresh before 1-hour expiry
  });
}

export function useProfilePhotoUrl(path: string | undefined) {
  return useQuery({
    queryKey: ['signed-url', STORAGE.PROFILE_PHOTOS, path],
    queryFn: async () => {
      const { data } = await supabase.storage
        .from(STORAGE.PROFILE_PHOTOS)
        .createSignedUrl(path!, 3600);
      return data?.signedUrl ?? null;
    },
    enabled: !!path && !path.startsWith('http'),
    staleTime: 50 * 60 * 1000,
  });
}

// Decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
