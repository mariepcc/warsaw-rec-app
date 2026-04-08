import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaceStore } from "@/store/places/placesStore";
import { router, useRouter } from "expo-router";
import { getSavedPlaces } from "@/api/places";
import type { Place } from "@/api/places";
import PlaceRow from "@/components/places/PlaceRow";

const ACCENT = "#66a494";
const PURPLE = "#7C6FCD";

const CATEGORY_DISPLAY: Record<string, string> = {
  Gastronomia: "Restauracje & Bary",
  "Kawa i Słodycze": "Kawiarnie & Desery",
  "Życie Nocne": "Nocne życie",
  "Kultura & Rozrywka": "Kultura",
  "Natura & Rekreacja": "Natura",
};

const CATEGORY_FILTERS = [
  { label: "Wszystkie", value: null },
  ...Object.entries(CATEGORY_DISPLAY).map(([value, label]) => ({
    label,
    value,
  })),
];

type Section = { title: string; sessionId: string; data: Place[] };

function groupBySessions(places: Place[]): Section[] {
  const map = new Map<string, Place[]>();
  places.forEach((p) => {
    const key = p.session_id ?? "bez-sesji";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  });
  return Array.from(map.entries()).map(([sessionId, data], i) => ({
    title: sessionId === "bez-sesji" ? "Bez sesji" : `Sesja ${i + 1}`,
    sessionId,
    data,
  }));
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchPlaces = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getSavedPlaces();
      setPlaces(data);
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

  const filtered = activeFilter
    ? places.filter((p) => p.main_category === activeFilter)
    : places;

  const sections = groupBySessions(filtered);

  function navigateToDetail(place: Place) {
    usePlaceStore.getState().setSelectedPlace(place);
    router.push({
      pathname: "/(tabs)/saved/[name]",
      params: { name: place.name },
    });
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Zapisane</Text>
        <Text style={s.headerSub}>
          {places.length}{" "}
          {places.length === 1
            ? "miejsce"
            : places.length < 5
              ? "miejsca"
              : "miejsc"}
        </Text>
      </View>

      <FlatList
        horizontal
        data={CATEGORY_FILTERS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
        renderItem={({ item }) => {
          const active = activeFilter === item.value;
          return (
            <TouchableOpacity
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text style={[s.filterText, active && s.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : places.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🤍</Text>
          <Text style={s.emptyTitle}>Brak zapisanych miejsc</Text>
          <Text style={s.emptySubtitle}>
            Miejsca polecone przez asystenta pojawią się tutaj automatycznie.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.name}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPlaces(true);
              }}
              tintColor={ACCENT}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <Text style={s.sectionCount}>
                {section.data.length}{" "}
                {section.data.length === 1
                  ? "miejsce"
                  : section.data.length < 5
                    ? "miejsca"
                    : "miejsc"}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={s.rowWrap}>
              <PlaceRow place={item} onPress={() => navigateToDetail(item)} />
            </View>
          )}
          contentContainerStyle={[
            s.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Brak miejsc w tej kategorii</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EBEBEB",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: "#999", marginTop: 1 },
  filters: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 4,
  },
  filterChipActive: { backgroundColor: PURPLE },
  filterText: { fontSize: 13, color: "#555", fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCount: { fontSize: 12, color: "#bbb" },
  rowWrap: { paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingTop: 4 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
  },
});
