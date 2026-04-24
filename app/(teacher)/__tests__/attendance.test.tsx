import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { teacherProfile, makeStudent, queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useMyClass: () => require('@/test-utils/fixtures').queryOk({ id: 'c1', name: 'Year 2' }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useClassStudents: jest.fn(),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useTodayAttendance: () => ({ data: [] }),
  useCheckIn: () => require('@/test-utils/fixtures').mutationStub(),
  useCheckOut: () => require('@/test-utils/fixtures').mutationStub(),
  useMarkAbsent: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
}));

import AttendanceScreen from '../attendance';
import { useClassStudents } from '@/hooks/useStudents';

describe('Teacher AttendanceScreen', () => {
  it('shows empty state when class has no students', () => {
    (useClassStudents as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<AttendanceScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('renders class students as attendance rows', () => {
    (useClassStudents as jest.Mock).mockReturnValue(
      queryOk([makeStudent({ id: 's1', firstName: 'Anna' })]),
    );
    renderScreen(<AttendanceScreen />);
    expect(screen.getByText(/Anna/)).toBeTruthy();
  });
});
