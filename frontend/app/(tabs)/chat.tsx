import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendMessage } from "@/api/chat";
import { Place } from "@/api/places";
import { PlacesBottomSheet } from "@/components/places/PlacesBottomSheet";
import uuid from "react-native-uuid";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  places?: Place[];
};

const ACCENT = "#66a494";
const PURPLE = "#7C6FCD";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetPlaces, setSheetPlaces] = useState<Place[]>([]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    const userMessage: Message = {
      id: uuid.v4() as string,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(text, sessionId);
      setSessionId(response.session_id);
      setMessages((prev) => [
        ...prev,
        {
          id: uuid.v4() as string,
          role: "assistant",
          content: response.answer,
          places: response.places ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuid.v4() as string,
          role: "assistant",
          content: "Coś poszło nie tak, spróbuj ponownie.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [input, loading, sessionId]);

  function openSheet(places: Place[]) {
    setSheetPlaces(places);
    setSheetVisible(true);
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    const hasPlaces = !isUser && item.places && item.places.length > 0;

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.rowUser : styles.rowAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>W</Text>
          </View>
        )}
        <View style={styles.bubbleCol}>
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.textUser : styles.textAssistant,
              ]}
            >
              {item.content}
            </Text>
          </View>

          {/* przycisk "Zobacz N miejsc" */}
          {hasPlaces && (
            <PlacesButton
              count={item.places!.length}
              onPress={() => openSheet(item.places!)}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wawa Guide</Text>
        <Text style={styles.headerSub}>Twój przewodnik po Warszawie</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>W</Text>
              </View>
              <Text style={styles.emptyTitle}>Cześć!</Text>
              <Text style={styles.emptySubtitle}>
                Zapytaj mnie o restauracje, kawiarnie, parki lub atrakcje w
                Warszawie.
              </Text>
            </View>
          }
        />

        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>W</Text>
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#666" />
            </View>
          </View>
        )}

        <View
          style={[
            styles.inputWrapper,
            { paddingBottom: Math.max(insets.bottom - 20, 8) },
          ]}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Napisz wiadomość..."
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom sheet — nad chatem, poza KeyboardAvoidingView */}
      <PlacesBottomSheet
        visible={sheetVisible}
        places={sheetPlaces}
        sessionId={sessionId}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

// ─── PlacesButton ─────────────────────────────────────────────────────────────

function PlacesButton({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View
      style={{ transform: [{ scale }], alignSelf: "flex-start", marginTop: 6 }}
    >
      <TouchableOpacity
        style={btnStyles.btn}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={btnStyles.icon}>📍</Text>
        <Text style={btnStyles.text}>
          Zobacz {count}{" "}
          {count === 1 ? "miejsce" : count < 5 ? "miejsca" : "miejsc"}
        </Text>
        <Text style={btnStyles.arrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PURPLE,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: { fontSize: 14 },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  arrow: {
    color: "#ffffffcc",
    fontSize: 18,
    fontWeight: "300",
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EBEBEB",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: "#999", marginTop: 1 },
  list: { padding: 16, paddingBottom: 8, gap: 12, flexGrow: 1 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  bubbleCol: {
    flexDirection: "column",
    maxWidth: "78%",
  },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#111",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  bubbleAssistant: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  textUser: { color: "#fff" },
  textAssistant: { color: "#111" },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIconText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
  },
  inputWrapper: {
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "#EBEBEB",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    maxHeight: 120,
    textAlignVertical: "center",
    padding: 0,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#CCC" },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
});
