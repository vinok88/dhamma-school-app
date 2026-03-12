import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.divider,
          paddingBottom: 4,
          paddingTop: 2,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'WorkSans_500Medium' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
      <Tabs.Screen name="registrations" options={{ title: 'Pending', tabBarIcon: ({ focused }) => <TabIcon emoji="⏳" focused={focused} /> }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: ({ focused }) => <TabIcon emoji="🎒" focused={focused} /> }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ focused }) => <TabIcon emoji="⋯" focused={focused} /> }} />
      {/* Hidden */}
      <Tabs.Screen name="teachers" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="announce" options={{ href: null }} />
    </Tabs>
  );
}
