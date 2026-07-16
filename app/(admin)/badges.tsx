import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BadgeManager } from '@/components/badges/BadgeManager';

// Principal/admin: manage school-wide achievement badges.
export default function AdminBadgesScreen() {
  const { profile } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Badges 🏅" showBack dark />
      <BadgeManager schoolId={profile?.schoolId ?? ''} scope="school" createdBy={profile?.id} />
    </SafeAreaView>
  );
}
