import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { STORAGE, TABLES } from '@/constants';

export type TeacherDocKind = 'wwcc' | 'resume';

const COLUMN: Record<TeacherDocKind, 'wwcc_url' | 'resume_url'> = {
  wwcc: 'wwcc_url',
  resume: 'resume_url',
};

// Upload a teacher's WWCC or resume PDF to the private teacher-documents bucket
// (path: <uid>/<kind>.pdf) and record the path on their profile row.
export function useUploadTeacherDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, uri, kind }: { userId: string; uri: string; kind: TeacherDocKind }) => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const path = `${userId}/${kind}.pdf`;
      const { error } = await supabase.storage
        .from(STORAGE.TEACHER_DOCUMENTS)
        .upload(path, decode(base64), { contentType: 'application/pdf', upsert: true });
      if (error) throw error;

      const { error: updateErr } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ [COLUMN[kind]]: path, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (updateErr) throw updateErr;

      return path;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

// On-demand signed URL for a stored teacher document (no caching — signed URLs
// are short-lived and these are sensitive PII).
export async function signTeacherDocUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE.TEACHER_DOCUMENTS)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// Decode base64 string to Uint8Array (Supabase storage upload expects bytes).
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
