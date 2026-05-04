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

// SwitchProfile transitively pulls in @/lib/supabase via useStudents — stub it.
jest.mock('@/hooks/useStudents', () => ({
  useMyStudents: () => ({ data: [] }),
}));

import MoreScreen from '../more';
import { useAuth } from '@/hooks/useAuth';

const baseAuth = { viewMode: null as any, setViewMode: jest.fn(), signOut: jest.fn() };

describe('Admin MoreScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows Manage Admins for admin role', () => {
    (useAuth as jest.Mock).mockReturnValue({ ...baseAuth, profile: adminProfile });
    renderScreen(<MoreScreen />);
    expect(screen.getByText('Manage Admins')).toBeTruthy();
    expect(screen.queryByText('Manage Users')).toBeNull();
  });

  it('shows Manage Users for principal role', () => {
    (useAuth as jest.Mock).mockReturnValue({ ...baseAuth, profile: principalProfile });
    renderScreen(<MoreScreen />);
    expect(screen.getByText('Manage Users')).toBeTruthy();
    expect(screen.queryByText('Manage Admins')).toBeNull();
  });

  it('routes via the menu items', () => {
    (useAuth as jest.Mock).mockReturnValue({ ...baseAuth, profile: adminProfile });
    renderScreen(<MoreScreen />);
    fireEvent.press(screen.getByText('Teachers'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/teachers');
  });
});
