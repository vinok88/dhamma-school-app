import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, mutationStub } from '@/test-utils/fixtures';

const mockPush = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
  useDeleteNotification: () => ({ mutate: (...a: any[]) => mockDelete(...a), isPending: false }),
  useClearAllNotifications: () => require('@/test-utils/fixtures').mutationStub(),
}));

import NotificationsScreen from '../notifications';
import { useNotifications } from '@/hooks/useNotifications';

describe('NotificationsScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockDelete.mockClear();
  });

  it('shows empty state when no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<NotificationsScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists notifications and navigates on tap', () => {
    (useNotifications as jest.Mock).mockReturnValue(
      queryOk([
        {
          id: 'n1',
          title: 'New announcement',
          body: 'Important update',
          type: 'announcement',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    renderScreen(<NotificationsScreen />);
    expect(screen.getByText('New announcement')).toBeTruthy();
    fireEvent.press(screen.getByText('New announcement'));
    expect(mockDelete).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(parent)/announcements');
  });
});
