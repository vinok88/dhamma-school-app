import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

// Teacher reports use their own classes only.
jest.mock('@/hooks/useClasses', () => ({
  useMyClasses: () => require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2' }]),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useAttendanceReport: jest.fn(),
}));

import TeacherReportsScreen from '../reports';
import { useAttendanceReport } from '@/hooks/useAttendance';

describe('TeacherReportsScreen', () => {
  it('renders report type selector and the teacher\'s class filter', () => {
    (useAttendanceReport as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<TeacherReportsScreen />);
    expect(screen.getByText(/Weekly/i)).toBeTruthy();
    expect(screen.getByText(/Monthly/i)).toBeTruthy();
    expect(screen.getByText('All My Classes')).toBeTruthy();
    expect(screen.getByText('Year 2')).toBeTruthy();
    // Custom date range section (DatePicker itself is globally mocked)
    expect(screen.getByText('Custom range')).toBeTruthy();
  });

  it('shows the report rows after loading', () => {
    (useAttendanceReport as jest.Mock).mockReturnValue(
      queryOk([{ name: 'Anna Perera', present: 3, absent: 1 }]),
    );
    renderScreen(<TeacherReportsScreen />);
    fireEvent.press(screen.getByText('Load Report'));
    expect(screen.getByText('Anna Perera')).toBeTruthy();
    expect(screen.getByText('Export CSV')).toBeTruthy();
  });
});
