import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Feather } from "@expo/vector-icons";
import { Session } from "@/api/sessions";

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
  headerHeight,
}: Props) {
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
          <TouchableOpacity style={s.newChatBtn} onPress={onNewChat}>
            <Text style={s.newChatPlus}>+</Text>
            <Text style={s.newChatLabel}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
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
    borderColor: "rgba(119, 114, 114, 0.1)",
  },
  deleteActionText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
