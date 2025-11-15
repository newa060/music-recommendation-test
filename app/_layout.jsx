import { Stack } from "expo-router";
import "../global.css";
import { MusicProvider } from "../context/MusicContext";

export default function RootLayout() {
  return (
    <MusicProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </MusicProvider>
  );
}
