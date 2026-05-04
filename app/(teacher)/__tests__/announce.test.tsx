import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { teacherProfile, queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useMyClass: () => require('@/test-utils/fixtures').queryOk({ id: 'c1', name: 'Year 2' }),
  useMyClasses: () =>
    require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2', gradeLevel: 'Year 2', studentCount: 0 }]),
}));

jest.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => require('@/test-utils/fixtures').queryOk([]),
  useCreateAnnouncement: () => require('@/test-utils/fixtures').mutationStub(),
}));

import SendAnnouncementScreen from '../announce';

describe('Teacher SendAnnouncementScreen', () => {
  it('renders title and body inputs and a send button', () => {
    renderScreen(<SendAnnouncementScreen />);
    expect(screen.getByPlaceholderText('Announcement title')).toBeTruthy();
    expect(screen.getByText('Publish Announcement')).toBeTruthy();
  });
});
