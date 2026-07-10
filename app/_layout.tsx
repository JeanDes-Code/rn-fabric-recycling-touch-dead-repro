import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Fabric recycling repro' }} />
        <Stack.Screen name="course" options={{ title: 'Course (mid screen)' }} />
        <Stack.Screen name="video" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
