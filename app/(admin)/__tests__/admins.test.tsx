import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';

const mockMutate = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'me', schoolId: 'school-1', role: 'admin', fullName: 'Me Admin' },
  }),
}));

jest.mock('@/hooks/useUsers', () => ({
  useAllUsers: () => ({
    isLoading: false,
    data: [
      { id: 'me', fullName: 'Me Admin', role: 'admin', status: 'active', email: 'me@x.test' },
      { id: 'p1', fullName: 'Princy Person', role: 'principal', status: 'active', email: 'p1@x.test' },
      { id: 't1', fullName: 'Tara Teacher', role: 'teacher', status: 'active', email: 't1@x.test' },
      { id: 'pa1', fullName: 'Pat Parent', role: 'parent', status: 'active', email: 'pa1@x.test' },
      { id: 't2', fullName: 'Inactive Teacher', role: 'teacher', status: 'inactive', email: 't2@x.test' },
    ],
  }),
  useChangeUserRole: () => ({ mutate: mockMutate }),
}));

// Avoid pulling SafeAreaProvider context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

// UI primitives — render minimally so we don't depend on their internals
jest.mock('@/components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@/components/ui/Badge', () => {
  const { Text } = require('react-native');
  return { Badge: ({ label }: { label: string }) => <Text>{label}</Text> };
});
jest.mock('@/components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => null }));
jest.mock('@/components/ui/EmptyState', () => {
  const { Text } = require('react-native');
  return { EmptyState: ({ title }: { title: string }) => <Text>{title}</Text> };
});
jest.mock('@/components/ui/ScreenHeader', () => {
  const { Text } = require('react-native');
  return { ScreenHeader: ({ title }: { title: string }) => <Text>{title}</Text> };
});
jest.mock('@/components/ui/UserDetailModal', () => ({ UserDetailModal: () => null }));

import AdminsScreen from '../admins';

describe('AdminsScreen', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('lists current admins and principals (excluding the Remove button for self)', () => {
    render(<AdminsScreen />);
    expect(screen.getByText(/Me Admin/)).toBeTruthy();
    expect(screen.getByText('Princy Person')).toBeTruthy();
    // "(You)" suffix appears next to current user
    expect(screen.getByText(/Me Admin \(You\)/)).toBeTruthy();
  });

  it('filters non-elevated users by search and promotes via confirmation alert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      // Auto-press the "Promote" button
      const btn = buttons?.find((b) => b.text === 'Promote');
      btn?.onPress?.();
    });

    render(<AdminsScreen />);

    // Initially the search prompt is shown
    expect(screen.getByText(/Type a name to search/)).toBeTruthy();

    // Search for Tara
    fireEvent.changeText(screen.getByPlaceholderText('Search users by name…'), 'tara');

    // Inactive teacher should not appear
    expect(screen.queryByText('Inactive Teacher')).toBeNull();
    // Pat Parent should not appear (doesn't match search)
    expect(screen.queryByText('Pat Parent')).toBeNull();
    // Tara Teacher should appear
    expect(screen.getByText('Tara Teacher')).toBeTruthy();

    fireEvent.press(screen.getByText('Promote'));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalledWith({ userId: 't1', role: 'principal' });
  });

  it('refuses to demote the current user', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockClear();
    render(<AdminsScreen />);

    // Only the principal "Princy Person" has a Remove button (Me Admin is self)
    fireEvent.press(screen.getByText('Remove'));
    expect(alertSpy).toHaveBeenCalled();
  });
});
