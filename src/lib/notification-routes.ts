// Shared routing for both in-app notification taps and OS push-notification taps.

import { UserRole } from '@/types';

export interface NotificationData {
  type?: string;
  reference_id?: string;
  announcement_type?: string;
  [key: string]: unknown;
}

export interface PushDestination {
  pathname: string;
  params?: Record<string, string>;
}

function isAdminOrPrincipal(role?: UserRole) {
  return role === 'admin' || role === 'principal';
}

/**
 * Derive an Expo Router destination from an FCM `data` payload.
 * The `data` shape is what `send-notification` Edge Function publishes.
 */
export function destinationFromPushData(
  data: NotificationData,
  role?: UserRole,
): PushDestination | null {
  if (!data || typeof data.type !== 'string') return null;

  switch (data.type) {
    case 'announcement':
      return {
        pathname: role === 'teacher' ? '/(teacher)' : '/(parent)/feed',
        params: data.reference_id ? { announcementId: String(data.reference_id) } : undefined,
      };
    case 'message':
      return data.reference_id
        ? { pathname: `/messages/${data.reference_id}` }
        : { pathname: '/(parent)' };
    case 'event':
      return {
        pathname: role === 'parent' ? '/(parent)/feed' : '/(teacher)',
        params: data.reference_id ? { eventId: String(data.reference_id) } : undefined,
      };
    case 'registration':
      return { pathname: isAdminOrPrincipal(role) ? '/(admin)/students' : '/(parent)' };
    case 'attendance':
      return { pathname: role === 'teacher' ? '/(teacher)/attendance' : '/(parent)' };
    default:
      return null;
  }
}
