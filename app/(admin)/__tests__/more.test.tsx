import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { adminProfile, principalProfile } from '@/test-utils/fixtures';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import MoreScreen from '../more';
import { useAuth } from '@/hooks/useAuth';

describe('Admin MoreScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows Manage Admins for admin role', () => {
    (useAuth as jest.Mock).mockReturnValue({ profile: adminProfile, signOut: jest.fn() });
    renderScreen(<MoreScreen />);
    expect(screen.getByText('Manage Admins')).toBeTruthy();
    expect(screen.queryByText('Manage Users')).toBeNull();
  });

  it('shows Manage Users for principal role', () => {
    (useAuth as jest.Mock).mockReturnValue({ profile: principalProfile, signOut: jest.fn() });
    renderScreen(<MoreScreen />);
    expect(screen.getByText('Manage Users')).toBeTruthy();
    expect(screen.queryByText('Manage Admins')).toBeNull();
  });

  it('routes via the menu items', () => {
    (useAuth as jest.Mock).mockReturnValue({ profile: adminProfile, signOut: jest.fn() });
    renderScreen(<MoreScreen />);
    fireEvent.press(screen.getByText('Teachers'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/teachers');
  });
});
