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

type Props = {
  activeFilter: MapFilterKey;
  onFilterChange: (key: MapFilterKey) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
};

export default function MapFilterBar({
  activeFilter,
  onFilterChange,
  searchText,
  onSearchChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const HEADER_H = insets.top + 62 + 76;

  const activeMeta = MAP_FILTERS.find((f) => f.key === activeFilter);

  return (
    <BlurView
      intensity={75}
      tint="light"
      style={[styles.container, { height: HEADER_H, paddingTop: insets.top }]}
    >
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
              style={styles.catBtnOuter}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
        bounces={false}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj na mapie..."
            placeholderTextColor="#bbb"
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>
        {activeMeta && (
          <View
            style={[
              styles.activeChip,
              {
                borderColor: activeMeta.color,
                backgroundColor: activeMeta.lightColor,
              },
            ]}
          >
            <Ionicons
              name={activeMeta.icon}
              size={13}
              color={activeMeta.color}
            />
            <Text style={[styles.activeChipText, { color: activeMeta.color }]}>
              {activeMeta.label}
            </Text>
          </View>
        )}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 52,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.4,
  },

  catScroll: { height: 76, flexGrow: 0 },
  catRow: { paddingHorizontal: 16, alignItems: "center", gap: 10, height: 76 },
  catBtnOuter: {},
  catCircle: {
    height: 46,
    minWidth: 46,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
  },
  catCircleActive: {
    flexDirection: "row",
    gap: 7,
    borderWidth: 0,
    paddingHorizontal: 18,
  },
  catActiveLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },

  filterScroll: { height: 52, flexGrow: 0 },
  filterRow: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    height: 52,
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
    minWidth: 160,
  },
  searchInput: { fontSize: 14, color: "#1a1a1a", padding: 0, minWidth: 120 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 22,
    borderWidth: 1,
  },
  activeChipText: { fontSize: 13, fontWeight: "600" },
});
