import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

// The component reads the policy via usePhotoConsentPolicy; stub it so the UI
// test stays hermetic. `mockPolicy` is mutable so tests can toggle the URL.
let mockPolicy = { title: 'Photo Publish Consent', body: '', url: '' };
jest.mock('@/hooks/usePolicy', () => ({
  usePhotoConsentPolicy: () => mockPolicy,
}));

const mockOpenBrowser = jest.fn();
jest.mock('expo-web-browser', () => ({ openBrowserAsync: (...a: unknown[]) => mockOpenBrowser(...a) }));

import { PhotoConsentPolicyLink } from '../PhotoConsentPolicy';

describe('PhotoConsentPolicyLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPolicy = { title: 'Photo Publish Consent', body: '', url: '' };
  });

  it('renders nothing until a document URL is available', () => {
    renderScreen(<PhotoConsentPolicyLink />);
    expect(screen.queryByText('Photo/Video policy')).toBeNull();
  });

  it('shows the "Photo/Video policy" link when a URL is set', () => {
    mockPolicy = { ...mockPolicy, url: 'https://example.test/policies/photo-consent.pdf' };
    renderScreen(<PhotoConsentPolicyLink />);
    expect(screen.getByText('Photo/Video policy')).toBeTruthy();
  });

  it('opens the document in the in-app browser when tapped', () => {
    mockPolicy = { ...mockPolicy, url: 'https://example.test/policies/photo-consent.pdf' };
    renderScreen(<PhotoConsentPolicyLink />);
    fireEvent.press(screen.getByText('Photo/Video policy'));
    expect(mockOpenBrowser).toHaveBeenCalledWith('https://example.test/policies/photo-consent.pdf');
  });
});
