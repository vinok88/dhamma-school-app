import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: () => require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2' }]),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useAttendanceReport: jest.fn(),
}));

import ReportsScreen from '../reports';
import { useAttendanceReport } from '@/hooks/useAttendance';

describe('ReportsScreen', () => {
  it('renders report type selector and class filter', () => {
    (useAttendanceReport as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<ReportsScreen />);
    expect(screen.getByText(/Weekly/i)).toBeTruthy();
    expect(screen.getByText(/Monthly/i)).toBeTruthy();
  });
});
