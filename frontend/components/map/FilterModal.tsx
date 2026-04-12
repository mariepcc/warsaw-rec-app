import { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  title: string;
  items: { label: string; value: string }[];
  activeValue: string | null;
  onSelect: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export const FilterModal = memo(
  ({
    visible,
    title,
    items,
    activeValue,
    onSelect,
    onClear,
    onClose,
  }: Props) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = activeValue === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={s.row}
                  onPress={() => {
                    onSelect(active ? "" : item.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      s.rowText,
                      active && { color: "#E8622A", fontWeight: "700" },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color="#E8622A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => {
              onClear();
              onClose();
            }}
          >
            <Text style={s.clearText}>Wyczyść</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  ),
);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "65%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  rowText: { fontSize: 15, color: "#333" },
  clearBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  clearText: { fontSize: 15, color: "#999", fontWeight: "600" },
});
