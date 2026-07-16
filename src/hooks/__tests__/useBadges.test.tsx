import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let mockBadgesRows: unknown[] = [];
let mockStudentBadgeRows: unknown[] = [];
const mockRpc = jest.fn((..._a: unknown[]) => Promise.resolve({ data: 'award-1', error: null }));

jest.mock('@/lib/supabase', () => {
  const build = (table: string) => {
    const p: Record<string, jest.Mock> = {};
    ['select', 'eq', 'insert', 'update'].forEach((m) => { p[m] = jest.fn(() => p); });
    p.order = jest.fn(() =>
      Promise.resolve({ data: table === 'student_badges' ? mockStudentBadgeRows : mockBadgesRows, error: null }),
    );
    p.single = jest.fn(() => Promise.resolve({ data: { id: 'new-badge' }, error: null }));
    return p;
  };
  return {
    supabase: {
      from: (t: string) => build(t),
      rpc: (...a: unknown[]) => mockRpc(...a),
      storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: 'https://pub/' + path } }) }) },
    },
  };
});

import { useStudentBadges, useAwardBadge, useBadges, useBadgeHolders } from '../useBadges';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const HOUR = 3600 * 1000;

describe('useStudentBadges', () => {
  beforeEach(() => jest.clearAllMocks());

  it('derives active/expired/revoked and sorts active first', async () => {
    mockStudentBadgeRows = [
      { id: 'a1', student_id: 's1', badge_id: 'b1', awarded_at: '2026-01-01T00:00:00Z',
        expires_at: new Date(Date.now() - HOUR).toISOString(), revoked_at: null, badges: { id: 'b1', name: 'Expired One' } },
      { id: 'a2', student_id: 's1', badge_id: 'b2', awarded_at: '2026-02-01T00:00:00Z',
        expires_at: null, revoked_at: null, badges: { id: 'b2', name: 'Active One' } },
      { id: 'a3', student_id: 's1', badge_id: 'b3', awarded_at: '2026-03-01T00:00:00Z',
        expires_at: null, revoked_at: '2026-03-05T00:00:00Z', badges: { id: 'b3', name: 'Revoked One' } },
    ];
    const { result } = renderHook(() => useStudentBadges('s1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const rows = result.current.data!;
    // Active first
    expect(rows[0].id).toBe('a2');
    expect(rows[0].isActive).toBe(true);
    const expired = rows.find((r) => r.id === 'a1')!;
    expect(expired.isActive).toBe(false);
    const revoked = rows.find((r) => r.id === 'a3')!;
    expect(revoked.isActive).toBe(false);
    expect(revoked.badge?.name).toBe('Revoked One');
  });
});

describe('useAwardBadge', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the award_badge RPC with mapped params', async () => {
    const { result } = renderHook(() => useAwardBadge(), { wrapper });
    const id = await result.current.mutateAsync({
      studentId: 's1', badgeId: 'b1', expiresAt: '2026-12-31T23:59:59', note: 'Great work',
    });
    expect(id).toBe('award-1');
    expect(mockRpc).toHaveBeenCalledWith('award_badge', {
      p_student_id: 's1',
      p_badge_id: 'b1',
      p_expires_at: '2026-12-31T23:59:59',
      p_note: 'Great work',
    });
  });

  it('passes null expiry/note when omitted', async () => {
    const { result } = renderHook(() => useAwardBadge(), { wrapper });
    await result.current.mutateAsync({ studentId: 's1', badgeId: 'b1' });
    expect(mockRpc).toHaveBeenCalledWith('award_badge', {
      p_student_id: 's1', p_badge_id: 'b1', p_expires_at: null, p_note: null,
    });
  });
});

describe('useBadgeHolders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists holders with name/class, active first', async () => {
    mockStudentBadgeRows = [
      { id: 'h1', student_id: 's1', awarded_at: '2026-02-01T00:00:00Z', expires_at: null, revoked_at: null,
        students: { first_name: 'Anna', last_name: 'Perera', classes: { name: 'Year 2' } } },
      { id: 'h2', student_id: 's2', awarded_at: '2026-01-01T00:00:00Z',
        expires_at: new Date(Date.now() - HOUR).toISOString(), revoked_at: null,
        students: { first_name: 'Ben', last_name: 'Silva', classes: null } },
    ];
    const { result } = renderHook(() => useBadgeHolders('b1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const rows = result.current.data!;
    expect(rows[0].studentName).toBe('Anna Perera'); // active first
    expect(rows[0].className).toBe('Year 2');
    expect(rows[0].isActive).toBe(true);
    const ben = rows.find((r) => r.awardId === 'h2')!;
    expect(ben.isActive).toBe(false);
    expect(ben.className).toBeUndefined();
  });
});

describe('useBadges', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps badge rows including scope', async () => {
    mockBadgesRows = [
      { id: 'b1', school_id: 'sch', class_id: null, name: 'School Star', is_active: true, created_at: 'x', classes: null },
      { id: 'b2', school_id: 'sch', class_id: 'c1', name: 'Class Star', is_active: true, created_at: 'y', classes: { name: 'Year 2' } },
    ];
    const { result } = renderHook(() => useBadges('sch'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({ id: 'b1', classId: undefined, name: 'School Star' }),
      expect.objectContaining({ id: 'b2', classId: 'c1', className: 'Year 2' }),
    ]);
  });
});
