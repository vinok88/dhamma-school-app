import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { makeStudent, queryOk } from '@/test-utils/fixtures';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'stu-1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useStudentDetail: jest.fn(),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useStudentAttendanceHistory: () => ({ data: [] }),
}));

import StudentStatusScreen from '../student/[id]';
import { useStudentDetail } from '@/hooks/useStudents';

describe('Parent StudentStatusScreen', () => {
  it('renders student name when loaded', () => {
    (useStudentDetail as jest.Mock).mockReturnValue(
      queryOk(makeStudent({ firstName: 'Anna', lastName: 'Perera' })),
    );
    renderScreen(<StudentStatusScreen />);
    expect(screen.getAllByText(/Anna/).length).toBeGreaterThan(0);
  });

  it('renders nothing when student is missing', () => {
    (useStudentDetail as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    const { toJSON } = renderScreen(<StudentStatusScreen />);
    expect(toJSON()).toBeNull();
  });
});
