import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { teacherProfile, makeStudent, queryOk } from '@/test-utils/fixtures';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').teacherProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useMyClasses: () =>
    require('@/test-utils/fixtures').queryOk([{ id: 'c1', name: 'Year 2', gradeLevel: 'Y2', studentCount: 0 }]),
}));

jest.mock('@/hooks/useStudents', () => ({
  useClassStudents: jest.fn(),
}));

jest.mock('@/hooks/useProfile', () => ({
  useStudentPhotoUrl: () => ({ data: undefined }),
}));

import ClassRosterScreen from '../class';
import { useClassStudents } from '@/hooks/useStudents';

describe('Teacher ClassRosterScreen', () => {
  it('filters roster by search term', () => {
    (useClassStudents as jest.Mock).mockReturnValue(
      queryOk([
        makeStudent({ id: 's1', firstName: 'Anna', lastName: 'A' }),
        makeStudent({ id: 's2', firstName: 'Bodhi', lastName: 'B' }),
      ]),
    );
    renderScreen(<ClassRosterScreen />);
    expect(screen.getByText(/Anna/)).toBeTruthy();
    expect(screen.getByText(/Bodhi/)).toBeTruthy();

    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(search, 'Bodhi');
    expect(screen.queryByText(/Anna/)).toBeNull();
    expect(screen.getByText(/Bodhi/)).toBeTruthy();
  });
});
