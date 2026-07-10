import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

// Root stack: a (tabs) navigator at the bottom, content screens pushed on
// top. Mirrors the production topology — the video exit does a dismissTo
// that unwinds the pushed screens back INTO the tabs sub-stack, so the
// multi-screen removal crosses a navigator boundary.

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course" options={{ title: 'Course (mid screen)' }} />
        <Stack.Screen name="video" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
