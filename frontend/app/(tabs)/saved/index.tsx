import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaceStore } from "@/store/places/placesStore";
import { useRouter } from "expo-router";
import { getFavouritePlaces } from "@/api/places";
import type { Place } from "@/api/places";
import PlaceRow from "@/components/saved/PlaceRow";
import {
  CATEGORIES,
  SUB_BY_CATEGORY,
  DISTRICTS,
  PRICE_LEVELS,
} from "@/constants/placesFilters";
import { CategoryFilter } from "@/components/saved/CategoryFilter";
import { FilterBar } from "@/components/saved/FilterBar";
import { FilterModal } from "@/components/saved/FilterModal";

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
      const data = await getFavouritePlaces();
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

  const filtered = places.filter((p) => {
    if (activeCategory && p.main_category !== activeCategory) return false;
    if (activeSub && p.sub_category !== activeSub) return false;
    if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase()))
      return false;
    if (activePrice && p.price_level !== activePrice) return false;
    if (activeDistrict && p.district !== activeDistrict) return false;
    return true;
  });

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory);
  const HEADER_H = insets.top + 52 + 76 + 56;

  const getModalItems = () => {
    if (subModal === "sub")
      return activeCategory ? SUB_BY_CATEGORY[activeCategory] : [];
    if (subModal === "price") return PRICE_LEVELS;
    return DISTRICTS;
  };

  const getActiveModalValue = () => {
    if (subModal === "sub") return activeSub;
    if (subModal === "price") return activePrice;
    return activeDistrict;
  };

  const handleModalSelect = (value: string | null) => {
    if (subModal === "sub") setActiveSub(value);
    else if (subModal === "price") setActivePrice(value);
    else setActiveDistrict(value);
  };

  function navigateToDetail(place: Place) {
    usePlaceStore.getState().setSelectedPlace(place, "saved");
    router.push({
      pathname: "/(tabs)/saved/[name]",
      params: { name: place.name },
    });
  }

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

        <CategoryFilter
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelect={(key) => {
            if (activeCategory === key) {
              setActiveCategory(null);
              setActiveSub(null);
            } else {
              setActiveCategory(key);
              setActiveSub(null);
            }
          }}
          onClearCategory={() => {
            setActiveCategory(null);
            setActiveSub(null);
          }}
        />

        <FilterBar
          searchText={searchText}
          onSearchChange={setSearchText}
          activeCategory={activeCategory}
          activeSub={activeSub}
          activePrice={activePrice}
          activeDistrict={activeDistrict}
          activeCategoryColor={activeCat?.color}
          onOpenSub={() => setSubModal("sub")}
          onOpenPrice={() => setSubModal("price")}
          onOpenDistrict={() => setSubModal("district")}
        />
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

      <FilterModal
        visible={subModal !== null}
        type={subModal}
        items={getModalItems()}
        activeValue={getActiveModalValue()}
        onSelect={handleModalSelect}
        onClose={() => setSubModal(null)}
      />
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
});
