import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import { useAuthStore } from "@/store/authStore";

const ACCENT = "#66a494";
const GRADIENT: [string, string, string] = [
  "#bde7f070",
  "#fcb69f7b",
  "#bde7f0a7",
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    try {
      await signOut({ global: true });
    } catch {}
    setAuthenticated(false);
    setUser(null);
    router.replace("/(auth)/login");
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const username = email.split("@")[0].split(".")[0];

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[s.content, { paddingTop: insets.top + 32 }]}>
        <View style={s.heroSection}>
          <BlurView intensity={50} tint="light" style={s.avatarBlur}>
            <Ionicons name="person" size={48} color="rgba(0,0,0,0.18)" />
          </BlurView>
          <Text style={s.username}>{username}</Text>
          <Text style={s.email}>{email}</Text>
        </View>

        <BlurView intensity={55} tint="light" style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="mail-outline" size={18} color="#888" />
            <View style={s.cardRowText}>
              <Text style={s.cardRowLabel}>Email</Text>
              <Text style={s.cardRowValue} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          <View style={s.cardDivider} />

          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#888" />
            <View style={s.cardRowText}>
              <Text style={s.cardRowLabel}>Konto</Text>
              <Text style={s.cardRowValue}>Zweryfikowane</Text>
            </View>
          </View>

          <View style={s.cardDivider} />

          <TouchableOpacity
            style={s.signOutAction}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#888" />
            <Text style={s.signOutText}>Wyloguj się</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
    marginBottom: 60,
  },
  avatarBlur: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  username: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: "#888",
    fontWeight: "400",
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardRowText: { flex: 1, gap: 2 },
  cardRowLabel: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardRowValue: { fontSize: 15, color: "#1a1a1a", fontWeight: "600" },
  cardDivider: {
    height: 0.5,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 18,
  },
  signOutAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
