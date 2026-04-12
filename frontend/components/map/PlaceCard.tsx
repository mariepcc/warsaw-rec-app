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
export const CARD_H = 195;

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
    usePlaceStore.getState().setSelectedPlace(place, "saved");
    router.push({
      pathname: "/(tabs)/saved/[name]",
      params: { name: encodeURIComponent(place.name) },
    } as any);
  }, [place, router]);

  const handleNavigate = useCallback(() => {
    if (place.google_maps_direct_link)
      Linking.openURL(place.google_maps_direct_link);
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
          <Text style={s.name} numberOfLines={2}>
            {place.name}
          </Text>
          {place.sub_category && (
            <Text style={s.sub}>{place.sub_category}</Text>
          )}
        </View>
        <View style={s.topRight}>
          {place.rating != null && (
            <View style={s.ratingBox}>
              <Ionicons name="star" size={11} color="#F5A623" />
              <Text style={s.rating}>{Number(place.rating).toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggle();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={20}
              color={isFav ? "#E8622A" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </View>
      {place.address && (
        <Text style={s.address} numberOfLines={1}>
          {place.address}
        </Text>
      )}
      <View style={s.footer}>
        {place.district && <Text style={s.district}>{place.district}</Text>}
        {pl && <Text style={[s.price, { color }]}>{pl}</Text>}
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
    padding: 16,
    marginRight: CARD_GAP,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", lineHeight: 20 },
  sub: { fontSize: 12, color: "#aaa", marginTop: 2 },
  topRight: { alignItems: "flex-end", gap: 4 },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF9EC",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rating: { fontSize: 12, fontWeight: "700", color: "#F5A623" },
  address: { fontSize: 12, color: "#888", marginBottom: 6 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  district: { fontSize: 12, color: "#bbb" },
  price: { fontSize: 13, fontWeight: "700" },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  navText: { color: "#444", fontSize: 14, fontWeight: "600" },
});
