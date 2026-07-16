import { useIsFocused } from '@react-navigation/native';

/** Background refresh cadence for low-churn data (Option B). 10 minutes. */
export const BACKGROUND_POLL_MS = 10 * 60 * 1000;

/**
 * React Query `refetchInterval` value that only polls while the screen is
 * focused. Returns `ms` when the screen is visible, otherwise `false` so the
 * interval is paused. This keeps rarely-changing data reasonably fresh without
 * every mounted-but-hidden tab hammering Supabase on a timer.
 *
 * Data that must feel instant (announcements, messages) does NOT use this —
 * it relies on push-driven invalidation instead (see the foreground listener in
 * app/_layout.tsx).
 */
export function useFocusedRefetchInterval(ms: number = BACKGROUND_POLL_MS): number | false {
  const isFocused = useIsFocused();
  return isFocused ? ms : false;
}
