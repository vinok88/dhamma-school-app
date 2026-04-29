import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMessageThread, useSendMessage, useConversations } from '@/hooks/useMessages';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatTime } from '@/utils/date';
import { COLORS } from '@/constants';

export default function MessageThreadScreen() {
  const { recipientId, name } = useLocalSearchParams<{ recipientId: string; name?: string }>();
  const { profile } = useAuth();
  const userId = profile?.id ?? '';

  const { data: messages, isLoading } = useMessageThread(userId, recipientId);
  const { data: conversations } = useConversations(userId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const recipient = conversations?.find((c) => c.recipientId === recipientId);
  // Prefer a known thread's name; fall back to the param passed when starting a
  // brand-new conversation; finally a generic label.
  const recipientName = recipient?.recipientName ?? name ?? 'Message';

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !profile) return;
    setText('');
    await sendMessage.mutateAsync({
      schoolId: profile.schoolId,
      senderId: userId,
      recipientId,
      body: trimmed,
    });
    listRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <ScreenHeader title={recipientName} showBack />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            ref={listRef}
            data={messages ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item: msg }) => {
              const isMine = msg.senderId === userId;
              return (
                <View className={`max-w-[80%] ${isMine ? 'self-end' : 'self-start'}`}>
                  <View
                    className={`rounded-2xl px-4 py-3 ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm bg-white'}`}
                    style={isMine ? { backgroundColor: COLORS.primary } : {
                      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                    }}
                  >
                    {!isMine && (
                      <Text className="text-xs font-sans-semibold text-navy mb-1">{msg.senderName}</Text>
                    )}
                    <Text className={`text-sm ${isMine ? 'text-white' : 'text-text-primary'}`}>{msg.body}</Text>
                  </View>
                  <Text className={`text-xs text-text-muted mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.createdAt)}
                    {isMine && msg.readAt ? ' ✓✓' : ''}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        <View className="bg-white px-4 py-3 flex-row items-end border-t border-gray-100" style={{ gap: 8 }}>
          <TextInput
            className="flex-1 bg-scaffold-bg rounded-2xl px-4 py-3 text-sm text-text-primary"
            placeholder="Type a message…"
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: text.trim() ? COLORS.primary : COLORS.divider }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-sans-semibold">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
