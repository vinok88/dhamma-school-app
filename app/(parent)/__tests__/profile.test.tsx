import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { parentProfile, mutationStub } from '@/test-utils/fixtures';

const mockSignOut = jest.fn(async () => undefined);

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: require('@/test-utils/fixtures').parentProfile,
    signOut: mockSignOut,
  }),
}));

jest.mock('@/hooks/useProfile', () => ({
  useUpdateProfile: () => require('@/test-utils/fixtures').mutationStub(),
  useUploadProfilePhoto: () => require('@/test-utils/fixtures').mutationStub(),
  useProfilePhotoUrl: () => ({ data: undefined }),
}));

import ParentProfile from '../profile';

describe('Parent ProfileScreen', () => {
  beforeEach(() => mockSignOut.mockClear());

  it('renders profile with user data', () => {
    renderScreen(<ParentProfile />);
    expect(screen.getAllByText('Parent User').length).toBeGreaterThan(0);
  });

  it('confirms before signing out', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === 'Sign Out')?.onPress?.();
    });
    renderScreen(<ParentProfile />);
    fireEvent.press(screen.getByText(/Sign Out/));
    expect(alertSpy).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
