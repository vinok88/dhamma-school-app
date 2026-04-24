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

import TeacherStudentDetail from '../student/[id]';
import { useStudentDetail } from '@/hooks/useStudents';

describe('Teacher StudentDetailScreen', () => {
  it('renders student when loaded', () => {
    (useStudentDetail as jest.Mock).mockReturnValue(
      queryOk(makeStudent({ firstName: 'Anna' })),
    );
    renderScreen(<TeacherStudentDetail />);
    expect(screen.getAllByText(/Anna/).length).toBeGreaterThan(0);
  });
});
