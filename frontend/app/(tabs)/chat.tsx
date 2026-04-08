import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { usePlaceStore } from "@/store/places/placesStore";
import { useGradientCycle } from "@/hooks/useGradientCycle";
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

const ACCENT = "#dcc3c3";
const LOADING_MESSAGES = [
  "Thinking...",
  "Looking for local gems...",
  "Still searching...",
  "Almost there...",
];

const MessageItem = memo(
  ({
    item,
    onPlacePress,
  }: {
    item: Message;
    onPlacePress: (place: Place) => void;
  }) => {
    const isUser = item.role === "user";
    const showPlaces =
      !isUser && !item.isFollowup && item.places && item.places.length > 0;

    return (
      <View style={[msg.row, isUser ? msg.rowUser : msg.rowAssistant]}>
        <View style={[msg.col, isUser && { alignItems: "flex-end" }]}>
          <View style={isUser ? msg.bubbleUser : msg.assistantTextContainer}>
            <Text style={[msg.text, isUser ? msg.textUser : msg.textAssistant]}>
              {item.content}
            </Text>
          </View>
          {showPlaces && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 16 }}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {item.places!.map((place) => (
                <PlaceCard
                  key={place.name}
                  place={place}
                  onPress={() => onPlacePress(place)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  },
);

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, advance } = useGradientCycle();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const lastScrollY = useRef(0);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
      scrollToBottom(true);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToBottom]);

  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  function handleScroll(e: any) {
    const y = e.nativeEvent.contentOffset.y;
    if (Math.abs(y - lastScrollY.current) > 150) {
      lastScrollY.current = y;
      advance();
    }
  }

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
    setMessages([]);
    setSessionLoading(true);
    try {
      const msgs = await getSessionMessages(session.id);
      setMessages(
        msgs.map((m: any) => ({
          id: uuid.v4() as string,
          role: m.role,
          content: m.content,
          places: m.places ?? [],
          isFollowup: m.type === "followup",
        })),
      );
    } catch {
    } finally {
      setSessionLoading(false);
    }
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
    Keyboard.dismiss();
    setMessages((prev) => [
      ...prev,
      { id: uuid.v4() as string, role: "user", content: text },
    ]);
    setInput("");
    setLoading(true);
    scrollToBottom(true);
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
      scrollToBottom(true);
    }
  }, [input, loading, sessionId, scrollToBottom]);

  const handlePlacePress = useCallback(
    (place: Place) => {
      usePlaceStore.getState().setSelectedPlace(place);
      router.push({
        pathname: "/(tabs)/saved/[name]",
        params: { name: encodeURIComponent(place.name) },
      } as any);
    },
    [router],
  );

  function groupSessionsByDate(sessions: Session[]) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todaySessions: Session[] = [];
    const yesterdaySessions: Session[] = [];
    const olderSessions: Session[] = [];

    sessions.forEach((s) => {
      const date = new Date(s.created_at);
      if (date.toDateString() === today.toDateString()) todaySessions.push(s);
      else if (date.toDateString() === yesterday.toDateString())
        yesterdaySessions.push(s);
      else olderSessions.push(s);
    });

    return [
      ...(todaySessions.length > 0
        ? [{ title: "Dzisiaj", sessions: todaySessions }]
        : []),
      ...(yesterdaySessions.length > 0
        ? [{ title: "Wczoraj", sessions: yesterdaySessions }]
        : []),
      ...(olderSessions.length > 0
        ? [{ title: "Wcześniej", sessions: olderSessions }]
        : []),
    ];
  }

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      return <MessageItem item={item} onPlacePress={handlePlacePress} />;
    },
    [handlePlacePress],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {historyVisible ? (
        <View style={hist.fullScreen}>
          <BlurView
            intensity={60}
            tint="light"
            style={[
              styles.headerCommon,
              {
                paddingTop: insets.top,
                backgroundColor: "rgba(255,255,255,0.7)",
              },
            ]}
          >
            <View style={styles.headerInner}>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Text style={hist.backBtn}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={hist.headerNewChatBtn}
                onPress={startNewChat}
              >
                <Text style={hist.newChatPlus}>+</Text>
                <Text style={hist.newChatLabel}>New Chat</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          {sessionsLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
          ) : sessions.length === 0 ? (
            <Text style={hist.empty}>Brak historii chatów</Text>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 16,
                paddingTop: 20,
              }}
            >
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
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <BlurView
            intensity={60}
            tint="light"
            style={[
              styles.headerCommon,
              styles.headerAbsolute,
              {
                paddingTop: insets.top,
                backgroundColor: "rgba(255,255,255,0.4)",
              },
            ]}
          >
            <View style={styles.headerInner}>
              <Text style={styles.headerTitle}>GoExplore</Text>
              <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
                <Text style={styles.historyBtnText}>☰</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {sessionLoading ? (
              <View style={styles.sessionLoadingContainer}>
                <ActivityIndicator size="large" color={ACCENT} />
              </View>
            ) : (
              <Animated.FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                automaticallyAdjustKeyboardInsets={true}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.list,
                  { paddingTop: insets.top + 90, paddingBottom: 10 },
                ]}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={() => scrollToBottom(false)}
                onLayout={() => scrollToBottom(false)}
                windowSize={10}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                removeClippedSubviews={Platform.OS === "android"}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                      <Text style={styles.emptyIconText}>W</Text>
                    </View>
                    <Text style={styles.emptyTitle}>Cześć!</Text>
                    <Text style={styles.emptySubtitle}>
                      Zapytaj mnie o restauracje, kawiarnie, parki lub atrakcje
                      w Warszawie.
                    </Text>
                  </View>
                }
              />
            )}

            {loading && (
              <View style={styles.typingRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>W</Text>
                </View>
                <Text style={styles.typingText}>
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </Text>
              </View>
            )}

            <BlurView
              intensity={60}
              tint="light"
              style={[
                styles.inputWrapper,
                {
                  paddingBottom: keyboardOpen
                    ? 12
                    : Math.max(insets.bottom, 16) + 70,
                  backgroundColor: "rgba(255,255,255,0.4)",
                },
              ]}
            >
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Type here..."
                  placeholderTextColor="#999"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !input.trim() && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <Text style={styles.sendBtnText}>↑</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}

const msg = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24 },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  col: { flex: 1 },
  bubbleUser: {
    backgroundColor: "rgba(228, 150, 119, 0.36)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  assistantTextContainer: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  text: { fontSize: 15, lineHeight: 24, color: "#2a2828" },
  textUser: { fontWeight: "600" },
  textAssistant: { fontWeight: "400" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

const hist = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "transparent" },
  backBtn: { fontSize: 22, color: "#1a1a1a", width: 32 },
  headerNewChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  newChatPlus: { fontSize: 20, color: "#777", fontWeight: "300" },
  newChatLabel: { fontSize: 16, fontWeight: "500", color: "#777" },
  groupTitle: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  sessionRow: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sessionText: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  empty: { textAlign: "center", color: "#888", marginTop: 24, fontSize: 14 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  typingText: { fontSize: 14, color: "#888", fontStyle: "italic" },
  headerCommon: {
    paddingHorizontal: 20,
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerAbsolute: { position: "absolute", top: 0, left: 0, right: 0 },
  headerInner: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  historyBtnText: { color: "#1a1a1a", fontSize: 20 },
  list: { paddingHorizontal: 16, flexGrow: 1 },
  sessionLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 170,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
    lineHeight: 21,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderRadius: 30,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    maxHeight: 120,
    padding: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "rgba(0,0,0,0.1)" },
  sendBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
