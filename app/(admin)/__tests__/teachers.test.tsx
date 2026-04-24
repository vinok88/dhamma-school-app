import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useTeachers', () => ({
  useTeachers: jest.fn(),
  useDeactivateTeacher: () => require('@/test-utils/fixtures').mutationStub(),
}));

import TeachersScreen from '../teachers';
import { useTeachers } from '@/hooks/useTeachers';

describe('Admin TeachersScreen', () => {
  it('shows empty state when no teachers', () => {
    (useTeachers as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<TeachersScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists teachers and filters by search', () => {
    (useTeachers as jest.Mock).mockReturnValue(
      queryOk([
        { id: 't1', fullName: 'Tara Teacher', status: 'active', phone: '123' },
        { id: 't2', fullName: 'Sam Senior', status: 'inactive', phone: '456' },
      ]),
    );
    renderScreen(<TeachersScreen />);
    expect(screen.getByText('Tara Teacher')).toBeTruthy();
    expect(screen.getByText('Sam Senior')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'Tara');
    expect(screen.getByText('Tara Teacher')).toBeTruthy();
    expect(screen.queryByText('Sam Senior')).toBeNull();
  });
});
