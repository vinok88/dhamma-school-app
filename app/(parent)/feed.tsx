import React from 'react';
import { NoticeBoard } from '@/components/NoticeBoard';

// Parents view the notice board (calendar + notices/events), read-only.
export default function FeedScreen() {
  return <NoticeBoard />;
}
