import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, makeStudent, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  usePendingStudents: jest.fn(),
  useApproveStudent: () => require('@/test-utils/fixtures').mutationStub(),
  useRejectStudent: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/hooks/useTeachers', () => ({
  usePendingTeachers: jest.fn(),
  useApproveTeacher: () => require('@/test-utils/fixtures').mutationStub(),
  useRejectTeacher: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: () => require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2' }]),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
  useProfilePhotoUrl: () => ({ data: undefined }),
}));

import RegistrationsScreen from '../registrations';
import { usePendingStudents } from '@/hooks/useStudents';
import { usePendingTeachers } from '@/hooks/useTeachers';

describe('RegistrationsScreen', () => {
  it('shows empty state when no pending registrations', () => {
    (usePendingStudents as jest.Mock).mockReturnValue(queryOk([]));
    (usePendingTeachers as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<RegistrationsScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists pending students', () => {
    (usePendingStudents as jest.Mock).mockReturnValue(
      queryOk([makeStudent({ id: 's1', firstName: 'Anna', status: 'pending' })]),
    );
    (usePendingTeachers as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<RegistrationsScreen />);
    expect(screen.getByText(/Anna/)).toBeTruthy();
  });
});
