/**
 * Verifies the flow that fixes the "parent already linked → can't sign up" bug.
 *
 * The key invariants:
 *   - resolveRoleForSignup is called with the auth user's email.
 *   - The role it returns is what gets persisted on user_profiles.upsert.
 *     (Earlier the RPC also tried to UPDATE student_parents.parent_user_id,
 *      which failed the FK because user_profiles didn't exist yet — the
 *      caller-visible symptom was an error toast on this screen.)
 *   - refreshProfile is called once the upsert succeeds.
 *   - When the upsert fails, the catch path shows an alert (no silent swallow).
 *
 * Note: the AFTER INSERT trigger that does the actual student_parents linking
 * is database-side (migration 013) and is exercised end-to-end in Supabase,
 * not here.
 */

import React from 'react';
import { fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { renderScreen } from '@/test-utils/render';

// ── Supabase mock ───────────────────────────────────────────────────────────
const mockSchoolSingle = jest.fn();
const mockUpsert = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (table: string) => {
      if (table === 'schools') {
        return {
          select: () => ({ limit: () => ({ single: () => mockSchoolSingle() }) }),
        };
      }
      if (table === 'user_profiles') {
        return { upsert: (row: any) => mockUpsert(row) };
      }
      return {};
    },
  },
}));

// ── Auth mock ───────────────────────────────────────────────────────────────
const mockResolveRole = jest.fn();
const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'auth-user-1', email: 'parent@test.local' },
    refreshProfile: mockRefreshProfile,
    resolveRoleForSignup: (email: string) => mockResolveRole(email),
  }),
}));

// AddressAutocomplete fires a Google Places fetch on render — stub it so the
// test doesn't make a real network call.
jest.mock('@/components/ui/AddressAutocomplete', () => {
  const { View, Text, TextInput } = require('react-native');
  return {
    AddressAutocomplete: ({ label, value, onChangeText }: any) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          testID="address-input"
          value={value}
          onChangeText={onChangeText}
          placeholder="Address"
        />
      </View>
    ),
  };
});

import CompleteProfileScreen from '../complete-profile';

function fillForm() {
  fireEvent.changeText(screen.getByPlaceholderText('e.g. Nimali Perera'), 'Anna Parent');
  fireEvent.changeText(screen.getByPlaceholderText('4XX XXX XXX'), '400000000');
  fireEvent.changeText(screen.getByTestId('address-input'), '1 Test St, Carlton');
}

describe('CompleteProfileScreen — parent with existing student link', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRpc.mockReset();
    mockUpsert.mockReset();
    mockSchoolSingle.mockReset();
    mockResolveRole.mockReset();
    mockRefreshProfile.mockClear();
    mockSchoolSingle.mockResolvedValue({ data: { id: 'school-1' }, error: null });
    mockUpsert.mockResolvedValue({ error: null });
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined as any);
  });

  afterEach(() => alertSpy.mockRestore());

  it('passes the auth email to resolveRoleForSignup and persists the returned role', async () => {
    mockResolveRole.mockResolvedValue('parent');

    renderScreen(<CompleteProfileScreen />);
    fillForm();
    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
    });

    await waitFor(() => expect(mockResolveRole).toHaveBeenCalledWith('parent@test.local'));
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: 'auth-user-1',
        school_id: 'school-1',
        full_name: 'Anna Parent',
        phone: '+61400000000',
        address: '1 Test St, Carlton',
        role: 'parent',
        status: 'active',
      })
    );
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
  });

  it('persists guest role when no invitation / parent link matches', async () => {
    mockResolveRole.mockResolvedValue('guest');

    renderScreen(<CompleteProfileScreen />);
    fillForm();
    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
    });

    await waitFor(() =>
      expect(mockUpsert.mock.calls[0][0]).toEqual(expect.objectContaining({ role: 'guest' }))
    );
  });

  it('persists teacher role when a teacher invitation matches', async () => {
    mockResolveRole.mockResolvedValue('teacher');

    renderScreen(<CompleteProfileScreen />);
    fillForm();
    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
    });

    await waitFor(() =>
      expect(mockUpsert.mock.calls[0][0]).toEqual(expect.objectContaining({ role: 'teacher' }))
    );
  });

  it('shows a friendly contact-the-school message on upsert failure (not the raw Postgres error)', async () => {
    mockResolveRole.mockResolvedValue('parent');
    mockUpsert.mockResolvedValueOnce({
      error: { message: 'insert or update on table violates foreign key constraint' },
    });

    renderScreen(<CompleteProfileScreen />);
    fillForm();
    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    // Title carries the user's intent, body is the canned admin contact line.
    expect(alertSpy.mock.calls[0][0]).toMatch(/save profile/i);
    expect(alertSpy.mock.calls[0][1]).toMatch(/contact the school admin/i);
    expect(alertSpy.mock.calls[0][1]).not.toMatch(/foreign key/i);
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });

  it('shows the same friendly message if the role resolver itself throws', async () => {
    mockResolveRole.mockRejectedValueOnce(new Error('rpc unavailable'));

    renderScreen(<CompleteProfileScreen />);
    fillForm();
    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][1]).toMatch(/contact the school admin/i);
    expect(alertSpy.mock.calls[0][1]).not.toMatch(/rpc unavailable/i);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });
});
