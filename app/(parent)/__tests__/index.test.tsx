import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { makeStudent, queryOk } from '@/test-utils/fixtures';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: require('@/test-utils/fixtures').parentProfile,
    refreshMyRole: jest.fn().mockResolvedValue('parent'),
  }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useMyStudents: jest.fn(),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
}));

import ParentHome from '../index';
import { useMyStudents } from '@/hooks/useStudents';

describe('ParentHome', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows empty state when no children linked', () => {
    (useMyStudents as jest.Mock).mockReturnValue({ ...queryOk([]), refetch: jest.fn() });
    renderScreen(<ParentHome />);
    expect(screen.getByText(/No children linked yet/)).toBeTruthy();
  });

  it('lists children', () => {
    (useMyStudents as jest.Mock).mockReturnValue({
      ...queryOk([makeStudent({ firstName: 'Anna' })]),
      refetch: jest.fn(),
    });
    renderScreen(<ParentHome />);
    expect(screen.getByText(/Anna/)).toBeTruthy();
  });
});
