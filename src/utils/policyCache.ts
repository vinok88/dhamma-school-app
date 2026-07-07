import * as FileSystem from 'expo-file-system';

export interface CachedPolicy {
  title: string;
  body: string;
  url: string | null;
  fetchedAt: number; // epoch ms of last successful fetch
}

function cachePath(key: string): string {
  return `${FileSystem.documentDirectory ?? ''}policy_${key}.json`;
}

/** Read a previously cached policy from disk, or null if absent/unreadable. */
export async function readPolicyCache(key: string): Promise<CachedPolicy | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(cachePath(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.body === 'string' && typeof parsed.fetchedAt === 'number') {
      return parsed as CachedPolicy;
    }
    return null;
  } catch {
    return null; // file not found / unreadable
  }
}

/** Persist a policy to disk (non-fatal on failure). */
export async function writePolicyCache(key: string, data: CachedPolicy): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(cachePath(key), JSON.stringify(data));
  } catch {
    // non-fatal — the in-memory value is still shown this session
  }
}
