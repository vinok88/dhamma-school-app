import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { adminProfile, queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useAllStudents: () => require('@/test-utils/fixtures').queryOk([
    { id: 's1', status: 'active' },
    { id: 's2', status: 'pending' },
  ]),
}));

jest.mock('@/hooks/useTeachers', () => ({
  useTeachers: () => require('@/test-utils/fixtures').queryOk([{ id: 't1', status: 'active' }]),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: () => require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2' }]),
}));

jest.mock('@/hooks/useEvents', () => ({
  useUpcomingEvents: () => require('@/test-utils/fixtures').queryOk([]),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => require('@/test-utils/fixtures').queryOk([]),
}));

jest.mock('@/hooks/useAttendance', () => ({
  useAttendanceReport: () => require('@/test-utils/fixtures').queryOk([]),
}));

jest.mock('@/components/AnnouncementCard', () => ({ AnnouncementCard: () => null }));

import AdminDashboard from '../index';

describe('AdminDashboard', () => {
  it('renders dashboard summary cards', () => {
    renderScreen(<AdminDashboard />);
    // The dashboard has multiple summary sections; just assert render success.
    expect(screen.getAllByText(/Students|Teachers|Classes/i).length).toBeGreaterThan(0);
  });
});
