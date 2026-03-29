import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { signIn } from "aws-amplify/auth";
import { useAuthStore } from "@/store/auth/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthenticated, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        options: {
          authFlowType: "USER_PASSWORD_AUTH",
        },
      });

      if (isSignedIn) {
        setUser({ email });
        setAuthenticated(true);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Warsaw Rec</Text>
        <Text style={styles.subtitle}>Zaloguj się</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Hasło"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zaloguj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Nie masz konta? Zarejestruj się</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: "#1a1a1a",
  },
  button: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#e53e3e",
    marginBottom: 12,
    fontSize: 14,
  },
  link: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});
