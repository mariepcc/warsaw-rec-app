import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
} from "react-native";
import { Stack, useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { usePlaceStore } from "@/store/places/placesStore";
import { useFavourite } from "@/hooks/useFavourite";
import { Place } from "@/api/places";

const FEATURE_ICONS: Partial<
  Record<keyof Place, keyof typeof Ionicons.glyphMap>
> = {
  serves_vegetarian: "leaf-outline",
  serves_coffee: "cafe-outline",
  serves_breakfast: "egg-outline",
  serves_lunch: "restaurant-outline",
  serves_dinner: "fast-food-outline",
  serves_dessert: "ice-cream-outline",
  serves_beer: "beer-outline",
  serves_wine: "wine-outline",
  serves_cocktails: "wine-outline",
  outdoor_seating: "sunny-outline",
  live_music: "musical-notes-outline",
  good_for_groups: "people-outline",
  menu_for_children: "happy-outline",
  reservable: "calendar-outline",
  dine_in: "walk-outline",
  takeout: "bag-handle-outline",
};

const DAY_LABELS = {
  poniedziałek: "Pn",
  wtorek: "Wt",
  środa: "Śr",
  czwartek: "Cz",
  piątek: "Pt",
  sobota: "So",
  niedziela: "Nd",
};

const FEATURE_LABELS = [
  { key: "serves_vegetarian", label: "Opcje wegetariańskie" },
  { key: "serves_coffee", label: "Kawa" },
  { key: "serves_breakfast", label: "Śniadania" },
  { key: "serves_lunch", label: "Obiady" },
  { key: "serves_dinner", label: "Kolacje" },
  { key: "serves_dessert", label: "Desery" },
  { key: "serves_beer", label: "Piwo" },
  { key: "serves_wine", label: "Wino" },
  { key: "serves_cocktails", label: "Koktajle" },
  { key: "outdoor_seating", label: "Ogródek" },
  { key: "live_music", label: "Muzyka na żywo" },
  { key: "good_for_groups", label: "Dla grup" },
  { key: "menu_for_children", label: "Menu dla dzieci" },
  { key: "reservable", label: "Rezerwacja stolika" },
  { key: "dine_in", label: "Na miejscu" },
  { key: "takeout", label: "Na wynos" },
];

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const place = usePlaceStore((state) => state.selectedPlace);
  const source = usePlaceStore((state) => state.source);
  const { isFav, loading: favLoading, toggle } = useFavourite(place?.id ?? "");

  const [hoursVisible, setHoursVisible] = useState(false);

  if (!place) {
    return (
      <View style={[s.container, s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>Nie znaleziono miejsca.</Text>
      </View>
    );
  }

  const activeFeatures = (Object.keys(FEATURE_ICONS) as (keyof Place)[]).filter(
    (key) => (place as Record<string, unknown>)[key] === true,
  );

  function formatOpeningHours(jsonString: string) {
    try {
      const hoursData = JSON.parse(jsonString);
      const days = Object.keys(hoursData);
      const currentDay =
        days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

      return days.map((day) => {
        const isToday = day === currentDay;
        const timeRanges = hoursData[day];
        const formattedTime =
          timeRanges
            .map((range: [string, string]) => range.join(" – "))
            .join(", ") || "Zamknięte";

        return (
          <View key={day} style={[s.hourRow, isToday && s.hourRowToday]}>
            <Text style={[s.hourDay, isToday && s.hourDayToday]}>
              {DAY_LABELS[day as keyof typeof DAY_LABELS]}
            </Text>
            <Text style={[s.hourTime, isToday && s.hourTimeToday]}>
              {formattedTime}
            </Text>
          </View>
        );
      });
    } catch (e) {
      return (
        <Text style={s.metaValue}>Niepoprawny format godzin otwarcia</Text>
      );
    }
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={["#FFFFFF", "#e2e2ec"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => {
            if (source === "saved") {
              router.push("/(tabs)/saved");
            } else {
              router.push("/(tabs)/chat");
            }
          }}
          style={s.headerBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
          <Text style={s.headerBtnText}>Wróć</Text>
        </TouchableOpacity>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerBtnCircle}>
            <Ionicons name="share-social-outline" size={20} color="#333" />
          </TouchableOpacity>
          {!favLoading && (
            <TouchableOpacity onPress={toggle} style={s.headerBtnCircle}>
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={20}
                color={isFav ? "#E8622A" : "#333"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroSection}>
          <View style={s.badgeRow}>
            {place.main_category && (
              <View style={s.modernBadge}>
                <Text style={s.modernBadgeText}>
                  {place.main_category === "Gastronomia"
                    ? "JEDZENIE"
                    : place.main_category.toUpperCase()}
                </Text>
              </View>
            )}
            {place.sub_category && (
              <View style={[s.modernBadge, s.subBadge]}>
                <Text style={s.subBadgeText}>{place.sub_category}</Text>
              </View>
            )}
            {place.price_level && (
              <View style={[s.modernBadge, s.priceBadge]}>
                <Text style={s.modernBadgeText}>
                  {{
                    PRICE_LEVEL_INEXPENSIVE: "$",
                    PRICE_LEVEL_MODERATE: "$$",
                    PRICE_LEVEL_EXPENSIVE: "$$$",
                    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
                  }[place.price_level] ?? place.price_level}
                </Text>
              </View>
            )}
          </View>

          <Text style={s.placeName}>{place.name}</Text>

          <View style={s.metaCard}>
            {(place.rating != null || place.user_rating_count != null) && (
              <View style={s.metaRow}>
                <Ionicons name="star" size={18} color="#F5A623" />
                <View style={s.metaContent}>
                  <Text style={s.metaValue}>
                    {place.rating?.toFixed(1)}{" "}
                    <Text style={s.metaLabel}>
                      ({Math.round(place.user_rating_count ?? 0)} opinii)
                    </Text>
                  </Text>
                </View>
              </View>
            )}
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={18} color="#66a494" />
              <View style={s.metaContent}>
                <Text style={s.metaValue}>
                  {place.address?.replace(", Warszawa", "")}
                </Text>
                <Text style={s.metaLabel}>
                  ({place.district || "Warszawa"})
                </Text>
              </View>
            </View>

            {place.opening_hours && (
              <TouchableOpacity
                style={s.metaRow}
                onPress={() => setHoursVisible(!hoursVisible)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color="#66a494" />
                <View style={s.metaContent}>
                  <View style={s.hoursTitleRow}>
                    <Text style={s.metaValue}>
                      {hoursVisible ? "Godziny otwarcia" : "Czynne dzisiaj"}
                    </Text>
                    <Ionicons
                      name={hoursVisible ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#aaa"
                    />
                  </View>
                  {hoursVisible && (
                    <View style={s.formattedHours}>
                      {formatOpeningHours(place.opening_hours)}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Lokalizacja</Text>
          <View style={s.mapContainer}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={s.mapPlaceholder}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={s.mapExpandBtn}
              onPress={() =>
                place.google_maps_direct_link &&
                Linking.openURL(place.google_maps_direct_link)
              }
            >
              <Ionicons name="navigate-circle-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>O miejscu</Text>
          <View style={s.summaryCard}>
            <Text style={s.summaryText}>{place.editorial_summary}</Text>
          </View>
        </View>

        {activeFeatures.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Co oferuje to miejsce</Text>
            <View style={s.featuresGrid}>
              {activeFeatures.map((key) => {
                const iconName = FEATURE_ICONS[key];
                const labelConfig = FEATURE_LABELS.find((f) => f.key === key);
                return (
                  <View key={key} style={s.featureTag}>
                    <Ionicons name={iconName} size={14} color="#66a494" />
                    <Text style={s.featureLabel}>
                      {labelConfig?.label || key}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[s.floatingActionBar, { bottom: insets.bottom + 16 }]}>
        <BlurView intensity={90} tint="light" style={s.blurContainer}>
          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.primaryActionBtn}
              onPress={() => Linking.openURL(place.maps_url!)}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={s.primaryActionText}>Trasa</Text>
            </TouchableOpacity>

            {place.menu_url && (
              <TouchableOpacity
                style={s.secondaryActionBtn}
                onPress={() => Linking.openURL(place.menu_url!)}
              >
                <Ionicons name="restaurant-outline" size={18} color="#333" />
                <Text style={s.secondaryActionText}>Menu</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 15, color: "#888" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 100,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#DDD",
  },
  headerBtnText: { fontSize: 14, fontWeight: "600", color: "#333" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#DDD",
  },
  heroSection: { paddingTop: 20, paddingHorizontal: 20, gap: 8 },
  badgeRow: { flexDirection: "row", gap: 8 },
  modernBadge: {
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  priceBadge: { backgroundColor: "#f0f0f0", borderColor: "transparent" },
  modernBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#66a494",
    letterSpacing: 0.5,
  },
  placeName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -1,
    marginTop: 10,
  },
  placeSub: {
    fontSize: 15,
    color: "#888",
    fontWeight: "400",
    marginBottom: 10,
  },
  metaCard: { gap: 16, marginTop: 10 },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 15 },
  metaContent: { flex: 1 },
  metaLabel: { fontSize: 12, color: "#aaa", marginTop: 2 },
  metaValue: { fontSize: 15, color: "#333", fontWeight: "600" },
  hoursTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formattedHours: { marginTop: 10, gap: 6 },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 3,
  },
  hourRowToday: {
    backgroundColor: "rgba(102,164,148,0.1)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  hourDay: { fontSize: 13, color: "#777", fontWeight: "700", width: 30 },
  hourDayToday: { color: "#66a494" },
  hourTime: { fontSize: 13, color: "#444" },
  hourTimeToday: { color: "#66a494", fontWeight: "700" },
  section: { marginTop: 30, paddingHorizontal: 20, gap: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#bbb",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mapContainer: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mapPlaceholder: { width: "100%", height: "100%" },
  mapExpandBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 12,
    elevation: 4,
  },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  featureLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
  floatingActionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  actionRow: {
    flexDirection: "row",
    padding: 8,
    gap: 10,
    alignItems: "center",
  },
  primaryActionBtn: {
    flex: 2,
    backgroundColor: "#111",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryActionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  secondaryActionText: { color: "#333", fontSize: 14, fontWeight: "600" },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
    fontWeight: "400",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ratingNum: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  ratingCount: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "400",
  },
  subBadge: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 0.5,
  },
});
