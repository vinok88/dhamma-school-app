import { Alert } from 'react-native';

/**
 * Generic body shown to end-users for any unexpected failure.
 * Keeps Postgres / RLS / network details out of the UI — they leak
 * implementation, scare users, and don't help them recover.
 *
 * Real error details are written to the console (visible in dev tools and
 * Sentry-like logging if configured later).
 */
export const FRIENDLY_ERROR_BODY =
  'Something went wrong. Please try again. If the problem continues, contact the school admin.';

export function showFriendlyError(
  title: string,
  error?: unknown,
  context?: string
) {
  if (error !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(context ? `[${context}]` : '[error]', error);
  }
  Alert.alert(title, FRIENDLY_ERROR_BODY);
}
