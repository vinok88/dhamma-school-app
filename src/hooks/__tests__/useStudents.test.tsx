import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Build a chainable Supabase query mock. Each terminal call (single, order, in)
// resolves to { data, error }. Tests assign mockRowFixture before invoking the hook.
let mockRowFixture: { data: unknown; error: unknown } = { data: [], error: null };
let mockLinkFixture: { data: unknown; error: unknown } = { data: [], error: null };

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
  },
}));

import { useMyStudents } from '../useStudents';
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
});
