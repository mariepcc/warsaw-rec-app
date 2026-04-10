import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { BlurView } from "expo-blur";

const ACCENT = "#dcc3c3";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
  paddingBottom: number;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  paddingBottom,
}: Props) {
  return (
    <BlurView
      intensity={60}
      tint="light"
      style={[
        s.wrapper,
        { paddingBottom, backgroundColor: "rgba(255,255,255,0.4)" },
      ]}
    >
      <View style={s.row}>
        <TextInput
          style={s.input}
          placeholder="Type here..."
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChange}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!value.trim() || disabled) && s.sendBtnDisabled]}
          onPress={onSend}
          disabled={!value.trim() || disabled}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const s = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 12 },
  row: {
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
