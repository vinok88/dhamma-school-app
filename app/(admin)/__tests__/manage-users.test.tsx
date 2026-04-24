import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useUsers', () => ({
  useAllUsers: jest.fn(),
  useChangeUserRole: () => require('@/test-utils/fixtures').mutationStub(),
  useDeactivateUser: () => require('@/test-utils/fixtures').mutationStub(),
}));

import ManageUsersScreen from '../manage-users';
import { useAllUsers } from '@/hooks/useUsers';

describe('ManageUsersScreen', () => {
  it('lists non-elevated users', () => {
    (useAllUsers as jest.Mock).mockReturnValue(
      queryOk([
        { id: 't1', fullName: 'Tara Teacher', role: 'teacher', status: 'active', email: 't@x.test' },
        { id: 'p1', fullName: 'Pat Parent', role: 'parent', status: 'active', email: 'p@x.test' },
        { id: 'a1', fullName: 'Admin One', role: 'admin', status: 'active' },
      ]),
    );
    renderScreen(<ManageUsersScreen />);
    // This screen only shows results after the user types a search term
    fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'a');
    expect(screen.getByText('Tara Teacher')).toBeTruthy();
    expect(screen.getByText('Pat Parent')).toBeTruthy();
    // Admin users should not be listed in this screen (managed via AdminsScreen)
    expect(screen.queryByText('Admin One')).toBeNull();
  });

  it('filters users by search', () => {
    (useAllUsers as jest.Mock).mockReturnValue(
      queryOk([
        { id: 't1', fullName: 'Tara Teacher', role: 'teacher', status: 'active' },
        { id: 'p1', fullName: 'Pat Parent', role: 'parent', status: 'active' },
      ]),
    );
    renderScreen(<ManageUsersScreen />);
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(search, 'Tara');
    expect(screen.getByText('Tara Teacher')).toBeTruthy();
    expect(screen.queryByText('Pat Parent')).toBeNull();
  });
});
