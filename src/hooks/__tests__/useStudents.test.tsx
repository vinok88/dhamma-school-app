import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Build a chainable Supabase query mock. Each terminal call (single, order, in)
// resolves to { data, error }. Tests assign rowFixture before invoking the hook.
let rowFixture: { data: unknown; error: unknown } = { data: [], error: null };

const chain: Record<string, jest.Mock> = {};
const makeChain = () => {
  const methods = ['select', 'eq', 'in', 'order', 'single', 'update', 'insert'];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => proxy);
  });
  const proxy: any = chain;
  // Terminal-ish methods need to also be awaitable.
  chain.order.mockImplementation(() => Promise.resolve(rowFixture) as any);
  chain.single.mockImplementation(() => Promise.resolve(rowFixture) as any);
  chain.in.mockImplementation(() => proxy);
  return proxy;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => makeChain()),
  },
}));

import { useMyStudents, useApproveStudent } from '../useStudents';
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
    rowFixture = {
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
          parent_id: 'p1',
          class_id: 'c1',
          classes: { name: 'Year 2' },
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
      }),
    ]);
  });

  it('does not run when parentId is empty', () => {
    const { result } = renderHook(() => useMyStudents(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useApproveStudent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates status to active and assigns class_id', async () => {
    rowFixture = { data: null, error: null };
    // For update().eq() chain, eq is the terminal awaitable.
    chain.eq.mockImplementation(() => Promise.resolve(rowFixture) as any);

    const { result } = renderHook(() => useApproveStudent(), { wrapper });
    await result.current.mutateAsync({ studentId: 's1', classId: 'c1' });

    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(chain.update).toHaveBeenCalledWith({ status: 'active', class_id: 'c1' });
    expect(chain.eq).toHaveBeenCalledWith('id', 's1');
  });
});
