import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavourite } from "@/hooks/useFavourite";
import type { Place } from "@/api/places";

const CATEGORY_THEMES: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  Gastronomia: {
    icon: "restaurant",
    color: "#E8622A",
    bg: "#FEF0EA",
    label: "Jedzenie",
  },
  "Kawa i Słodycze": {
    icon: "cafe",
    color: "#7C5CBF",
    bg: "#F2EEFB",
    label: "Kawa & Desery",
  },
  "Kultura & Rozrywka": {
    icon: "color-palette",
    color: "#2A8BE8",
    bg: "#EAF2FE",
    label: "Kultura",
  },
  "Życie Nocne": {
    icon: "moon",
    color: "#3D3D5C",
    bg: "#EEEEF5",
    label: "Nocne życie",
  },
  "Natura & Rekreacja": {
    icon: "leaf",
    color: "#2A9E6A",
    bg: "#EAF7F2",
    label: "Natura",
  },
};

const PRICE_DISPLAY: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_LUXURY: "$$$$",
};

export default function PlaceRow({
  place,
  onPress,
}: {
  place: Place;
  onPress: () => void;
}) {
  const { isFav, loading, toggle } = useFavourite(place);

  const theme = CATEGORY_THEMES[place.main_category || ""] || {
    icon: "location",
    color: "#888",
    bg: "#F5F5F5",
    label: place.main_category,
  };

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={[s.imageContainer, { backgroundColor: theme.bg }]}>
        <Ionicons name={theme.icon} size={32} color={theme.color} />

        {!loading && (
          <TouchableOpacity style={s.heartBadge} onPress={toggle}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={16}
              color={isFav ? "#E8622A" : "#888"}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {place.name}
        </Text>

        <View style={s.metaRow}>
          {place.rating != null && (
            <View style={s.ratingBox}>
              <Ionicons name="star" size={12} color="#F5A623" />
              <Text style={s.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={s.price}>
            {place.price_level ? (
              <Text style={s.price}>{PRICE_DISPLAY[place.price_level]}</Text>
            ) : null}
          </Text>
          <Text style={s.dot}>•</Text>
          <Text style={s.district}>{place.district || "Warszawa"}</Text>
        </View>

        <View style={s.categoryRow}>
          <View style={[s.badge, { backgroundColor: theme.bg }]}>
            <Text style={[s.badgeText, { color: theme.color }]}>
              {theme.label}
            </Text>
          </View>
          {place.sub_category && (
            <Text style={s.subCategory} numberOfLines={1}>
              • {place.sub_category}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#DDD" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  imageContainer: {
    width: 75,
    height: 75,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heartBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  info: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  price: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  dot: { color: "#CCC" },
  district: {
    fontSize: 12,
    color: "#888",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  subCategory: {
    fontSize: 11,
    color: "#AAA",
    flex: 1,
  },
});
