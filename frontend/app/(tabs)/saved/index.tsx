import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaceStore } from "@/store/places/placesStore";
import { useRouter } from "expo-router";
import { getSavedPlaces } from "@/api/places";
import type { Place } from "@/api/places";
import PlaceRow from "@/components/places/PlaceRow";

const SUB_BY_CATEGORY: Record<string, string[]> = {
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
};

type Category = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const CATEGORIES: Category[] = [
  {
    key: "Gastronomia",
    label: "Jedzenie",
    icon: "restaurant-outline",
    color: "#E8622A",
  },
  {
    key: "Kawa i Słodycze",
    label: "Kawa",
    icon: "cafe-outline",
    color: "#7C5CBF",
  },
  {
    key: "Kultura & Rozrywka",
    label: "Kultura",
    icon: "color-palette-outline",
    color: "#2A8BE8",
  },
  {
    key: "Życie Nocne",
    label: "Nocne",
    icon: "musical-notes-outline",
    color: "#3D3D5C",
  },
  {
    key: "Natura & Rekreacja",
    label: "Natura",
    icon: "leaf-outline",
    color: "#2A9E6A",
  },
];

const PRICE_LEVELS = [
  { label: "$", value: "PRICE_LEVEL_INEXPENSIVE" },
  { label: "$$", value: "PRICE_LEVEL_MODERATE" },
  { label: "$$$", value: "PRICE_LEVEL_EXPENSIVE" },
  { label: "$$$$", value: "PRICE_LEVEL_LUXURY" },
];
const DISTRICTS = [
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

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<"sub" | "price" | "district" | null>(
    null,
  );

  const fetchPlaces = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getSavedPlaces();
      setPlaces(data.filter((p: Place) => p.is_favourite));
    } catch (err) {
      console.log("fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
    }, [fetchPlaces]),
  );

  const filtered = places.filter((p) => {
    if (activeCategory && p.main_category !== activeCategory) return false;
    if (activeSub && p.sub_category !== activeSub) return false;
    if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase()))
      return false;
    if (activePrice && p.price_level !== activePrice) return false;
    if (activeDistrict && p.district !== activeDistrict) return false;
    return true;
  });

  const getModalItems = () => {
    if (subModal === "sub") {
      return activeCategory ? SUB_BY_CATEGORY[activeCategory] : [];
    }
    if (subModal === "price") return PRICE_LEVELS;
    return DISTRICTS;
  };

  function toggleCategory(key: string) {
    if (activeCategory === key) {
      setActiveCategory(null);
      setActiveSub(null);
    } else {
      setActiveCategory(key);
      setActiveSub(null);
    }
  }

  function navigateToDetail(place: Place) {
    usePlaceStore.getState().setSelectedPlace(place, "saved");
    router.push({
      pathname: "/(tabs)/saved/[name]",
      params: { name: place.name },
    });
  }

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory);
  const HEADER_H = insets.top + 52 + 76 + 56;

  return (
    <View style={s.container}>
      <BlurView
        intensity={70}
        tint="light"
        style={[s.header, { height: HEADER_H, paddingTop: insets.top }]}
      >
        <View style={s.titleRow}>
          <Text style={s.title}>Ulubione miejsca</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{filtered.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catScroll}
          contentContainerStyle={s.catRow}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
        >
          <TouchableOpacity
            style={[s.catCircle, !activeCategory && s.catAllActive]}
            onPress={() => {
              setActiveCategory(null);
              setActiveSub(null);
            }}
          >
            <Ionicons
              name="star"
              size={21}
              color={!activeCategory ? "#fff" : "#aaa"}
            />
            {!activeCategory && <Text style={s.catActiveLabel}>All</Text>}
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  s.catCircle,
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
                onPress={() => toggleCategory(cat.key)}
              >
                <Ionicons
                  name={cat.icon}
                  size={21}
                  color={active ? "#fff" : "#929292"}
                />
                {active && <Text style={s.catActiveLabel}>{cat.label}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={s.filterRow}
        >
          <View style={s.searchBox}>
            <Ionicons name="search-outline" size={15} color="#aaa" />
            <TextInput
              style={s.searchInput}
              placeholder="Szukaj..."
              placeholderTextColor="#bbb"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {activeCategory && (
            <TouchableOpacity
              style={[
                s.chip,
                activeSub && {
                  borderColor: activeCat?.color,
                  backgroundColor: "#bbb",
                },
              ]}
              onPress={() => setSubModal("sub")}
            >
              <Text
                style={[
                  s.chipText,
                  activeSub && { color: activeCat?.color, fontWeight: "600" },
                ]}
              >
                {activeSub ?? "Podkategoria"}
              </Text>
              {activeSub ? (
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={activeCat?.color}
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

          <TouchableOpacity
            style={[s.chip, activePrice && s.chipActiveOrange]}
            onPress={() => setSubModal("price")}
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

          <TouchableOpacity
            style={[s.chip, activeDistrict && s.chipActiveOrange]}
            onPress={() => setSubModal("district")}
          >
            <Text
              style={[
                s.chipText,
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

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#E8622A" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={[s.empty, { paddingTop: HEADER_H + 60 }]}>
          <Ionicons name="heart-outline" size={52} color="#ddd" />
          <Text style={s.emptyTitle}>
            {places.length === 0 ? "Brak ulubionych" : "Brak wyników"}
          </Text>
          <Text style={s.emptySubtitle}>
            {places.length === 0
              ? "Dodaj miejsca do ulubionych podczas rozmowy z asystentem."
              : "Spróbuj zmienić filtry."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{
            paddingTop: HEADER_H + 8,
            paddingBottom: insets.bottom + 80,
            paddingHorizontal: 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPlaces(true);
              }}
              tintColor="#E8622A"
              progressViewOffset={HEADER_H}
            />
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 10 }}>
              <PlaceRow place={item} onPress={() => navigateToDetail(item)} />
            </View>
          )}
        />
      )}

      <Modal
        visible={subModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSubModal(null)}
      >
        <Pressable style={s.overlay} onPress={() => setSubModal(null)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>
              {subModal === "sub"
                ? "Podkategoria"
                : subModal === "price"
                  ? "Poziom cen"
                  : "Dzielnica"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {getModalItems().map((item) => {
                const isPrice =
                  typeof item === "object" && item !== null && "value" in item;

                const label = isPrice ? item.label : item;
                const value = isPrice ? item.value : item;

                const isActive =
                  subModal === "sub"
                    ? activeSub === value
                    : subModal === "price"
                      ? activePrice === value
                      : activeDistrict === value;

                return (
                  <TouchableOpacity
                    key={value}
                    style={s.sheetRow}
                    onPress={() => {
                      if (subModal === "sub")
                        setActiveSub(isActive ? null : value);
                      else if (subModal === "price")
                        setActivePrice(isActive ? null : value);
                      else setActiveDistrict(isActive ? null : value);
                      setSubModal(null);
                    }}
                  >
                    <Text
                      style={[
                        s.sheetRowText,
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
                if (subModal === "sub") setActiveSub(null);
                else if (subModal === "price") setActivePrice(null);
                else setActiveDistrict(null);
                setSubModal(null);
              }}
            >
              <Text style={s.clearBtnText}>Wyczyść</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
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
  badge: {
    backgroundColor: "#E8622A",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  catScroll: { height: 76, flexGrow: 0 },
  catRow: { paddingHorizontal: 16, alignItems: "center", gap: 10, height: 76 },
  catCircle: {
    width: 46,
    height: 46,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#929292",
    backgroundColor: "#f2f2f2",
  },
  catAllActive: {
    backgroundColor: "#E8622A",
    borderColor: "#E8622A",
    flexDirection: "row",
    width: undefined,
    paddingHorizontal: 18,
    gap: 8,
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

  empty: { alignItems: "center", paddingHorizontal: 40, gap: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 21,
  },

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
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  sheetRowText: { fontSize: 15, color: "#333" },
  clearBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  clearBtnText: { fontSize: 15, color: "#999", fontWeight: "600" },
});
