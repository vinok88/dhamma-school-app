import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/constants';

export interface ExistingParent {
  email: string;
  name: string;
  phone?: string;
}

/**
 * Type-ahead search over parent emails already present on `student_parents`.
 * Used by the principal's add-student form so a sibling can reuse an existing
 * parent without re-typing email/phone.
 */
export function useSearchParents(query: string) {
  return useQuery({
    queryKey: ['parents', 'search', query.trim().toLowerCase()],
    queryFn: async () => {
      const q = query.trim();
      if (q.length < 2) return [] as ExistingParent[];
      const { data, error } = await supabase
        .from(TABLES.STUDENT_PARENTS)
        .select('parent_email, parent_name, parent_phone')
        .ilike('parent_name', `%${q}%`)
        .limit(40);
      if (error) throw error;

      const seen = new Set<string>();
      const unique: ExistingParent[] = [];
      for (const r of (data ?? []) as Record<string, unknown>[]) {
        const email = (r.parent_email as string | null | undefined)?.toLowerCase();
        if (!email || seen.has(email)) continue;
        seen.add(email);
        unique.push({
          email,
          name: (r.parent_name as string | null | undefined) ?? '',
          phone: (r.parent_phone as string | null | undefined) ?? undefined,
        });
      }
      return unique.slice(0, 10);
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
