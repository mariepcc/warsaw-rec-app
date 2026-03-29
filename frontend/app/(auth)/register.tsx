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
import { signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState<"register" | "confirm">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) {
      setError("Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email },
        },
      });
      setStep("confirm");
    } catch (err: any) {
      switch (err.name) {
        case "UsernameExistsException":
          setError("Konto z tym emailem już istnieje");
          break;
        case "InvalidPasswordException":
          setError("Hasło musi mieć min. 8 znaków, wielką literę i cyfrę");
          break;
        default:
          setError("Coś poszło nie tak, spróbuj ponownie");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!code) {
      setError("Wpisz kod weryfikacyjny");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      router.replace("/(auth)/login");
    } catch (err: any) {
      switch (err.name) {
        case "CodeMismatchException":
          setError("Nieprawidłowy kod");
          break;
        case "ExpiredCodeException":
          setError("Kod wygasł — wyślij nowy");
          break;
        default:
          setError("Coś poszło nie tak, spróbuj ponownie");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      await resendSignUpCode({ username: email });
    } catch {
      setError("Nie udało się wysłać kodu");
    }
  }

  if (step === "confirm") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Potwierdź email</Text>
          <Text style={styles.subtitle}>Wysłaliśmy kod na {email}</Text>

          <TextInput
            style={styles.input}
            placeholder="Kod weryfikacyjny"
            placeholderTextColor="#888"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Potwierdź</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.link}>Wyślij kod ponownie</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Warsaw Rec</Text>
        <Text style={styles.subtitle}>Utwórz konto</Text>

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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zarejestruj się</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Masz już konto? Zaloguj się</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  subtitle: { fontSize: 18, color: "#666", marginBottom: 32 },
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
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#e53e3e", marginBottom: 12, fontSize: 14 },
  link: { color: "#666", textAlign: "center", fontSize: 14 },
});
