import React from 'react';
import { useRouter } from 'expo-router';
import { NoticeBoard } from '@/components/NoticeBoard';

// Teachers see the notice board plus a "Send announcement" action that opens the
// existing class-announcement compose screen.
export default function TeacherFeedScreen() {
  const router = useRouter();
  return <NoticeBoard onSendAnnouncement={() => router.push('/(teacher)/announce')} />;
}
