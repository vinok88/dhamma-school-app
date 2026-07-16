import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useMyClasses } from '@/hooks/useClasses';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BadgeManager } from '@/components/badges/BadgeManager';

// Teacher: manage class-wide badges for their own classes.
export default function TeacherBadgesScreen() {
  const { profile } = useAuth();
  const { data: classes } = useMyClasses(profile?.id ?? '');
  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title="Class Badges 🏅" showBack />
      <BadgeManager
        schoolId={profile?.schoolId ?? ''}
        scope="class"
        classes={classes ?? []}
        createdBy={profile?.id}
      />
    </SafeAreaView>
  );
}
