import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { parentProfile, queryOk, mutationStub } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useCreateStudent: () => require('@/test-utils/fixtures').mutationStub(),
  useUpdateStudentPhoto: () => require('@/test-utils/fixtures').mutationStub(),
  useMyStudents: () => require('@/test-utils/fixtures').queryOk([]),
}));

jest.mock('@/hooks/useProfile', () => ({
  useUploadStudentPhoto: () => require('@/test-utils/fixtures').mutationStub(),
}));

import RegisterStudentScreen from '../register-student';

describe('RegisterStudentScreen', () => {
  it('renders the first step of the multi-step form', () => {
    renderScreen(<RegisterStudentScreen />);
    // Step 1 label is "Child Details"
    expect(screen.getByText('Child Details')).toBeTruthy();
  });
});
