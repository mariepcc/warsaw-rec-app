import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFavourite } from "@/hooks/useFavourite";
import type { Place } from "@/api/places";

const ACCENT = "#66a494";

const CATEGORY_DISPLAY: Record<string, string> = {
  Gastronomia: "Restauracje & Bary",
  "Kawa i Słodycze": "Kawiarnie & Desery",
  "Życie Nocne": "Nocne życie",
  "Kultura & Rozrywka": "Kultura",
  "Natura & Rekreacja": "Natura",
};
type SavedPlace = Place & {
  session_id?: string;
  saved_at?: string;
  is_favourite?: boolean;
};
export default function PlaceRow({
  place,
  onPress,
}: {
  place: SavedPlace;
  onPress: () => void;
}) {
  const { isFav, loading, toggle } = useFavourite(place.id);

  return (
    <TouchableOpacity style={row.card} onPress={onPress} activeOpacity={0.85}>
      <View style={row.left}>
        <View style={row.badgeRow}>
          {place.main_category && (
            <View style={row.badge}>
              <Text style={row.badgeText}>
                {CATEGORY_DISPLAY[place.main_category] ?? place.main_category}
              </Text>
            </View>
          )}
          {place.sub_category && (
            <Text style={row.subCategory}>· {place.sub_category}</Text>
          )}
        </View>
        <Text style={row.name} numberOfLines={1}>
          {place.name}
        </Text>
        {place.address && (
          <Text style={row.address} numberOfLines={1}>
            📍 {place.address}
          </Text>
        )}
        <View style={row.metaRow}>
          {place.rating != null && (
            <Text style={row.rating}>★ {place.rating.toFixed(1)}</Text>
          )}
          {place.user_rating_count != null && (
            <Text style={row.reviewCount}>({place.user_rating_count})</Text>
          )}
          {place.price_level && (
            <Text style={row.price}>{place.price_level}</Text>
          )}
        </View>
      </View>
      <View style={row.right}>
        {!loading && (
          <TouchableOpacity
            onPress={toggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={row.heart}>{isFav ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        )}
        <Text style={row.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    gap: 10,
  },
  left: { flex: 1, gap: 4 },
  right: { alignItems: "center", gap: 8, paddingLeft: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    backgroundColor: ACCENT + "18",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: ACCENT, fontWeight: "600" },
  subCategory: { fontSize: 11, color: "#aaa" },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  address: { fontSize: 12, color: "#888" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  rating: { fontSize: 12, color: "#F5A623", fontWeight: "600" },
  reviewCount: { fontSize: 11, color: "#bbb" },
  price: { fontSize: 12, color: "#888" },
  heart: { fontSize: 20 },
  chevron: { fontSize: 20, color: "#CCC", fontWeight: "300" },
});
