import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

const mockSignIn = jest.fn(async () => undefined);

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signInWithGoogle: mockSignIn }),
}));

import LoginScreen from '../login';

describe('LoginScreen', () => {
  beforeEach(() => mockSignIn.mockClear());

  it('renders welcome copy and Google button', () => {
    renderScreen(<LoginScreen />);
    expect(screen.getByText(/Welcome back/)).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('invokes signInWithGoogle when the button is pressed', () => {
    renderScreen(<LoginScreen />);
    fireEvent.press(screen.getByText('Continue with Google'));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });
});
