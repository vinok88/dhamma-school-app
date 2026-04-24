import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, makeStudent, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useAllStudents: jest.fn(),
  useUpdateStudentStatus: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
}));

import StudentsScreen from '../students';
import { useAllStudents } from '@/hooks/useStudents';

describe('Admin StudentsScreen', () => {
  it('shows empty state when no students match', () => {
    (useAllStudents as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<StudentsScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists students and filters by search', () => {
    (useAllStudents as jest.Mock).mockReturnValue(
      queryOk([
        makeStudent({ id: 's1', firstName: 'Anna', lastName: 'Smith', status: 'active' }),
        makeStudent({ id: 's2', firstName: 'Ben', lastName: 'Jones', status: 'active' }),
      ]),
    );
    renderScreen(<StudentsScreen />);
    expect(screen.getByText('Anna Smith')).toBeTruthy();
    expect(screen.getByText('Ben Jones')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText(/search/i), 'Anna');
    expect(screen.getByText('Anna Smith')).toBeTruthy();
    expect(screen.queryByText('Ben Jones')).toBeNull();
  });
});
