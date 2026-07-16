import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/hooks/useEvents', () => ({
  useEvents: () => ({ data: [], isLoading: false }),
}));

import TeacherFeedScreen from '../feed';

describe('TeacherFeedScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows the notice board with a send-announcement action', () => {
    renderScreen(<TeacherFeedScreen />);
    expect(screen.getByText(/Notices & Events/)).toBeTruthy();
    expect(screen.getByText(/Announce/)).toBeTruthy();
  });

  it('navigates to the announce compose screen when tapped', () => {
    renderScreen(<TeacherFeedScreen />);
    fireEvent.press(screen.getByText(/Announce/));
    expect(mockPush).toHaveBeenCalledWith('/(teacher)/announce');
  });
});
