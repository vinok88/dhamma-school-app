import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'p1', schoolId: 'school-1' } }),
}));

jest.mock('@/hooks/useEvents', () => ({
  useEvents: jest.fn(),
}));

jest.mock('@/components/EventCard', () => {
  const { Text } = require('react-native');
  return {
    EventCard: ({ event }: any) => <Text>{event.title}</Text>,
  };
});

import CalendarScreen from '../calendar';
import { useEvents } from '@/hooks/useEvents';

describe('CalendarScreen', () => {
  it('renders without events', () => {
    (useEvents as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<CalendarScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('shows events for the selected day when present', () => {
    const today = new Date().toISOString();
    (useEvents as jest.Mock).mockReturnValue(
      queryOk([{ id: 'e1', title: 'Poya Day', startDatetime: today }]),
    );
    renderScreen(<CalendarScreen />);
    expect(screen.getByText('Poya Day')).toBeTruthy();
  });
});
