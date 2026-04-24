import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { signIn } from "aws-amplify/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthenticated, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Wypełnij wszystkie pola");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
        options: { authFlowType: "USER_PASSWORD_AUTH" },
      });
      if (isSignedIn) {
        setUser({ email });
        setAuthenticated(true);
        router.replace("/(tabs)/chat");
      }
    } catch (err: any) {
      switch (err.name) {
        case "NotAuthorizedException":
          setError("Nieprawidłowy email lub hasło");
          break;
        case "UserNotFoundException":
          setError("Konto nie istnieje");
          break;
        case "UserNotConfirmedException":
          setError("Potwierdź swój email przed zalogowaniem");
          break;
        default:
          setError("Coś poszło nie tak, spróbuj ponownie");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#F8F8F8" }]} />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={s.logoWrap}>
          <LinearGradient
            colors={["#F5934A", "#E8622A"]}
            style={s.logoGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="location" size={26} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={s.appName}>SpotGuide</Text>
        <Text style={s.headline}>Witaj z powrotem</Text>
        <Text style={s.sub}>Zaloguj się, żeby odkrywać Warszawę</Text>

        <View style={s.form}>
          <View style={[s.inputWrap, emailFocused && s.inputWrapFocused]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={emailFocused ? "#1a1a1a" : "#ccc"}
              style={s.inputIcon}
            />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              returnKeyType="next"
            />
          </View>

          <View style={[s.inputWrap, passFocused && s.inputWrapFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={passFocused ? "#1a1a1a" : "#ccc"}
              style={s.inputIcon}
            />
            <TextInput
              style={s.input}
              placeholder="Hasło"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={s.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorWrap}>
              <Ionicons name="alert-circle-outline" size={14} color="#E8622A" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={s.btn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#F5934A", "#E8622A"]}
              style={s.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Zaloguj się</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Nie masz konta?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={s.footerLink}> Zarejestruj się</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 28, flexGrow: 1, justifyContent: "center" },

  logoWrap: { marginBottom: 20 },
  logoGrad: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  appName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E8622A",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  headline: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  sub: { fontSize: 15, color: "#bbb", marginBottom: 36 },

  form: { gap: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapFocused: { borderColor: "#1a1a1a" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a", padding: 0 },
  eyeBtn: { padding: 4 },

  errorWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  errorText: { fontSize: 13, color: "#E8622A", flex: 1 },

  btn: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  btnGrad: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14, color: "#bbb" },
  footerLink: { fontSize: 14, color: "#E8622A", fontWeight: "700" },
});
