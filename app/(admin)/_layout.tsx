import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';
import { Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePendingStudentsCount } from '@/hooks/useStudents';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminLayout() {
  const { profile } = useAuth();
  const { data: pendingCount } = usePendingStudentsCount(profile?.schoolId ?? '');

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
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎒" focused={focused} />,
          // Red badge with the pending-registration count, if any.
          tabBarBadge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.error, color: COLORS.white, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" focused={focused} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ focused }) => <TabIcon emoji="⋯" focused={focused} /> }} />
      {/* Hidden */}
      <Tabs.Screen name="teachers" options={{ href: null }} />
      <Tabs.Screen name="admins" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="announce" options={{ href: null }} />
      <Tabs.Screen name="announcement-stats" options={{ href: null }} />
      <Tabs.Screen name="manage-users" options={{ href: null }} />
      <Tabs.Screen name="add-student" options={{ href: null }} />
      <Tabs.Screen name="add-teacher" options={{ href: null }} />
      <Tabs.Screen name="bulk-add-students" options={{ href: null }} />
    </Tabs>
  );
}
