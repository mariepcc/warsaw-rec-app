import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFavourite } from "@/hooks/useFavourite";
import { Place } from "@/api/places";

const ACCENT = "#66a494";

const FEATURE_LABELS: { key: keyof Place; label: string; icon: string }[] = [
  { key: "serves_vegetarian", label: "Opcje wegetariańskie", icon: "🌿" },
  { key: "serves_coffee", label: "Kawa", icon: "☕" },
  { key: "serves_breakfast", label: "Śniadania", icon: "🍳" },
  { key: "serves_lunch", label: "Obiady", icon: "🥗" },
  { key: "serves_dinner", label: "Kolacje", icon: "🍽️" },
  { key: "serves_dessert", label: "Desery", icon: "🍰" },
  { key: "serves_beer", label: "Piwo", icon: "🍺" },
  { key: "serves_wine", label: "Wino", icon: "🍷" },
  { key: "serves_cocktails", label: "Koktajle", icon: "🍹" },
  { key: "outdoor_seating", label: "Ogródek", icon: "☀️" },
  { key: "live_music", label: "Muzyka na żywo", icon: "🎵" },
  { key: "good_for_groups", label: "Dla grup", icon: "👥" },
  { key: "menu_for_children", label: "Menu dla dzieci", icon: "👶" },
  { key: "reservable", label: "Rezerwacja stolika", icon: "📅" },
  { key: "dine_in", label: "Na miejscu", icon: "🪑" },
  { key: "takeout", label: "Na wynos", icon: "🛍️" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={s.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        const full = i < Math.floor(rating);
        const half = !full && i < Math.ceil(rating) && rating % 1 >= 0.5;
        return (
          <Text key={i} style={s.star}>
            {full ? "★" : half ? "½" : "☆"}
          </Text>
        );
      })}
      <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useLocalSearchParams<{ place: string; data: string }>();
  console.log("PlaceDetailScreen params:", { data });

  const place: Place | null = React.useMemo(() => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }, [data]);

  const { isFav, loading: favLoading, toggle } = useFavourite(place?.id ?? "");

  if (!place) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>Nie znaleziono miejsca.</Text>
      </View>
    );
  }

  const activeFeatures = FEATURE_LABELS.filter(
    ({ key }) => (place as Record<string, unknown>)[key] === true,
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* nagłówek */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {place.name}
        </Text>
        {!favLoading && (
          <TouchableOpacity
            onPress={toggle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.heartIcon}>{isFav ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* hero karta */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            {/* kategoria + sub */}
            <View style={s.badgeRow}>
              {place.main_category && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{place.main_category}</Text>
                </View>
              )}
              {place.sub_category && (
                <Text style={s.subCategoryText}>· {place.sub_category}</Text>
              )}
            </View>
            <Text style={s.placeName}>{place.name}</Text>
            {place.address && (
              <Text style={s.placeAddress}>📍 {place.address}</Text>
            )}
            {place.district && (
              <Text style={s.placeDistrict}>{place.district}</Text>
            )}
          </View>

          {/* ocena + cena */}
          <View style={s.ratingRow}>
            {place.rating != null && <StarRating rating={place.rating} />}
            {place.user_rating_count != null && (
              <Text style={s.reviewCount}>
                {place.user_rating_count} opinii
              </Text>
            )}
            {place.price_level && (
              <View style={s.priceBadge}>
                <Text style={s.priceBadgeText}>{place.price_level}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Informacje</Text>
          <View style={s.infoCard}>
            {place.opening_hours && (
              <InfoRow
                icon="🕐"
                label="Godziny otwarcia"
                value={place.opening_hours}
              />
            )}
            {place.price_range_start != null &&
              place.price_range_end != null && (
                <InfoRow
                  icon="💳"
                  label="Przedział cenowy"
                  value={`${place.price_range_start} – ${place.price_range_end} zł`}
                />
              )}
            {place.district && (
              <InfoRow icon="📌" label="Dzielnica" value={place.district} />
            )}
          </View>
        </View>

        {activeFeatures.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Co oferuje</Text>
            <View style={s.featuresGrid}>
              {activeFeatures.map(({ key, label, icon }) => (
                <View key={key as string} style={s.featureChip}>
                  <Text style={s.featureIcon}>{icon}</Text>
                  <Text style={s.featureLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.actionsSection}>
          {place.google_maps_direct_link && (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => Linking.openURL(place.google_maps_direct_link!)}
            >
              <Text style={s.primaryBtnText}>Otwórz w Google Maps</Text>
            </TouchableOpacity>
          )}
          {place.menu_url && (
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => Linking.openURL(place.menu_url!)}
            >
              <Text style={s.secondaryBtnText}>Zobacz menu</Text>
            </TouchableOpacity>
          )}
          {place.maps_url && !place.google_maps_direct_link && (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => Linking.openURL(place.maps_url!)}
            >
              <Text style={s.primaryBtnText}>Otwórz w Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 15, color: "#888" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#EBEBEB",
    gap: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 20, color: "#111" },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    letterSpacing: -0.2,
  },
  heartIcon: { fontSize: 22 },

  scroll: { padding: 16, gap: 16 },

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    gap: 12,
  },
  heroTop: { gap: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    backgroundColor: ACCENT + "20",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: ACCENT, fontWeight: "600" },
  subCategoryText: { fontSize: 12, color: "#999" },
  placeName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.3,
  },
  placeAddress: { fontSize: 14, color: "#666" },
  placeDistrict: { fontSize: 13, color: "#aaa" },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { fontSize: 16, color: "#F5A623" },
  ratingNum: { fontSize: 14, fontWeight: "600", color: "#555", marginLeft: 4 },
  reviewCount: { fontSize: 13, color: "#aaa" },
  priceBadge: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceBadgeText: { fontSize: 13, color: "#555", fontWeight: "600" },

  section: { gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    paddingHorizontal: 2,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, color: "#999" },
  infoValue: { fontSize: 14, color: "#111", fontWeight: "500" },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureIcon: { fontSize: 14 },
  featureLabel: { fontSize: 13, color: "#333" },

  actionsSection: { gap: 10, paddingTop: 4 },
  primaryBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#DDD",
  },
  secondaryBtnText: { color: "#111", fontSize: 15, fontWeight: "500" },
});
