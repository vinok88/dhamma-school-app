import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useEvents', () => ({
  useEvents: jest.fn(),
  useCreateEvent: () => require('@/test-utils/fixtures').mutationStub(),
  useDeleteEvent: () => require('@/test-utils/fixtures').mutationStub(),
}));

jest.mock('@/components/EventCard', () => {
  const { Text } = require('react-native');
  return { EventCard: ({ event }: any) => <Text>{event.title}</Text> };
});

import EventsScreen from '../events';
import { useEvents } from '@/hooks/useEvents';

describe('Admin EventsScreen', () => {
  it('shows empty state when no events', () => {
    (useEvents as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<EventsScreen />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('lists events when present', () => {
    (useEvents as jest.Mock).mockReturnValue(
      queryOk([{ id: 'e1', title: 'Poya Day', startDatetime: new Date().toISOString(), eventType: 'poya' }]),
    );
    renderScreen(<EventsScreen />);
    expect(screen.getByText('Poya Day')).toBeTruthy();
  });
});
