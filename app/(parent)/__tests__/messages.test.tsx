import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'p1', schoolId: 'school-1' } }),
}));

jest.mock('@/hooks/useMessages', () => ({
  useConversations: jest.fn(),
}));

import MessagesScreen from '../messages';
import { useConversations } from '@/hooks/useMessages';

describe('Parent MessagesScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows empty state when no conversations', () => {
    (useConversations as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<MessagesScreen />);
    expect(screen.getByText(/No messages yet/)).toBeTruthy();
  });

  it('navigates to thread when conversation tapped', () => {
    (useConversations as jest.Mock).mockReturnValue(
      queryOk([
        {
          recipientId: 't1',
          recipientName: 'Tara Teacher',
          recipientPhotoUrl: undefined,
          lastMessage: 'Hi there',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        },
      ]),
    );
    renderScreen(<MessagesScreen />);
    fireEvent.press(screen.getByText('Tara Teacher'));
    expect(mockPush).toHaveBeenCalledWith('/messages/t1');
  });
});
