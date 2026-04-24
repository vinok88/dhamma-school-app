import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { parentProfile, makeStudent, queryOk } from '@/test-utils/fixtures';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
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

  it('shows empty state when no children registered', () => {
    (useMyStudents as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<ParentHome />);
    expect(screen.getByText(/No children registered/)).toBeTruthy();
    expect(screen.getByText('Register a Child')).toBeTruthy();
  });

  it('lists children and routes to register on CTA tap', () => {
    (useMyStudents as jest.Mock).mockReturnValue(queryOk([makeStudent({ firstName: 'Anna' })]));
    renderScreen(<ParentHome />);
    expect(screen.getByText(/Anna/)).toBeTruthy();
    fireEvent.press(screen.getByText('Register a Child'));
    expect(mockPush).toHaveBeenCalledWith('/(parent)/register-student');
  });
});
