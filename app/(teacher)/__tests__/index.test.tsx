import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { ...require('@/test-utils/fixtures').teacherProfile, status: 'active' },
    signOut: jest.fn(),
  }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useMyClasses: jest.fn(),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({ data: [] }),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useTodayAttendance: () => ({ data: [] }),
}));

jest.mock('@/components/AnnouncementCard', () => ({ AnnouncementCard: () => null }));

import TeacherHome from '../index';
import { useMyClasses } from '@/hooks/useClasses';

describe('TeacherHome', () => {
  it('shows placeholder when no class is assigned', () => {
    (useMyClasses as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    renderScreen(<TeacherHome />);
    expect(screen.getByText(/Take Attendance/)).toBeTruthy();
    expect(screen.getByText(/been assigned to a class/i)).toBeTruthy();
  });

  it('renders class info when assigned', () => {
    (useMyClasses as jest.Mock).mockReturnValue(
      queryOk([{ id: 'c1', name: 'Year 2', gradeLevel: 'Y2', studentCount: 4 }]),
    );
    renderScreen(<TeacherHome />);
    expect(screen.getByText(/Year 2/)).toBeTruthy();
  });
});
