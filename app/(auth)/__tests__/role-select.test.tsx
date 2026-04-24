import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'auth-user-1' },
    refreshProfile: jest.fn(async () => undefined),
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({
          single: jest.fn(async () => ({ data: { id: 'school-1' } })),
        })),
      })),
      upsert: jest.fn(async () => ({ error: null })),
    })),
  },
}));

import RoleSelectScreen from '../role-select';

describe('RoleSelectScreen', () => {
  it('renders the two role options and the create profile button', () => {
    renderScreen(<RoleSelectScreen />);
    expect(screen.getByText('Parent / Guardian')).toBeTruthy();
    expect(screen.getByText('Teacher')).toBeTruthy();
    expect(screen.getByText('Create Profile')).toBeTruthy();
  });
});
