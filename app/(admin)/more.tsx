import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SwitchProfile } from '@/components/ui/SwitchProfile';
import { COLORS } from '@/constants';

const SHARED_ITEMS = [
  { label: 'Add Student', icon: '➕', route: '/(admin)/add-student', desc: 'Register a child and link parent emails' },
  { label: 'Add Teacher', icon: '📨', route: '/(admin)/add-teacher', desc: 'Invite a teacher by email' },
  { label: 'Teachers', icon: '👩‍🏫', route: '/(admin)/teachers', desc: 'Manage teacher accounts' },
  { label: 'Events', icon: '📅', route: '/(admin)/events', desc: 'School events & calendar' },
  { label: 'Reports', icon: '📋', route: '/(admin)/reports', desc: 'Attendance reports & export' },
  { label: 'Announcements', icon: '📢', route: '/(admin)/announce', desc: 'Compose & send notices' },
  { label: 'Notifications', icon: '🔔', route: '/notifications', desc: 'View your notifications' },
];

const ADMIN_ONLY = { label: 'Manage Admins', icon: '🔑', route: '/(admin)/admins', desc: 'Promote or remove administrators & principals' };
const PRINCIPAL_ONLY = { label: 'Manage Users', icon: '👥', route: '/(admin)/manage-users', desc: 'Change roles or remove users' };

export default function MoreScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const menuItems = [
    SHARED_ITEMS[0], // Add Student
    SHARED_ITEMS[1], // Add Teacher
    SHARED_ITEMS[2], // Teachers
    isAdmin ? ADMIN_ONLY : PRINCIPAL_ONLY,
    ...SHARED_ITEMS.slice(3), // Events, Reports, Announcements, Notifications
  ];

  const roleLabel = isAdmin ? 'Admin' : 'Principal';

  return (
    <SafeAreaView className="flex-1 bg-scaffold-bg">
      <View className="bg-navy px-5 pt-4 pb-5">
        <Text className="text-white" style={{ fontSize: 20, fontFamily: 'DMSerifDisplay_400Regular' }}>More ⋯</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <SwitchProfile />

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route as never)}
            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            activeOpacity={0.7}
          >
            <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: COLORS.cream }}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-sans-semibold text-text-primary">{item.label}</Text>
              <Text className="text-xs text-text-muted">{item.desc}</Text>
            </View>
            <Text className="text-text-muted text-lg">›</Text>
          </TouchableOpacity>
        ))}

        <View className="mt-4">
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
            className="bg-red-50 rounded-2xl p-4 flex-row items-center"
          >
            <Text style={{ fontSize: 22 }}>🚪</Text>
            <Text className="ml-3 text-error font-sans-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-xs text-text-muted mt-6 mb-2">
          {profile?.fullName} · {roleLabel}
        </Text>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
