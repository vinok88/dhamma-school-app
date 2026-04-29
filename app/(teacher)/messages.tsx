import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useMessages';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/utils/date';

export default function TeacherMessagesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: conversations, isLoading } = useConversations(profile?.id ?? '');

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-scaffold-bg px-5 pt-4 pb-5">
        <Text className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8B7D6B' }}>Messages</Text>
        <Text style={{ fontSize: 22, fontFamily: 'DMSerifDisplay_400Regular', color: '#1C1C1E' }}>
          Conversations 💬
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen label="Loading conversations…" />
      ) : !conversations?.length ? (
        <EmptyState
          icon="💬"
          title="No messages yet"
          subtitle="Open a student in your class roster and tap 'Message Parent' to start a conversation."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.recipientId}
          contentContainerStyle={{ padding: 16, gap: 4 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/messages/${item.recipientId}` as never)}
              className="bg-white rounded-2xl p-4 flex-row items-center mb-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              activeOpacity={0.7}
            >
              <Avatar uri={item.recipientPhotoUrl} name={item.recipientName} size={48} />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-sans-semibold text-text-primary">{item.recipientName}</Text>
                  <Text className="text-xs text-text-muted">{timeAgo(item.lastMessageAt)}</Text>
                </View>
                <Text className="text-sm text-text-muted" numberOfLines={1}>{item.lastMessage}</Text>
              </View>
              {item.unreadCount > 0 && (
                <View className="ml-2 bg-primary rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs">{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
