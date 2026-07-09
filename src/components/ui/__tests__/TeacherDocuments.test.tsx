import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

const mockSign = jest.fn((_path?: string) => Promise.resolve('https://signed.test/doc'));
const mockOpen = jest.fn();

// Stub the hook module so the component test never loads the real Supabase client.
jest.mock('@/hooks/useTeacherDocs', () => ({
  signTeacherDocUrl: (...a: unknown[]) => mockSign(...(a as [string])),
  useUploadTeacherDocument: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: (...a: unknown[]) => mockOpen(...a) }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn(async () => ({ canceled: true })) }));

import { TeacherDocumentLink } from '../TeacherDocuments';

describe('TeacherDocumentLink', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows "Not provided" when there is no document', () => {
    renderScreen(<TeacherDocumentLink label="View WWCC" />);
    expect(screen.getByText('View WWCC: Not provided')).toBeTruthy();
  });

  it('signs a URL and opens the document in the in-app browser when tapped', async () => {
    renderScreen(<TeacherDocumentLink label="View WWCC" path="u1/wwcc.pdf" />);
    fireEvent.press(screen.getByText('View WWCC'));

    await waitFor(() => expect(mockSign).toHaveBeenCalledWith('u1/wwcc.pdf'));
    await waitFor(() => expect(mockOpen).toHaveBeenCalledWith('https://signed.test/doc'));
  });
});
