import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export type MapFilterKey =
  | "saved"
  | "Gastronomia"
  | "Kawa i Słodycze"
  | "Kultura & Rozrywka"
  | "Życie Nocne"
  | "Natura & Rekreacja";

export type MapFilter = {
  key: MapFilterKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradientColors: [string, string];
  lightColor: string;
};

export const MAP_FILTERS: MapFilter[] = [
  {
    key: "saved",
    label: "Zapisane",
    icon: "heart-outline",
    color: "#E8622A",
    gradientColors: ["#F5934A", "#E8622A"],
    lightColor: "#FEF0EA",
  },
  {
    key: "Gastronomia",
    label: "Jedzenie",
    icon: "restaurant-outline",
    color: "#E8622A",
    gradientColors: ["#F5934A", "#E8622A"],
    lightColor: "#FEF0EA",
  },
  {
    key: "Kawa i Słodycze",
    label: "Kawa",
    icon: "cafe-outline",
    color: "#7C5CBF",
    gradientColors: ["#9B7FD4", "#7C5CBF"],
    lightColor: "#F2EEFB",
  },
  {
    key: "Kultura & Rozrywka",
    label: "Kultura",
    icon: "color-palette-outline",
    color: "#2A8BE8",
    gradientColors: ["#5AADF5", "#2A8BE8"],
    lightColor: "#EAF2FE",
  },
  {
    key: "Życie Nocne",
    label: "Nocne",
    icon: "musical-notes-outline",
    color: "#3D3D5C",
    gradientColors: ["#6B6B9A", "#3D3D5C"],
    lightColor: "#EEEEF5",
  },
  {
    key: "Natura & Rekreacja",
    label: "Natura",
    icon: "leaf-outline",
    color: "#2A9E6A",
    gradientColors: ["#4DC48A", "#2A9E6A"],
    lightColor: "#EAF7F2",
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  saved: "#E8622A",
  Gastronomia: "#E8622A",
  "Kawa i Słodycze": "#7C5CBF",
  "Kultura & Rozrywka": "#2A8BE8",
  "Życie Nocne": "#3D3D5C",
  "Natura & Rekreacja": "#2A9E6A",
};

export const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  saved: ["#F5934A", "#E8622A"],
  Gastronomia: ["#F5934A", "#E8622A"],
  "Kawa i Słodycze": ["#9B7FD4", "#7C5CBF"],
  "Kultura & Rozrywka": ["#5AADF5", "#2A8BE8"],
  "Życie Nocne": ["#6B6B9A", "#3D3D5C"],
  "Natura & Rekreacja": ["#4DC48A", "#2A9E6A"],
};

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  saved: "heart-outline",
  Gastronomia: "restaurant-outline",
  "Kawa i Słodycze": "cafe-outline",
  "Kultura & Rozrywka": "color-palette-outline",
  "Życie Nocne": "musical-notes-outline",
  "Natura & Rekreacja": "leaf-outline",
};

export const SUB_BY_CATEGORY: Record<string, string[]> = {
  Gastronomia: [
    "Restauracja",
    "Kuchnia Azjatycka",
    "Kuchnia Włoska",
    "Kuchnia Polska",
    "Kuchnia Indyjska",
    "Burgery & Amerykańska",
    "Steki & Grill",
    "Kuchnia Latynoamerykańska",
    "Owoce Morza & Ryby",
    "Kuchnia Roślinna",
    "Fast Food & Przekąski",
    "Kebab & Bliskowschodnia",
    "Kuchnie Świata (Inne)",
  ],
  "Kawa i Słodycze": [
    "Kawiarnia",
    "Piekarnia & Cukiernia",
    "Lody & Zimne Desery",
  ],
  "Kultura & Rozrywka": [
    "Muzeum & Galeria",
    "Atrakcje & Zabytki",
    "Edukacja & Nauka",
    "Rozrywka Aktywna",
  ],
  "Życie Nocne": ["Bar", "Klub"],
  "Natura & Rekreacja": ["Park & Ogród", "ZOO & Akwarium"],
  saved: [],
};

export const PRICE_LEVELS = [
  { label: "$", value: "PRICE_LEVEL_INEXPENSIVE" },
  { label: "$$", value: "PRICE_LEVEL_MODERATE" },
  { label: "$$$", value: "PRICE_LEVEL_EXPENSIVE" },
  { label: "$$$$", value: "PRICE_LEVEL_LUXURY" },
];

export const DISTRICTS = [
  "Śródmieście",
  "Mokotów",
  "Żoliborz",
  "Wola",
  "Ochota",
  "Praga Południe",
  "Praga Północ",
  "Ursynów",
  "Wilanów",
  "Bielany",
  "Targówek",
  "Rembertów",
  "Wawer",
  "Wesoła",
];

