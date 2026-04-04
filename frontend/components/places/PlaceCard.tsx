import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
} from "react-native";
import { Place } from "@/api/places";
import { useFavourite } from "@/hooks/useFavourite";

const CATEGORY_COLORS: Record<string, string> = {
  Gastronomia: "#E8A87C",
  "Kawa i Słodycze": "#B8D4A8",
  "Kultura & Rozrywka": "#A8C4D4",
  "Natura & Rekreacja": "#C4D4A8",
};

const CATEGORY_INITIALS: Record<string, string> = {
  Gastronomia: "GA",
  "Kawa i Słodycze": "KS",
  "Kultura & Rozrywka": "KR",
  "Natura & Rekreacja": "NR",
};

const TAG_ICONS: Partial<Record<keyof Place, string>> = {
  serves_vegetarian: "🌿",
  outdoor_seating: "☀️",
  serves_coffee: "☕",
  live_music: "🎵",
  good_for_groups: "👥",
  reservable: "📅",
  takeout: "🛍️",
};

function getTags(place: Place): string[] {
  return (Object.entries(TAG_ICONS) as [keyof Place, string][])
    .filter(([key]) => place[key] === true)
    .map(([, icon]) => icon)
    .slice(0, 4);
}

type Props = {
  place: Place;
  onPress?: () => void;
};

export function PlaceCard({ place, onPress }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { isFav, loading, toggle } = useFavourite(place.id);
  const heartScale = useRef(new Animated.Value(1)).current;
  const tags = getTags(place);

  const bgColor = CATEGORY_COLORS[place.main_category ?? ""] ?? "#D4C4B8";
  const initials = CATEGORY_INITIALS[place.main_category ?? ""] ?? "WW";

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
    <TouchableOpacity
      style={[s.card, isDark && s.cardDark]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* kolorowe tło z inicjałami zamiast zdjęcia */}
      <View style={[s.imagePlaceholder, { backgroundColor: bgColor }]}>
        <Text style={s.initials}>{initials}</Text>
        {place.sub_category && (
          <View style={s.subBadge}>
            <Text style={s.subBadgeText}>{place.sub_category}</Text>
          </View>
        )}
        {/* serce na tle */}
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
      </View>

      {/* treść karty */}
      <View style={[s.body, isDark && s.bodyDark]}>
        <Text style={[s.name, isDark && s.nameDark]} numberOfLines={1}>
          {place.name}
        </Text>

        {place.address && (
          <Text style={s.address} numberOfLines={1}>
            {place.address}
          </Text>
        )}

        <View style={s.metaRow}>
          {place.rating != null && (
            <Text style={s.rating}>★ {place.rating.toFixed(1)}</Text>
          )}
          {place.user_rating_count != null && (
            <Text style={s.reviewCount}>({place.user_rating_count})</Text>
          )}
          {place.district && <Text style={s.district}>· {place.district}</Text>}
        </View>

        {tags.length > 0 && (
          <View style={s.tags}>
            {tags.map((icon, i) => (
              <View key={i} style={[s.tag, isDark && s.tagDark]}>
                <Text style={s.tagText}>{icon}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
    marginRight: 12,
  },
  cardDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  imagePlaceholder: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 26,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 2,
  },
  subBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  heart: { fontSize: 20 },
  body: {
    padding: 12,
    gap: 4,
    backgroundColor: "#fff",
  },
  bodyDark: { backgroundColor: "#1E1E1E" },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
  },
  nameDark: { color: "#F0F0F0" },
  address: { fontSize: 12, color: "#888" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rating: { fontSize: 12, color: "#F5A623", fontWeight: "600" },
  reviewCount: { fontSize: 11, color: "#bbb" },
  district: { fontSize: 11, color: "#aaa" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tagDark: { backgroundColor: "#2A2A2A" },
  tagText: { fontSize: 12 },
});
