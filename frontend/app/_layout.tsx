import { Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import amplifyConfig from "@/amplify-config";

Amplify.configure(amplifyConfig);

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
