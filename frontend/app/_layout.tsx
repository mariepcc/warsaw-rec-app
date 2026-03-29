import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Amplify } from "aws-amplify";
import { getCurrentUser } from "aws-amplify/auth";
import amplifyConfig from "@/amplify-config";
import { useAuthStore } from "@/store/auth/authStore";

Amplify.configure(amplifyConfig);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setAuthenticated, setUser, setLoading } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(app)/chat");
    }
  }, [isAuthenticated, isLoading, segments]);

  async function checkAuth() {
    try {
      const user = await getCurrentUser();
      setUser({ email: user.signInDetails?.loginId ?? "" });
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
