import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Category = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type Props = {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (key: string) => void;
  onClearCategory: () => void;
};

export function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
  onClearCategory,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.scroll}
      contentContainerStyle={s.row}
      bounces={false}
      overScrollMode="never"
    >
      <TouchableOpacity
        style={[s.circle, !activeCategory && s.allActive]}
        onPress={onClearCategory}
      >
        <Ionicons
          name="star"
          size={21}
          color={!activeCategory ? "#fff" : "#aaa"}
        />
        {!activeCategory && <Text style={s.activeLabel}>All</Text>}
      </TouchableOpacity>

      {categories.map((cat) => {
        const active = activeCategory === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[
              s.circle,
              active
                ? {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                    flexDirection: "row",
                    width: undefined,
                    paddingHorizontal: 18,
                    gap: 8,
                  }
                : {
                    borderWidth: 0.5,
                    borderColor: "#929292",
                    backgroundColor: "#f2f2f2",
                  },
            ]}
            onPress={() => onSelect(cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={21}
              color={active ? "#fff" : "#929292"}
            />
            {active && <Text style={s.activeLabel}>{cat.label}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { height: 76, flexGrow: 0 },
  row: { paddingHorizontal: 16, alignItems: "center", gap: 10 },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#929292",
    backgroundColor: "#f2f2f2",
  },
  allActive: {
    backgroundColor: "#E8622A",
    borderColor: "#E8622A",
    flexDirection: "row",
    width: undefined,
    paddingHorizontal: 18,
    gap: 8,
  },
  activeLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
