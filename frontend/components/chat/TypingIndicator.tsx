import { View, Text, StyleSheet } from "react-native";

const ACCENT = "#dcc3c3";
const LOADING_MESSAGES = [
  "Analizuję...",
  "Sprawdzam najlepsze miejsca...",
  "Wciąż szukam...",
  "Już prawie mam...",
];

export function TypingIndicator({ index }: { index: number }) {
  return (
    <View style={s.row}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>W</Text>
      </View>
      <Text style={s.text}>{LOADING_MESSAGES[index]}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  text: { fontSize: 14, color: "#888", fontStyle: "italic" },
});
