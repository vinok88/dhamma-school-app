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

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

// Badges UI pulls in @/lib/supabase via useBadges; stub the hook + components.
jest.mock('@/hooks/useBadges', () => ({ useBadges: () => ({ data: [] }) }));
jest.mock('@/components/badges/StudentBadges', () => ({ StudentBadges: () => null }));
jest.mock('@/components/badges/AwardBadgeModal', () => ({ AwardBadgeModal: () => null }));

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