type Props = {
  activeFilter: MapFilterKey;
  onFilterChange: (key: MapFilterKey) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  activeSub: string | null;
  onSubChange: (v: string | null) => void;
  activePrice: string | null;
  onPriceChange: (v: string | null) => void;
  activeDistrict: string | null;
  onDistrictChange: (v: string | null) => void;
  onOpenModal: (type: "sub" | "price" | "district") => void;
};

export default function MapFilterBar({
  activeFilter,
  onFilterChange,
  searchText,
  onSearchChange,
  activeSub,
  activePrice,
  activeDistrict,
  onOpenModal,
}: Props) {
  const insets = useSafeAreaInsets();
  const HEADER_H = insets.top + 76 + 56; // catRow + filterRow (no title row to save space)

  const activeMeta = MAP_FILTERS.find((f) => f.key === activeFilter)!;
  const hasSubs = SUB_BY_CATEGORY[activeFilter]?.length > 0;

  return (
    <BlurView
      intensity={75}
      tint="light"
      style={[styles.container, { height: HEADER_H, paddingTop: insets.top }]}
    >
      {/* ROW 1 – category icons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catRow}
        bounces={false}
        decelerationRate="fast"
        overScrollMode="never"
      >
        {MAP_FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              activeOpacity={0.8}
            >
              {active ? (
                <LinearGradient
                  colors={f.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.catCircle, styles.catCircleActive]}
                >
                  <Ionicons name={f.icon} size={20} color="#fff" />
                  <Text style={styles.catActiveLabel}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.catCircle,
                    {
                      backgroundColor: f.lightColor,
                      borderColor: "transparent",
                    },
                  ]}
                >
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ROW 2 – search + chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
        bounces={false}
      >
        {/* search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj..."
            placeholderTextColor="#bbb"
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>

        {/* subcategory – only when category has subs */}
        {hasSubs && (
          <TouchableOpacity
            style={[
              styles.chip,
              activeSub && {
                borderColor: activeMeta.color,
                backgroundColor: activeMeta.lightColor,
              },
            ]}
            onPress={() => onOpenModal("sub")}
          >
            <Text
              style={[
                styles.chipText,
                activeSub && { color: activeMeta.color, fontWeight: "600" },
              ]}
            >
              {activeSub ?? "Podkategoria"}
            </Text>
            {activeSub ? (
              <Ionicons
                name="close-circle"
                size={14}
                color={activeMeta.color}
                style={{ marginLeft: 4 }}
              />
            ) : (
              <Ionicons
                name="chevron-down"
                size={13}
                color="#aaa"
                style={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>
        )}

        {/* price */}
        <TouchableOpacity
          style={[styles.chip, activePrice && styles.chipActiveOrange]}
          onPress={() => onOpenModal("price")}
        >
          <Text
            style={[
              styles.chipText,
              activePrice && { color: "#E8622A", fontWeight: "600" },
            ]}
          >
            {activePrice
              ? PRICE_LEVELS.find((p) => p.value === activePrice)?.label
              : "Cena"}
          </Text>
          {activePrice ? (
            <Ionicons
              name="close-circle"
              size={14}
              color="#E8622A"
              style={{ marginLeft: 4 }}
            />
          ) : (
            <Ionicons
              name="chevron-down"
              size={13}
              color="#aaa"
              style={{ marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>

        {/* district */}
        <TouchableOpacity
          style={[styles.chip, activeDistrict && styles.chipActiveOrange]}
          onPress={() => onOpenModal("district")}
        >
          <Text
            style={[
              styles.chipText,
              activeDistrict && { color: "#E8622A", fontWeight: "600" },
            ]}
          >
            {activeDistrict ?? "Warszawa"}
          </Text>
          {activeDistrict ? (
            <Ionicons
              name="close-circle"
              size={14}
              color="#E8622A"
              style={{ marginLeft: 4 }}
            />
          ) : (
            <Ionicons
              name="chevron-down"
              size={13}
              color="#aaa"
              style={{ marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>
      </ScrollView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  catScroll: { height: 76, flexGrow: 0 },
  catRow: { paddingHorizontal: 16, alignItems: "center", gap: 10, height: 76 },
  catCircle: {
    height: 46,
    minWidth: 46,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
  },
  catCircleActive: {
    flexDirection: "row",
    gap: 7,
    borderWidth: 0,
    paddingHorizontal: 18,
  },
  catActiveLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },

  filterScroll: { height: 56, flexGrow: 0 },
  filterRow: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    height: 56,
  },
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
  chipActiveOrange: { borderColor: "#E8622A", backgroundColor: "#FEF0EA" },
  chipText: { fontSize: 14, color: "#666", fontWeight: "500" },
});
