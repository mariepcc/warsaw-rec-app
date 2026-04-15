import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { BlurView } from "expo-blur";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Feather } from "@expo/vector-icons";
import { Session } from "@/api/sessions";
import { searchChatHistory, ChatSearchResponse } from "@/api/chat";

const ACCENT = "#dcc3c3";

type Group = { title: string; sessions: Session[] };
type Props = {
  groups: Group[];
  loading: boolean;
  paddingTop: number;
  paddingBottom: number;
  onBack: () => void;
  onNewChat: () => void;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  headerHeight: number;
};

export function ChatHistory({
  groups,
  loading,
  paddingTop,
  paddingBottom,
  onBack,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchResponse[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const inputWidth = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(inputWidth, {
      toValue: searchOpen ? 1 : 0,
      useNativeDriver: false,
      tension: 70,
      friction: 12,
    }).start(() => {
      if (searchOpen) inputRef.current?.focus();
    });

    if (!searchOpen) {
      setQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchChatHistory(query);
        setSearchResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  function handleDelete(sessionId: string) {
    Alert.alert("Usuń chat", "Na pewno chcesz usunąć tę rozmowę?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => onDeleteSession(sessionId),
      },
    ]);
  }

  function renderRightActions(sessionId: string) {
    return (
      <View style={s.deleteActionContainer}>
        <TouchableOpacity
          style={s.deleteAction}
          onPress={() => handleDelete(sessionId)}
        >
          <Feather name="trash-2" size={18} color="#534e4e" />
        </TouchableOpacity>
      </View>
    );
  }

  const animatedWidth = inputWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "65%"],
  });

  const showSearch = searchOpen && query.length >= 2;

  return (
    <View style={s.fullScreen}>
      <BlurView
        intensity={60}
        tint="light"
        style={[
          s.header,
          { paddingTop, backgroundColor: "rgba(255,255,255,0.7)" },
        ]}
      >
        <View style={s.headerInner}>
          <TouchableOpacity onPress={onBack}>
            <Text style={s.backBtn}>←</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Animated.View
              style={[
                s.searchInputWrapper,
                {
                  width: animatedWidth,
                  opacity: inputWidth,
                  pointerEvents: searchOpen ? "auto" : "none",
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={s.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Szukaj..."
                placeholderTextColor="#aaa"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Feather name="x" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </Animated.View>

            <TouchableOpacity
              style={[
                s.newChatBtn,
                { width: 48, paddingHorizontal: 0, justifyContent: "center" },
                searchOpen && {
                  backgroundColor: "rgba(220,195,195,0.2)",
                  borderColor: ACCENT,
                },
              ]}
              onPress={() => setSearchOpen((v) => !v)}
            >
              <Feather
                name={searchOpen ? "x" : "search"}
                size={20}
                color={searchOpen ? ACCENT : "#777"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={s.newChatBtn} onPress={onNewChat}>
              <Text style={s.newChatPlus}>+</Text>
              <Text style={s.newChatLabel}>New Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
      ) : showSearch ? (
        searchLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
        ) : searchResults.length === 0 ? (
          <Text style={s.empty}>Nie znaleziono rozmów.</Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom,
              paddingTop: 20,
            }}
          >
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.sessionRow}
                onPress={() => onSelectSession({ id: item.id } as Session)}
              >
                <Text style={s.sessionText} numberOfLines={1}>
                  {item.first_message ?? "Bez tytułu"}
                </Text>
                <Text style={s.sessionDate}>
                  {new Date(item.created_at).toLocaleDateString("pl-PL")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      ) : groups.length === 0 ? (
        <Text style={s.empty}>Brak historii chatów</Text>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom,
            paddingTop: 20,
          }}
        >
          {groups.map((group) => (
            <View key={group.title}>
              <Text style={s.groupTitle}>{group.title}</Text>
              {group.sessions.map((session) => (
                <Swipeable
                  key={session.id}
                  renderRightActions={() => renderRightActions(session.id)}
                  rightThreshold={40}
                  overshootRight={false}
                >
                  <TouchableOpacity
                    style={s.sessionRow}
                    onPress={() => onSelectSession(session)}
                  >
                    <Text style={s.sessionText} numberOfLines={1}>
                      {session.first_message ?? "Bez tytułu"}
                    </Text>
                  </TouchableOpacity>
                </Swipeable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "transparent" },
  header: {
    paddingHorizontal: 20,
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerInner: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { fontSize: 22, color: "#1a1a1a", width: 32 },
  newChatBtn: {
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
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    overflow: "hidden",
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1a1a1a" },
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
  sessionDate: { fontSize: 12, color: "#aaa", marginTop: 4 },
  empty: { textAlign: "center", color: "#888", marginTop: 24, fontSize: 14 },
  deleteActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 12,
  },
  deleteAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(119,114,114,0.1)",
  },
  deleteActionText: { color: "white", fontWeight: "600", fontSize: 15 },
});
