import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, queryLoading } from '@/test-utils/fixtures';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'a1', title: 'School Notice' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncementViewStats: jest.fn(),
}));

import AnnouncementStatsScreen from '../announcement-stats';
import { useAnnouncementViewStats } from '@/hooks/useAnnouncements';

describe('AnnouncementStatsScreen', () => {
  it('shows loading spinner while fetching', () => {
    (useAnnouncementViewStats as jest.Mock).mockReturnValue(queryLoading());
    renderScreen(<AnnouncementStatsScreen />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders recipient list when loaded', () => {
    (useAnnouncementViewStats as jest.Mock).mockReturnValue(
      queryOk([
        { user_id: 'u1', full_name: 'Alice Parent', role: 'parent', viewed: true, viewed_at: '2026-01-01T00:00:00Z' },
        { user_id: 'u2', full_name: 'Bob Parent', role: 'parent', viewed: false, viewed_at: null },
      ]),
    );
    renderScreen(<AnnouncementStatsScreen />);
    expect(screen.getByText('Alice Parent')).toBeTruthy();
    expect(screen.getByText('Bob Parent')).toBeTruthy();
  });
});
