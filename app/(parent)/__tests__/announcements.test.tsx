import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'p1', schoolId: 'school-1' } }),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: jest.fn(),
}));

jest.mock('@/components/AnnouncementCard', () => {
  const { Text } = require('react-native');
  return {
    AnnouncementCard: ({ announcement }: any) => <Text>{announcement.title}</Text>,
  };
});

import AnnouncementsScreen from '../announcements';
import { useAnnouncements } from '@/hooks/useAnnouncements';

describe('AnnouncementsScreen', () => {
  it('renders filter chips and announcement list', () => {
    (useAnnouncements as jest.Mock).mockReturnValue(
      queryOk([
        { id: 'a1', title: 'School notice', type: 'school' },
        { id: 'a2', title: 'Class update', type: 'class' },
        { id: 'a3', title: 'Emergency!', type: 'emergency' },
      ]),
    );

    renderScreen(<AnnouncementsScreen />);

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('School')).toBeTruthy();
    expect(screen.getByText('School notice')).toBeTruthy();
    expect(screen.getByText('Emergency!')).toBeTruthy();
  });

  it('filters announcements when a chip is selected', () => {
    (useAnnouncements as jest.Mock).mockReturnValue(
      queryOk([
        { id: 'a1', title: 'School notice', type: 'school' },
        { id: 'a2', title: 'Class update', type: 'class' },
      ]),
    );
    renderScreen(<AnnouncementsScreen />);
    fireEvent.press(screen.getByText('Class'));
    expect(screen.queryByText('School notice')).toBeNull();
    expect(screen.getByText('Class update')).toBeTruthy();
  });
});
