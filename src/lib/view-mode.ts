import { UserRole } from '@/types';

/**
 * Returns the list of view-modes a user with `actualRole` is allowed to enter.
 *
 * - parent / guest: only their own view.
 * - teacher: own + parent (only when they have ≥1 linked child).
 * - admin / principal: own + teacher + parent.
 *
 * The DB role is unchanged when switching — this is purely a client UI mode.
 * RLS continues to evaluate against the actual role.
 */
export function availableViewModes(
  actualRole: UserRole | undefined,
  hasLinkedChildren: boolean
): UserRole[] {
  switch (actualRole) {
    case 'admin':
    case 'principal':
      return [actualRole, 'teacher', 'parent'];
    case 'teacher':
      return hasLinkedChildren ? ['teacher', 'parent'] : ['teacher'];
    case 'parent':
      return ['parent'];
    case 'guest':
      return ['guest'];
    default:
      return [];
  }
}

/**
 * Map a view-mode role to its top-level expo-router segment.
 * Mirrors the routing in app/_layout.tsx.
 */
export function routeForViewMode(role: UserRole): `/(${string})` {
  if (role === 'parent') return '/(parent)';
  if (role === 'teacher') return '/(teacher)';
  if (role === 'guest') return '/(guest)';
  return '/(admin)'; // admin + principal
}

export const VIEW_MODE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  parent: 'Parent',
  guest: 'Guest',
};

export const VIEW_MODE_ICON: Record<UserRole, string> = {
  admin: '🛡️',
  principal: '🛡️',
  teacher: '👩‍🏫',
  parent: '👨‍👩‍👧',
  guest: '👤',
};
