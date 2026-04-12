import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";

export default function Index() {
  const { isAuthenticated, isLoading, setAuthenticated, setUser, setLoading } =
    useAuthStore();

  useEffect(() => {
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
    checkAuth();
  }, []);

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/chat" />;
  }

  return <Redirect href="/(auth)/login" />;
}
