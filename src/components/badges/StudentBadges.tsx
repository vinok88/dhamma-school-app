import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useStudentBadges, useRevokeBadge } from '@/hooks/useBadges';
import { BadgeAvatar } from './AchievementBadge';
import { COLORS } from '@/constants';
import { formatDate } from '@/utils/date';
import { showFriendlyError } from '@/utils/errors';
import { StudentBadgeModel } from '@/types';

/** A student's earned badges — active first, expired/removed greyed with a tag.
 *  `canManage` (teacher/principal) shows a Remove action on active badges. */
export function StudentBadges({ studentId, canManage = false }: { studentId: string; canManage?: boolean }) {
  const { data: badges, isLoading } = useStudentBadges(studentId);
  const revoke = useRevokeBadge(studentId);

  if (isLoading) return null;
  if (!badges?.length) {
    return <Text className="text-sm text-text-muted">No badges yet.</Text>;
  }

  function confirmRevoke(award: StudentBadgeModel) {
    Alert.alert('Remove badge', `Remove "${award.badge?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { await revoke.mutateAsync(award.id); }
          catch (e: unknown) { showFriendlyError("Couldn't remove badge", e, 'revoke-badge'); }
        },
      },
    ]);
  }

  return (
    <View>
      {badges.map((b) => (
        <View key={b.id} className="flex-row items-center py-2 border-b border-gray-50">
          <View style={{ opacity: b.isActive ? 1 : 0.45 }}>
            <BadgeAvatar imageUrl={b.badge?.imageUrl} size={44} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-sm font-sans-semibold text-text-primary">{b.badge?.name ?? 'Badge'}</Text>
            {b.badge?.description ? (
              <Text className="text-xs text-text-muted" numberOfLines={2}>{b.badge.description}</Text>
            ) : null}
            <Text className="text-xs mt-0.5" style={{ color: b.isActive ? COLORS.success : COLORS.textMuted }}>
              {b.revokedAt
                ? 'Removed'
                : !b.isActive
                  ? `Expired${b.expiresAt ? ' ' + formatDate(b.expiresAt) : ''}`
                  : b.expiresAt
                    ? `Expires ${formatDate(b.expiresAt)}`
                    : `Awarded ${formatDate(b.awardedAt)}`}
            </Text>
          </View>
          {canManage && b.isActive ? (
            <TouchableOpacity onPress={() => confirmRevoke(b)} className="px-2 py-1">
              <Text className="text-error text-xs">Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}
