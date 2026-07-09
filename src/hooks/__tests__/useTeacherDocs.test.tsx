import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUpload = jest.fn(async () => ({ error: null }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockUpdateEq = jest.fn(async () => ({ error: null }));
const mockCreateSignedUrl = jest.fn(async () => ({ data: { signedUrl: 'https://signed.test/doc' }, error: null }));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: mockUpload, createSignedUrl: mockCreateSignedUrl }) },
    from: () => ({ update: mockUpdate }),
  },
}));

import { useUploadTeacherDocument, signTeacherDocUrl } from '../useTeacherDocs';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useUploadTeacherDocument', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads to <uid>/<kind>.pdf and records the path on the profile', async () => {
    const { result } = renderHook(() => useUploadTeacherDocument(), { wrapper });

    const path = await result.current.mutateAsync({ userId: 'u1', uri: 'file:///x.pdf', kind: 'wwcc' });

    expect(path).toBe('u1/wwcc.pdf');
    expect(mockUpload).toHaveBeenCalledWith(
      'u1/wwcc.pdf',
      expect.anything(),
      { contentType: 'application/pdf', upsert: true },
    );
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ wwcc_url: 'u1/wwcc.pdf' }));
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'u1');
  });

  it('maps the resume kind to the resume_url column', async () => {
    const { result } = renderHook(() => useUploadTeacherDocument(), { wrapper });
    await result.current.mutateAsync({ userId: 'u1', uri: 'file:///r.pdf', kind: 'resume' });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ resume_url: 'u1/resume.pdf' }));
  });
});

describe('signTeacherDocUrl', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a signed URL for a stored path', async () => {
    const url = await signTeacherDocUrl('u1/wwcc.pdf');
    expect(url).toBe('https://signed.test/doc');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('u1/wwcc.pdf', 3600);
  });
});
