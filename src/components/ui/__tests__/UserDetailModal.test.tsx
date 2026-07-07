import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { makeStudent, principalProfile, parentProfile } from '@/test-utils/fixtures';

const mockApprove = jest.fn(async () => undefined);
const mockReject = jest.fn(async () => undefined);
let mockProfile = principalProfile;

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: mockProfile }),
}));

jest.mock('@/hooks/useClasses', () => ({
  useClasses: () => ({
    data: [{ id: 'c1', name: 'Year 2', gradeLevel: '', teachers: [], studentCount: 0, createdAt: '' }],
  }),
}));

jest.mock('@/hooks/useStudents', () => ({
  useAdminUpdateStudent: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useApproveStudent: () => ({ mutateAsync: mockApprove, isPending: false }),
  useRejectStudent: () => ({ mutateAsync: mockReject, isPending: false }),
}));

// jest.setup.ts globally stubs UserDetailModal to null (so screens can render
// without it); load the real implementation here to test it directly.
const { UserDetailModal } = jest.requireActual('../UserDetailModal');

const pendingStudent = makeStudent({
  id: 'stu-9', firstName: 'Pending', lastName: 'Kid',
  status: 'pending', classId: undefined, className: undefined,
});

describe('UserDetailModal — pending approval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = principalProfile;
  });

  it('shows the approval panel for a pending student (principal)', () => {
    renderScreen(<UserDetailModal visible student={pendingStudent} editable onClose={jest.fn()} />);
    expect(screen.getByText('Pending approval')).toBeTruthy();
    expect(screen.getByText('Approve & Assign')).toBeTruthy();
  });

  it('does not show the approval panel to a parent', () => {
    mockProfile = parentProfile;
    renderScreen(<UserDetailModal visible student={pendingStudent} editable onClose={jest.fn()} />);
    expect(screen.queryByText('Pending approval')).toBeNull();
  });

  it('does not show the approval panel for an active student', () => {
    renderScreen(
      <UserDetailModal visible student={makeStudent({ status: 'active' })} editable onClose={jest.fn()} />,
    );
    expect(screen.queryByText('Pending approval')).toBeNull();
  });

  it('approves with the selected class and active status', async () => {
    const onClose = jest.fn();
    renderScreen(<UserDetailModal visible student={pendingStudent} editable onClose={onClose} />);

    fireEvent.press(screen.getByText('Year 2'));       // pick class
    fireEvent.press(screen.getByText('Approve & Assign'));

    await waitFor(() =>
      expect(mockApprove).toHaveBeenCalledWith({ studentId: 'stu-9', classId: 'c1' }),
    );
  });

  it('rejects with a required reason', async () => {
    renderScreen(<UserDetailModal visible student={pendingStudent} editable onClose={jest.fn()} />);

    fireEvent.press(screen.getByText('Reject'));
    fireEvent.changeText(screen.getByPlaceholderText(/Reason for rejection/), 'Duplicate registration');
    fireEvent.press(screen.getByText('Confirm Reject'));

    await waitFor(() =>
      expect(mockReject).toHaveBeenCalledWith({
        studentId: 'stu-9',
        reason: 'Duplicate registration',
      }),
    );
  });
});
