import { renderHook, waitFor } from '@testing-library/react-native';

const mockSingle = jest.fn();
const mockRead = jest.fn();
const mockWrite = jest.fn((_key?: string, _data?: unknown) => Promise.resolve(undefined));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
  },
}));

jest.mock('@/utils/policyCache', () => ({
  readPolicyCache: (key: string) => mockRead(key),
  writePolicyCache: (key: string, data: unknown) => mockWrite(key, data),
}));

import { usePolicy } from '../usePolicy';

const fallback = { title: 'Fallback', body: 'Fallback body', url: '' };

describe('usePolicy', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the fallback first, then the fetched policy, and caches it', async () => {
    mockRead.mockResolvedValue(null); // no cache yet
    mockSingle.mockResolvedValue({
      data: { title: 'Live', body: 'Network body', url: null },
      error: null,
    });

    const { result } = renderHook(() => usePolicy('photo_consent', fallback));

    expect(result.current.body).toBe('Fallback body'); // instant fallback
    await waitFor(() => expect(result.current.body).toBe('Network body'));
    expect(mockWrite).toHaveBeenCalled(); // fetched value cached
  });

  it('uses a fresh (<1 week) cache and skips the network', async () => {
    mockRead.mockResolvedValue({
      title: 'Cached', body: 'Cached body', url: null, fetchedAt: Date.now(),
    });

    const { result } = renderHook(() => usePolicy('photo_consent', fallback));

    await waitFor(() => expect(result.current.body).toBe('Cached body'));
    expect(mockSingle).not.toHaveBeenCalled(); // cache still fresh → no fetch
  });

  it('refetches when the cache is older than a week', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    mockRead.mockResolvedValue({
      title: 'Old', body: 'Stale body', url: null, fetchedAt: eightDaysAgo,
    });
    mockSingle.mockResolvedValue({
      data: { title: 'Live', body: 'Refreshed body', url: null },
      error: null,
    });

    const { result } = renderHook(() => usePolicy('photo_consent', fallback));

    await waitFor(() => expect(result.current.body).toBe('Refreshed body'));
    expect(mockSingle).toHaveBeenCalled();
  });

  it('keeps the cached value when the network fails', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    mockRead.mockResolvedValue({
      title: 'Old', body: 'Stale body', url: null, fetchedAt: eightDaysAgo,
    });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'offline' } });

    const { result } = renderHook(() => usePolicy('photo_consent', fallback));

    await waitFor(() => expect(result.current.body).toBe('Stale body'));
    expect(mockWrite).not.toHaveBeenCalled();
  });
});
