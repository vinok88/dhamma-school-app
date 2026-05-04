import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: jest.fn(),
  useCreateClass: () => require('@/test-utils/fixtures').mutationStub(),
  useUpdateClass: () => require('@/test-utils/fixtures').mutationStub(),
  useDeleteClass: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/hooks/useTeachers', () => ({
  useTeachers: () => require('@/test-utils/fixtures').queryOk([
    { id: 't1', fullName: 'Tara Teacher', status: 'active' },
  ]),
}));

import ClassesScreen from '../classes';
import { useClasses } from '@/hooks/useClasses';

describe('ClassesScreen', () => {
  it('shows empty state when no classes exist', () => {
    (useClasses as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<ClassesScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists classes when present', () => {
    (useClasses as jest.Mock).mockReturnValue(
      queryOk([{
        id: 'c1',
        name: 'Year 2',
        gradeLevel: 'Y2',
        teachers: [{ id: 't1', name: 'Tara Teacher' }],
        studentCount: 10,
      }]),
    );
    renderScreen(<ClassesScreen />);
    expect(screen.getByText('Year 2')).toBeTruthy();
  });
});
