import { Tabs } from 'expo-router';
import { Text } from 'react-native';

// Two tabs, each holding a virtualized list — like the production app's
// Learn + Catalog tabs. Both tab scenes stay mounted in the tab bar while
// content screens push/pop above them.

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Repro',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>▶</Text>,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>≣</Text>,
        }}
      />
    </Tabs>
  );
}
