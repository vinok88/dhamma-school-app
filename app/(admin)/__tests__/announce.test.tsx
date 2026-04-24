import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').adminProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: () => require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2' }]),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useCreateAnnouncement: () => require('@/test-utils/fixtures').mutationStub(),
}));

import AdminAnnounceScreen from '../announce';

describe('AdminAnnounceScreen', () => {
  it('renders the compose form and publish button', () => {
    renderScreen(<AdminAnnounceScreen />);
    expect(screen.getByPlaceholderText('Announcement headline')).toBeTruthy();
    expect(screen.getByText(/Publish/)).toBeTruthy();
  });
});
