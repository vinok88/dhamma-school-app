import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';

const mockBack = jest.fn();
const mockRequestAdd = jest.fn(async () => 'new-id');
const mockLink = jest.fn(async () => 'linked-id');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useRequestAddStudent: () => ({ mutateAsync: mockRequestAdd, isPending: false }),
  useLinkStudentByCode: () => ({ mutateAsync: mockLink, isPending: false }),
}));

// The photo-consent link fetches its policy; stub the hook so the screen test
// doesn't pull in the real Supabase client.
jest.mock('@/hooks/usePolicy', () => ({
  usePhotoConsentPolicy: () => ({ title: 'Photo Publish Consent', body: 'Policy text', url: '' }),
}));

// Stub native-heavy inputs so the test stays hermetic and focused on screen logic.
jest.mock('@/components/ui/DatePicker', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    DatePicker: ({ label, onChange }: any) => (
      <TouchableOpacity testID={`date-${label}`} onPress={() => onChange('2018-04-01')}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/AddressAutocomplete', () => {
  const { TextInput } = require('react-native');
  return {
    AddressAutocomplete: ({ value, onChangeText, label }: any) => (
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} />
    ),
  };
});

import AddChildScreen from '../add-child';

describe('Parent AddChildScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults to the "add new child" form', () => {
    renderScreen(<AddChildScreen />);
    expect(screen.getByText('Add new child')).toBeTruthy();
    expect(screen.getByText('Link existing child')).toBeTruthy();
    expect(screen.getByText('Child Details')).toBeTruthy();
    expect(screen.getByText('Submit for Approval')).toBeTruthy();
  });

  it('switches to the link-existing-child form', () => {
    renderScreen(<AddChildScreen />);
    fireEvent.press(screen.getByText('Link existing child'));

    expect(screen.getByText('Link to Child')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. SUN-00042')).toBeTruthy();
    // The new-child form is no longer mounted.
    expect(screen.queryByText('Submit for Approval')).toBeNull();
  });

  it('links to an existing child with ID + last name + DOB', async () => {
    renderScreen(<AddChildScreen />);
    fireEvent.press(screen.getByText('Link existing child'));

    fireEvent.changeText(screen.getByPlaceholderText('e.g. SUN-00042'), 'SUN-00042');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Perera'), 'Perera');
    fireEvent.press(screen.getByTestId("date-Child's Date of Birth"));

    fireEvent.press(screen.getByText('Link to Child'));

    await waitFor(() =>
      expect(mockLink).toHaveBeenCalledWith({
        displayId: 'SUN-00042',
        verifyLastName: 'Perera',
        verifyDob: '2018-04-01',
      }),
    );
  });

  it('blocks linking when required fields are empty', async () => {
    renderScreen(<AddChildScreen />);
    fireEvent.press(screen.getByText('Link existing child'));
    fireEvent.press(screen.getByText('Link to Child'));

    await waitFor(() => expect(screen.getByText('Student ID is required')).toBeTruthy());
    expect(mockLink).not.toHaveBeenCalled();
  });
});
