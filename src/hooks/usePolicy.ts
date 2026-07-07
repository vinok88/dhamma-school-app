import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TABLES,
  PHOTO_CONSENT_POLICY_TITLE,
  PHOTO_CONSENT_POLICY_BODY,
  PHOTO_CONSENT_POLICY_URL,
} from '@/constants';
import { readPolicyCache, writePolicyCache, CachedPolicy } from '@/utils/policyCache';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // one week

export interface PolicyContent {
  title: string;
  body: string;
  url: string;
}

export interface PolicyFallback {
  title: string;
  body: string;
  url?: string;
}

/**
 * Fetches an editable policy document from Supabase, cached on-device for a week
 * so wording can change without an app release. What the caller sees, in order:
 *   1. the bundled fallback (instant, offline-safe first render)
 *   2. the on-device cache from a previous fetch
 *   3. a fresh network value (only when the cache is missing or older than a week)
 */
export function usePolicy(key: string, fallback: PolicyFallback): PolicyContent {
  const [policy, setPolicy] = useState<PolicyContent>({
    title: fallback.title,
    body: fallback.body,
    url: fallback.url ?? '',
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await readPolicyCache(key);
      if (cached && !cancelled) {
        setPolicy({ title: cached.title, body: cached.body, url: cached.url ?? '' });
      }

      // Honour the week-long cache — don't hit the network while it's fresh.
      const fresh = !!cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
      if (fresh) return;

      try {
        const { data, error } = await supabase
          .from(TABLES.POLICIES)
          .select('title, body, url')
          .eq('key', key)
          .single();
        if (error || !data || cancelled) return;

        const next: CachedPolicy = {
          title: data.title as string,
          body: data.body as string,
          url: (data.url as string | null) ?? null,
          fetchedAt: Date.now(),
        };
        setPolicy({ title: next.title, body: next.body, url: next.url ?? '' });
        await writePolicyCache(key, next);
      } catch {
        // offline / error — keep the cached or bundled value
      }
    })();

    return () => { cancelled = true; };
  }, [key]);

  return policy;
}

/** The photo-consent policy, with the bundled copy as fallback. */
export function usePhotoConsentPolicy(): PolicyContent {
  return usePolicy('photo_consent', {
    title: PHOTO_CONSENT_POLICY_TITLE,
    body: PHOTO_CONSENT_POLICY_BODY,
    url: PHOTO_CONSENT_POLICY_URL,
  });
}
