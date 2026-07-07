import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Build a chainable Supabase query mock. Each terminal call (single, order, in)
// resolves to { data, error }. Tests assign mockRowFixture before invoking the hook.
let mockRowFixture: { data?: unknown; error: unknown; count?: number } = { data: [], error: null };
let mockLinkFixture: { data: unknown; error: unknown } = { data: [], error: null };
let mockRpcFixture: { data: unknown; error: unknown } = { data: null, error: null };

const mockChain: Record<string, jest.Mock> = {};
const mockMakeChain = (resolver: () => Promise<unknown>) => {
  const methods = ['select', 'eq', 'in', 'order', 'single', 'update', 'insert'];
  methods.forEach((m) => {
    mockChain[m] = jest.fn(() => proxy);
  });
  const proxy: any = mockChain;
  mockChain.order.mockImplementation(() => resolver() as any);
  mockChain.single.mockImplementation(() => resolver() as any);
  mockChain.eq.mockImplementation(() => {
    return Object.assign(proxy, { then: (cb: any) => resolver().then(cb) });
  });
  return proxy;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      return mockMakeChain(() =>
        Promise.resolve(table === 'student_parents' ? mockLinkFixture : mockRowFixture)
      );
    }),
    rpc: jest.fn((_fn: string, _args: unknown) => Promise.resolve(mockRpcFixture)),
  },
}));

import {
  useMyStudents,
  useRequestAddStudent,
  useLinkStudentByCode,
  usePendingStudentsCount,
} from '../useStudents';
import { supabase } from '@/lib/supabase';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useMyStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps snake_case rows from supabase into StudentModel objects', async () => {
    mockLinkFixture = { data: [{ student_id: 's1' }], error: null };
    mockRowFixture = {
      data: [
        {
          id: 's1',
          school_id: 'school-1',
          first_name: 'Anna',
          last_name: 'Perera',
          dob: '2018-04-01',
          gender: 'F',
          has_allergies: true,
          allergy_notes: 'peanuts',
          photo_url: null,
          photo_publish_consent: false,
          class_id: 'c1',
          classes: { name: 'Year 2' },
          student_parents: [
            {
              id: 'sp1',
              student_id: 's1',
              parent_email: 'p@test.local',
              parent_name: 'Parent',
              parent_phone: '+61400000000',
              parent_user_id: 'p1',
            },
          ],
          status: 'active',
          status_note: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    };

    const { result } = renderHook(() => useMyStudents('p1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.from).toHaveBeenCalledWith('student_parents');
    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: 's1',
        firstName: 'Anna',
        lastName: 'Perera',
        hasAllergies: true,
        allergyNotes: 'peanuts',
        className: 'Year 2',
        status: 'active',
        parents: [
          expect.objectContaining({
            parentEmail: 'p@test.local',
            parentUserId: 'p1',
          }),
        ],
      }),
    ]);
  });

  it('does not run when userId is empty', () => {
    const { result } = renderHook(() => useMyStudents(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('maps display_id onto the model', async () => {
    mockLinkFixture = { data: [{ student_id: 's1' }], error: null };
    mockRowFixture = {
      data: [{
        id: 's1', school_id: 'school-1', display_id: 'SUN-00042',
        first_name: 'Anna', last_name: 'Perera', dob: '2018-04-01', gender: 'F',
        has_allergies: false, photo_publish_consent: false, status: 'active',
        student_parents: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }],
      error: null,
    };
    const { result } = renderHook(() => useMyStudents('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].displayId).toBe('SUN-00042');
  });
});

describe('useRequestAddStudent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpcFixture = { data: 'new-student-id', error: null };
  });

  it('calls the request_add_student RPC with mapped params and returns the new id', async () => {
    const { result } = renderHook(() => useRequestAddStudent(), { wrapper });

    const id = await result.current.mutateAsync({
      firstName: '  Anna ', lastName: ' Perera ', preferredName: '  ', dob: '2018-04-01',
      gender: 'female', address: ' 1 Test St ', hasAllergies: false, allergyNotes: 'ignored',
      photoPublishConsent: true,
    });

    expect(id).toBe('new-student-id');
    expect(supabase.rpc).toHaveBeenCalledWith('request_add_student', {
      p_first_name: 'Anna',
      p_last_name: 'Perera',
      p_preferred_name: null,
      p_dob: '2018-04-01',
      p_gender: 'female',
      p_address: '1 Test St',
      p_has_allergies: false,
      p_allergy_notes: null, // dropped because hasAllergies is false
      p_photo_publish_consent: true,
    });
  });

  it('throws when the RPC returns an error', async () => {
    mockRpcFixture = { data: null, error: { message: 'nope' } };
    const { result } = renderHook(() => useRequestAddStudent(), { wrapper });
    await expect(
      result.current.mutateAsync({
        firstName: 'A', lastName: 'B', dob: '2018-04-01', gender: 'male',
        address: '1 St', hasAllergies: false, photoPublishConsent: false,
      }),
    ).rejects.toBeTruthy();
  });
});

describe('useLinkStudentByCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpcFixture = { data: 'linked-student-id', error: null };
  });

  it('calls the link_student_by_code RPC with trimmed params', async () => {
    const { result } = renderHook(() => useLinkStudentByCode(), { wrapper });

    const id = await result.current.mutateAsync({
      displayId: '  sun-00042 ', verifyLastName: ' Perera ', verifyDob: '2018-04-01',
    });

    expect(id).toBe('linked-student-id');
    expect(supabase.rpc).toHaveBeenCalledWith('link_student_by_code', {
      p_display_id: 'sun-00042',
      p_verify_last_name: 'Perera',
      p_verify_dob: '2018-04-01',
    });
  });

  it('propagates a verification failure from the RPC', async () => {
    mockRpcFixture = { data: null, error: { message: 'No matching student found' } };
    const { result } = renderHook(() => useLinkStudentByCode(), { wrapper });
    await expect(
      result.current.mutateAsync({ displayId: 'SUN-00042', verifyLastName: 'X', verifyDob: '2010-01-01' }),
    ).rejects.toBeTruthy();
  });
});

describe('usePendingStudentsCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the pending-registration count for the school', async () => {
    mockRowFixture = { count: 3, error: null };
    const { result } = renderHook(() => usePendingStudentsCount('school-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(result.current.data).toBe(3);
  });

  it('does not run without a schoolId', () => {
    const { result } = renderHook(() => usePendingStudentsCount(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
