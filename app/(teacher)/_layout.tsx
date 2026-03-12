import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
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
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ focused }) => <TabIcon emoji="✅" focused={focused} /> }} />
      <Tabs.Screen name="class" options={{ title: 'Class', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }} />
      <Tabs.Screen name="announce" options={{ title: 'Announce', tabBarIcon: ({ focused }) => <TabIcon emoji="📢" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
    </Tabs>
  );
}
