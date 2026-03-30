// app/(app)/profile.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import { useAuthStore } from "@/store/auth/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const attrs = await fetchUserAttributes();
        setEmail(attrs.email ?? "");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleSignOut() {
    await signOut();
    setAuthenticated(false);
    setUser(null);
    router.replace("/(auth)/login");
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{email.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.email}>{email}</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Wyloguj się</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
  },
  email: {
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 48,
  },
  button: {
    borderWidth: 1,
    borderColor: "#e53e3e",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#e53e3e",
    fontSize: 16,
    fontWeight: "500",
  },
});
