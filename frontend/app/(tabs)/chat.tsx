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
  ScrollView,
  Animated,
  Modal,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { sendMessage } from "@/api/chat";
import { getSessions, getSessionMessages } from "@/api/sessions";
import type { Session } from "@/api/sessions";
import { Place } from "@/api/places";
import { PlaceCard } from "@/components/places/PlaceCard";
import uuid from "react-native-uuid";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  places?: Place[];
  isFollowup?: boolean;
};

const ACCENT = "#66a494";
const PRIMARY_GRADIENT = ["#1a2421", "#0f1614", "#0a0a0a"] as const;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const animatedOverlayOpacity = scrollY.interpolate({
    inputRange: [0, 500, 1000],
    outputRange: [0, 0.4, 0.8],
    extrapolate: "clamp",
  });

  async function openHistory() {
    setHistoryVisible(true);
    setSessionsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadSession(session: Session) {
    setHistoryVisible(false);
    setSessionId(session.id);
    try {
      const msgs = await getSessionMessages(session.id);
      setMessages(
        msgs.map((m: any) => ({
          id: uuid.v4() as string,
          role: m.role,
          content: m.content,
        })),
      );
    } catch {}
  }

  function startNewChat() {
    setHistoryVisible(false);
    setMessages([]);
    setSessionId(undefined);
    setInput("");
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: uuid.v4() as string, role: "user", content: text },
    ]);
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
          isFollowup: response.type === "followup",
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

  function handlePlacePress(place: Place) {
    router.push({
      pathname: "/(tabs)/saved/[name]",
      params: {
        name: encodeURIComponent(place.name),
        data: JSON.stringify(place),
      },
    } as any);
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    const showPlaces =
      !isUser && !item.isFollowup && item.places && item.places.length > 0;

    return (
      <View style={[msg.row, isUser ? msg.rowUser : msg.rowAssistant]}>
        {!isUser && (
          <View style={msg.avatar}>
            <Text style={msg.avatarText}>W</Text>
          </View>
        )}
        <View style={[msg.col, isUser && { alignItems: "flex-end" }]}>
          <View
            style={[msg.bubble, isUser ? msg.bubbleUser : msg.bubbleAssistant]}
          >
            <Text style={[msg.text, isUser ? msg.textUser : msg.textAssistant]}>
              {item.content}
            </Text>
          </View>
          {showPlaces && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {item.places!.map((place) => (
                <PlaceCard
                  key={place.name}
                  place={place}
                  onPress={() => handlePlacePress(place)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  function groupSessionsByDate(sessions: Session[]) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { title: string; sessions: Session[] }[] = [];
    const todaySessions: Session[] = [];
    const yesterdaySessions: Session[] = [];
    const olderSessions: Session[] = [];

    sessions.forEach((s) => {
      const date = new Date(s.created_at);
      if (date.toDateString() === today.toDateString()) {
        todaySessions.push(s);
      } else if (date.toDateString() === yesterday.toDateString()) {
        yesterdaySessions.push(s);
      } else {
        olderSessions.push(s);
      }
    });

    if (todaySessions.length > 0)
      groups.push({ title: "Dzisiaj", sessions: todaySessions });
    if (yesterdaySessions.length > 0)
      groups.push({ title: "Wczoraj", sessions: yesterdaySessions });
    if (olderSessions.length > 0)
      groups.push({ title: "Wcześniej", sessions: olderSessions });

    return groups;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={PRIMARY_GRADIENT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "#000",
            opacity: animatedOverlayOpacity,
            pointerEvents: "none",
          },
        ]}
      />

      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
            <Text style={styles.newChatText}>+ Nowy chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
            <Text style={styles.historyBtnText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
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
              <ActivityIndicator size="small" color="#aaa" />
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
              placeholderTextColor="#666"
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

      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={hist.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setHistoryVisible(false)}
          />
          <View style={[hist.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={hist.handle} />
            <View style={hist.sheetHeader}>
              <Text style={hist.sheetTitle}>Historia chatów</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Text style={hist.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={hist.newBtn} onPress={startNewChat}>
              <Text style={hist.newBtnText}>+ Nowy chat</Text>
            </TouchableOpacity>

            {sessionsLoading ? (
              <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
            ) : sessions.length === 0 ? (
              <Text style={hist.empty}>Brak historii chatów</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {groupSessionsByDate(sessions).map((group) => (
                  <View key={group.title}>
                    <Text style={hist.groupTitle}>{group.title}</Text>
                    {group.sessions.map((session) => (
                      <TouchableOpacity
                        key={session.id}
                        style={hist.sessionRow}
                        onPress={() => loadSession(session)}
                      >
                        <Text style={hist.sessionText} numberOfLines={1}>
                          {session.first_message ?? "Bez tytułu"}
                        </Text>
                        <Text style={hist.sessionMeta}>
                          {session.message_count} wiad.
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const msg = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  col: { flex: 1 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "90%",
  },
  bubbleUser: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  text: { fontSize: 15, lineHeight: 22 },
  textUser: { color: "#fff" },
  textAssistant: { color: "#E8E8E8" },
});

const hist = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeBtn: { fontSize: 18, color: "#666" },
  newBtn: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  newBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  groupTitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  sessionText: {
    flex: 1,
    fontSize: 14,
    color: "#E8E8E8",
    fontWeight: "500",
  },
  sessionMeta: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
  },
  empty: {
    textAlign: "center",
    color: "#555",
    marginTop: 24,
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  newChatBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  newChatText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  historyBtnText: { color: "#fff", fontSize: 18 },
  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  typingBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
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
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 21,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    maxHeight: 120,
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
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.15)" },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
});
