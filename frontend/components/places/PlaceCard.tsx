import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Animated,
} from "react-native";
import { Place } from "@/api/places";
import { useFavourite } from "@/hooks/useFavourite";

const ACCENT = "#66a494";

const TAG_ICONS: Partial<Record<keyof Place, string>> = {
  serves_vegetarian: "🌿",
  outdoor_seating: "☀️",
  serves_coffee: "☕",
  serves_breakfast: "🍳",
  serves_lunch: "🥗",
  serves_dinner: "🍽️",
  live_music: "🎵",
  good_for_groups: "👥",
  reservable: "📅",
  dine_in: "🪑",
  takeout: "🛍️",
};

function getTags(place: Place): string[] {
  return (Object.entries(TAG_ICONS) as [keyof Place, string][])
    .filter(([key]) => place[key] === true)
    .map(([, icon]) => icon)
    .slice(0, 4);
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={s.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={s.star}>
          {i < full ? "★" : i === full && half ? "½" : "☆"}
        </Text>
      ))}
      <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

type Props = {
  place: Place;
  onPress?: () => void;
};

export function PlaceCard({ place, onPress }: Props) {
  const { isFav, loading, toggle } = useFavourite(place.name);
  const heartScale = useRef(new Animated.Value(1)).current;
  const tags = getTags(place);

  function handleHeart() {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
      }),
    ]).start();
    toggle();
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {place.main_category && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{place.main_category}</Text>
        </View>
      )}

      {!loading && (
        <TouchableOpacity
          style={s.heartBtn}
          onPress={handleHeart}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Animated.Text
            style={[s.heart, { transform: [{ scale: heartScale }] }]}
          >
            {isFav ? "❤️" : "🤍"}
          </Animated.Text>
        </TouchableOpacity>
      )}

      <Text style={s.name} numberOfLines={2}>
        {place.name}
      </Text>

      {place.address && (
        <Text style={s.address} numberOfLines={1}>
          📍 {place.address}
        </Text>
      )}

      <View style={s.row}>
        <StarRating rating={place.rating} />
        {place.user_rating_count != null && (
          <Text style={s.reviewCount}>({place.user_rating_count})</Text>
        )}
      </View>

      {place.price_level && <Text style={s.price}>{place.price_level}</Text>}

      {tags.length > 0 && (
        <View style={s.tags}>
          {tags.map((icon, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>{icon}</Text>
            </View>
          ))}
        </View>
      )}

      {place.google_maps_direct_link && (
        <TouchableOpacity
          style={s.mapsBtn}
          onPress={() => Linking.openURL(place.google_maps_direct_link!)}
        >
          <Text style={s.mapsBtnText}>Otwórz w Maps →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: ACCENT + "22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "600",
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  heart: {
    fontSize: 22,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    lineHeight: 20,
    paddingRight: 28,
  },
  address: {
    fontSize: 12,
    color: "#888",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  star: {
    fontSize: 12,
    color: "#F5A623",
  },
  ratingNum: {
    fontSize: 12,
    color: "#555",
    marginLeft: 3,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 11,
    color: "#aaa",
  },
  price: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 13,
  },
  mapsBtn: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  mapsBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
