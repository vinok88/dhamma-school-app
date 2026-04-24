import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '@/test-utils/render';
import { queryOk } from '@/test-utils/fixtures';

const mockSend = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ recipientId: 'u2' }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: require('@/test-utils/fixtures').parentProfile }),
}));

jest.mock('@/hooks/useMessages', () => ({
  useMessageThread: jest.fn(),
  useConversations: () => require('@/test-utils/fixtures').queryOk([
    { recipientId: 'u2', recipientName: 'Teacher Tara', lastMessage: 'hi', lastAt: new Date().toISOString() },
  ]),
  useSendMessage: () => ({ mutateAsync: mockSend, isPending: false }),
}));

import MessageThreadScreen from '../[recipientId]';
import { useMessageThread } from '@/hooks/useMessages';

describe('MessageThreadScreen', () => {
  beforeEach(() => mockSend.mockClear());

  it('renders messages in the thread', () => {
    (useMessageThread as jest.Mock).mockReturnValue(
      queryOk([
        { id: 'm1', senderId: 'u2', senderName: 'Teacher Tara', body: 'Hello parent', createdAt: new Date().toISOString() },
        { id: 'm2', senderId: require('@/test-utils/fixtures').parentProfile.id, senderName: 'Me', body: 'Hi teacher', createdAt: new Date().toISOString() },
      ]),
    );
    renderScreen(<MessageThreadScreen />);
    expect(screen.getByText('Hello parent')).toBeTruthy();
    expect(screen.getByText('Hi teacher')).toBeTruthy();
  });

  it('sends a message on submit', () => {
    (useMessageThread as jest.Mock).mockReturnValue(queryOk([]));
    renderScreen(<MessageThreadScreen />);
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.changeText(input, 'New message');
    fireEvent.press(screen.getByText('↑'));
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'u2', body: 'New message' }),
    );
  });
});
