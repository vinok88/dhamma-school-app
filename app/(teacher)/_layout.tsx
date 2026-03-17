import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TeacherLayout() {
  const { profile } = useAuth();
  const isPending = profile?.status !== 'active';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: isPending ? { display: 'none' } : {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.divider,
          paddingBottom: 6,
          paddingTop: 4,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'WorkSans_500Medium' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', href: isPending ? null : '/(teacher)/attendance', tabBarIcon: ({ focused }) => <TabIcon emoji="✅" focused={focused} /> }} />
      <Tabs.Screen name="class" options={{ title: 'Class', href: isPending ? null : '/(teacher)/class', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }} />
      <Tabs.Screen name="announce" options={{ title: 'Announce', href: isPending ? null : '/(teacher)/announce', tabBarIcon: ({ focused }) => <TabIcon emoji="📢" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
    </Tabs>
  );
}
