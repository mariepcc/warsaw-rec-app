import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchUserAttributes, signOut } from "aws-amplify/auth";
import { useAuthStore } from "@/store/auth/authStore";

const ACCENT = "#66a494";
const GRADIENT: [string, string] = ["#e8d5c4", "#c4d4e8"];

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

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

  const initial = email.charAt(0).toUpperCase();

  const menuItems: MenuItem[] = [
    {
      icon: "notifications-outline",
      label: "Powiadomienia",
      onPress: () => {},
    },
    {
      icon: "shield-checkmark-outline",
      label: "Prywatność",
      onPress: () => {},
    },
    {
      icon: "help-circle-outline",
      label: "Pomoc",
      onPress: () => {},
    },
    {
      icon: "information-circle-outline",
      label: "O aplikacji",
      onPress: () => {},
    },
  ];

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* gradient tło */}
      <LinearGradient
        colors={GRADIENT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* hero sekcja */}
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <LinearGradient
              colors={["#a8c4b8", ACCENT]}
              style={s.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.avatarText}>{initial}</Text>
            </LinearGradient>
          </View>
          <Text style={s.emailText}>{email}</Text>
          <BlurView intensity={60} tint="light" style={s.statRow}>
            <View style={s.stat}>
              <Text style={s.statNum}>—</Text>
              <Text style={s.statLabel}>Sesje</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>—</Text>
              <Text style={s.statLabel}>Zapisane</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>—</Text>
              <Text style={s.statLabel}>Ulubione</Text>
            </View>
          </BlurView>
        </View>

        {/* menu */}
        <BlurView intensity={70} tint="light" style={s.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                s.menuRow,
                index < menuItems.length - 1 && s.menuRowBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={s.menuLeft}>
                <View style={[s.menuIcon, { backgroundColor: ACCENT + "22" }]}>
                  <Ionicons name={item.icon} size={18} color={ACCENT} />
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#bbb" />
            </TouchableOpacity>
          ))}
        </BlurView>

        {/* wyloguj */}
        <TouchableOpacity
          style={s.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <BlurView intensity={70} tint="light" style={s.signOutInner}>
            <Ionicons name="log-out-outline" size={18} color="#e53e3e" />
            <Text style={s.signOutText}>Wyloguj się</Text>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, gap: 16 },

  hero: { alignItems: "center", gap: 12, marginBottom: 8 },

  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },

  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },

  statRow: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 2,
  },
  statNum: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#888", fontWeight: "500" },
  statDivider: {
    width: 0.5,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 10,
  },

  menuCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },

  signOutBtn: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(229,62,62,0.2)",
  },
  signOutInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#e53e3e" },
});
