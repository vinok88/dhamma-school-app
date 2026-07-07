import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants';
import { usePhotoConsentPolicy } from '@/hooks/usePolicy';

/**
 * A single clickable "Photo/Video policy" link. No policy text is shown in the
 * app — tapping opens the full document (a file in the public `policies` storage
 * bucket) in an in-app browser. The document URL comes from policies.url in the
 * DB (cached on-device for a week), so it can change without an app release.
 * Renders nothing until a document URL is available.
 */
export function PhotoConsentPolicyLink() {
  const { url } = usePhotoConsentPolicy();
  if (!url) return null;

  return (
    <TouchableOpacity
      onPress={() => WebBrowser.openBrowserAsync(url)}
      accessibilityRole="link"
      className="mt-3 self-start"
    >
      <Text className="text-xs" style={{ color: COLORS.navy, textDecorationLine: 'underline' }}>
        Photo/Video policy
      </Text>
    </TouchableOpacity>
  );
}
