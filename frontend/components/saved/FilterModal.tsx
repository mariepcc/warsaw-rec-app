import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ModalType = "sub" | "price" | "district" | null;

type Props = {
  visible: boolean;
  type: ModalType;
  items: ({ label: string; value: string } | string)[];
  activeValue: string | null;
  onSelect: (value: string | null) => void;
  onClose: () => void;
};

const TITLES: Record<string, string> = {
  sub: "Podkategoria",
  price: "Poziom cen",
  district: "Dzielnica",
};

export function FilterModal({
  visible,
  type,
  items,
  activeValue,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>{type ? TITLES[type] : ""}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const isObj = typeof item === "object";
              const label = isObj ? item.label : item;
              const value = isObj ? item.value : item;
              const isActive = activeValue === value;

              return (
                <TouchableOpacity
                  key={value}
                  style={s.row}
                  onPress={() => {
                    onSelect(isActive ? null : value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      s.rowText,
                      isActive && { color: "#E8622A", fontWeight: "700" },
                    ]}
                  >
                    {label}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#E8622A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={s.clearBtn}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text style={s.clearBtnText}>Wyczyść</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
  clearBtnText: { fontSize: 15, color: "#999", fontWeight: "600" },
});
