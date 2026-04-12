import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRICE_LEVELS = [
  { label: "$", value: "PRICE_LEVEL_INEXPENSIVE" },
  { label: "$$", value: "PRICE_LEVEL_MODERATE" },
  { label: "$$$", value: "PRICE_LEVEL_EXPENSIVE" },
  { label: "$$$$", value: "PRICE_LEVEL_LUXURY" },
];

type Props = {
  searchText: string;
  onSearchChange: (text: string) => void;
  activeCategory: string | null;
  activeSub: string | null;
  activePrice: string | null;
  activeDistrict: string | null;
  activeCategoryColor?: string;
  onOpenSub: () => void;
  onOpenPrice: () => void;
  onOpenDistrict: () => void;
};

export function FilterBar({
  searchText,
  onSearchChange,
  activeCategory,
  activeSub,
  activePrice,
  activeDistrict,
  activeCategoryColor,
  onOpenSub,
  onOpenPrice,
  onOpenDistrict,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.scroll}
      contentContainerStyle={s.row}
    >
      <View style={s.searchBox}>
        <Ionicons name="search-outline" size={15} color="#aaa" />
        <TextInput
          style={s.searchInput}
          placeholder="Szukaj..."
          placeholderTextColor="#bbb"
          value={searchText}
          onChangeText={onSearchChange}
        />
      </View>

      {activeCategory && (
        <TouchableOpacity
          style={[
            s.chip,
            activeSub && {
              borderColor: activeCategoryColor,
              backgroundColor: "#bbb",
            },
          ]}
          onPress={onOpenSub}
        >
          <Text
            style={[
              s.chipText,
              activeSub && { color: activeCategoryColor, fontWeight: "600" },
            ]}
          >
            {activeSub ?? "Podkategoria"}
          </Text>
          <Ionicons
            name={activeSub ? "close-circle" : "chevron-down"}
            size={activeSub ? 14 : 13}
            color={activeSub ? activeCategoryColor : "#aaa"}
            style={{ marginLeft: activeSub ? 4 : 2 }}
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[s.chip, activePrice && s.chipActive]}
        onPress={onOpenPrice}
      >
        <Text
          style={[
            s.chipText,
            activePrice && { color: "#E8622A", fontWeight: "600" },
          ]}
        >
          {activePrice
            ? PRICE_LEVELS.find((p) => p.value === activePrice)?.label
            : "Cena"}
        </Text>
        <Ionicons
          name={activePrice ? "close-circle" : "chevron-down"}
          size={activePrice ? 14 : 13}
          color={activePrice ? "#E8622A" : "#aaa"}
          style={{ marginLeft: activePrice ? 4 : 2 }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.chip, activeDistrict && s.chipActive]}
        onPress={onOpenDistrict}
      >
        <Text
          style={[
            s.chipText,
            activeDistrict && { color: "#E8622A", fontWeight: "600" },
          ]}
        >
          {activeDistrict ?? "Warszawa"}
        </Text>
        <Ionicons
          name={activeDistrict ? "close-circle" : "chevron-down"}
          size={activeDistrict ? 14 : 13}
          color={activeDistrict ? "#E8622A" : "#aaa"}
          style={{ marginLeft: activeDistrict ? 4 : 2 }}
        />
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { height: 56, flexGrow: 0 },
  row: { paddingHorizontal: 16, alignItems: "center", gap: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: "#ebebeb",
    minWidth: 130,
  },
  searchInput: { fontSize: 14, color: "#1a1a1a", padding: 0, minWidth: 90 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ebebeb",
  },
  chipActive: { borderColor: "#E8622A", backgroundColor: "#FEF0EA" },
  chipText: { fontSize: 14, color: "#666", fontWeight: "500" },
});
