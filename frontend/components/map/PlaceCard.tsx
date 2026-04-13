import { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/components/map/FilterBar";
import { usePlaceStore } from "@/store/placesStore";
import { useFavourite } from "@/hooks/useFavourite";
import type { Place } from "@/api/places";

const { width: SCREEN_W } = Dimensions.get("window");
export const CARD_W = SCREEN_W * 0.78;
export const CARD_GAP = 12;
export const CARD_H = 185;

type PlaceWithCoords = Place & { lat: number; lon: number };

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_LUXURY: "$$$$",
};

type Props = {
  place: PlaceWithCoords;
};

export const PlaceCard = memo(({ place }: Props) => {
  const router = useRouter();
  const { isFav, toggle } = useFavourite(place);

  const grad = CATEGORY_GRADIENTS[place.main_category ?? ""] ?? [
    "#F5934A",
    "#E8622A",
  ];
  const icon = CATEGORY_ICONS[place.main_category ?? ""] ?? "location-outline";
  const color = CATEGORY_COLORS[place.main_category ?? ""] ?? "#E8622A";
  const pl = PRICE_MAP[place.price_level ?? ""] ?? null;

  const handlePress = useCallback(() => {
    usePlaceStore.getState().setSelectedPlace(place, "map");
    router.push({
      pathname: "/(tabs)/place/[name]",
      params: { name: encodeURIComponent(place.name) },
    } as any);
  }, [place, router]);

  const handleNavigate = useCallback(() => {
    if (place.maps_url) Linking.openURL(place.maps_url);
    else if (place.maps_url) Linking.openURL(place.maps_url);
  }, [place.google_maps_direct_link, place.maps_url]);

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={handlePress} style={s.wrap}>
      <View style={s.header}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.iconBox}
        >
          <Ionicons name={icon} size={15} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>
              {place.name}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggle();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={22}
                color={isFav ? "#E8622A" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
          <View style={s.metaRow}>
            {place.sub_category && (
              <Text style={s.sub}>{place.sub_category}</Text>
            )}
            <View style={s.dot} />
            {place.rating != null && (
              <View style={s.ratingBox}>
                <Ionicons name="star" size={10} color="#F5A623" />
                <Text style={s.rating}>{Number(place.rating).toFixed(1)}</Text>
              </View>
            )}
            {pl && (
              <>
                <View style={s.dot} />
                <Text style={[s.price, { color }]}>{pl}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={s.body}>
        {place.address && (
          <Text style={s.address} numberOfLines={1}>
            {place.address.replace(", Warszawa", "")}
          </Text>
        )}
        {place.district && <Text style={s.district}>{place.district}</Text>}
      </View>

      <TouchableOpacity
        style={s.navBtn}
        onPress={(e) => {
          e.stopPropagation();
          handleNavigate();
        }}
      >
        <Ionicons name="navigate-outline" size={14} color="#555" />
        <Text style={s.navText}>Nawiguj</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const s = StyleSheet.create({
  wrap: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginRight: CARD_GAP,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  sub: { fontSize: 12, color: "#888" },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#ddd",
    marginHorizontal: 6,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rating: { fontSize: 12, fontWeight: "700", color: "#F5A623" },
  price: { fontSize: 12, fontWeight: "600" },
  body: {
    marginVertical: 2,
  },
  address: { fontSize: 12, color: "#999" },
  district: { fontSize: 11, color: "#ccc", marginTop: 1 },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  navText: { color: "#444", fontSize: 13, fontWeight: "600" },
});
