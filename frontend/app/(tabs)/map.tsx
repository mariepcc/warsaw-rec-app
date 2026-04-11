import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Linking,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { getAllPlaces, getSavedPlaces } from "@/api/places";
import type { Place } from "@/api/places";
import MapFilterBar, {
  CATEGORY_COLORS,
  CATEGORY_GRADIENTS,
  CATEGORY_ICONS,
  SUB_BY_CATEGORY,
  PRICE_LEVELS,
  DISTRICTS,
  MapFilterKey,
} from "@/components/filter/FilterBar";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.78;
const CARD_GAP = 12;
const CARD_H = 195;

const WARSAW: Region = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
const MIN_DELTA = 0.001;
const MAX_DELTA = 0.3;
const TIGHT_DELTA = 0.003;

type PlaceWithCoords = Place & { lat: number; lon: number };

function haverDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371,
    dLat = ((lat2 - lat1) * Math.PI) / 180,
    dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PulsingDot = memo(
  ({ coordinate }: { coordinate: { latitude: number; longitude: number } }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.7)).current;
    useEffect(() => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 2.6,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    }, []);
    return (
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <View style={pd.wrap}>
          <Animated.View
            style={[pd.ring, { transform: [{ scale }], opacity }]}
          />
          <View style={pd.dot} />
        </View>
      </Marker>
    );
  },
);
const pd = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(59,130,246,0.4)",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3B82F6",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
});

const CategoryPin = memo(
  ({ category, selected }: { category: string; selected: boolean }) => {
    const grad = CATEGORY_GRADIENTS[category] ?? ["#F5934A", "#E8622A"];
    const icon = CATEGORY_ICONS[category] ?? "location-outline";
    const sz = selected ? 38 : 32;
    const iSz = selected ? 17 : 14;
    return (
      <View style={{ alignItems: "center" }}>
        {selected ? (
          <View
            style={[
              pin.ring,
              { width: sz + 10, height: sz + 10, borderRadius: (sz + 10) / 2 },
            ]}
          >
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                pin.circle,
                { width: sz, height: sz, borderRadius: sz / 2 },
              ]}
            >
              <Ionicons name={icon} size={iSz} color="#fff" />
            </LinearGradient>
          </View>
        ) : (
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              pin.circle,
              { width: sz, height: sz, borderRadius: sz / 2 },
            ]}
          >
            <Ionicons name={icon} size={iSz} color="#fff" />
          </LinearGradient>
        )}
        <View
          style={[
            pin.tail,
            { borderTopColor: grad[1], borderTopWidth: selected ? 8 : 6 },
          ]}
        />
      </View>
    );
  },
);
const pin = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#1a1a1a",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
});

const CountPopup = memo(
  ({ count, trigger }: { count: number; trigger: number }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-12)).current;
    useEffect(() => {
      if (!trigger) return;
      opacity.setValue(0);
      translateY.setValue(-12);
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -12,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2800);
      return () => clearTimeout(t);
    }, [trigger]);
    return (
      <Animated.View
        style={[popSt.wrap, { opacity, transform: [{ translateY }] }]}
        pointerEvents="none"
      >
        <BlurView intensity={72} tint="light" style={popSt.blur}>
          <Text style={popSt.count}>{count}</Text>
          <Text style={popSt.label}>miejsc</Text>
        </BlurView>
      </Animated.View>
    );
  },
);
const popSt = StyleSheet.create({
  wrap: { alignSelf: "center" },
  blur: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
  },
  count: { fontSize: 28, fontWeight: "800", color: "#1a1a1a" },
  label: { fontSize: 15, color: "#777", fontWeight: "500" },
});

type PlaceCardProps = {
  place: PlaceWithCoords;
  isFav: boolean;
  onToggleFav: () => void;
  onNavigate: () => void;
};
const PlaceCard = memo(
  ({ place, isFav, onToggleFav, onNavigate }: PlaceCardProps) => {
    const grad = CATEGORY_GRADIENTS[place.main_category ?? ""] ?? [
      "#F5934A",
      "#E8622A",
    ];
    const icon =
      CATEGORY_ICONS[place.main_category ?? ""] ?? "location-outline";
    const color = CATEGORY_COLORS[place.main_category ?? ""] ?? "#E8622A";
    const pl =
      place.price_level === "PRICE_LEVEL_INEXPENSIVE"
        ? "$"
        : place.price_level === "PRICE_LEVEL_MODERATE"
          ? "$$"
          : place.price_level === "PRICE_LEVEL_EXPENSIVE"
            ? "$$$"
            : place.price_level === "PRICE_LEVEL_LUXURY"
              ? "$$$$"
              : null;
    return (
      <View style={cardSt.wrap}>
        <View style={cardSt.header}>
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardSt.iconBox}
          >
            <Ionicons name={icon} size={15} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={cardSt.name} numberOfLines={2}>
              {place.name}
            </Text>
            {place.sub_category && (
              <Text style={cardSt.sub}>{place.sub_category}</Text>
            )}
          </View>
          <View style={cardSt.topRight}>
            {place.rating != null && (
              <View style={cardSt.ratingBox}>
                <Ionicons name="star" size={11} color="#F5A623" />
                <Text style={cardSt.rating}>
                  {Number(place.rating).toFixed(1)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={onToggleFav}
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
          <Text style={cardSt.address} numberOfLines={1}>
            {place.address}
          </Text>
        )}
        <View style={cardSt.footer}>
          {place.district && (
            <Text style={cardSt.district}>{place.district}</Text>
          )}
          {pl && <Text style={[cardSt.price, { color }]}>{pl}</Text>}
        </View>
        <TouchableOpacity style={cardSt.navBtn} onPress={onNavigate}>
          <Ionicons name="navigate-outline" size={14} color="#555" />
          <Text style={cardSt.navText}>Nawiguj</Text>
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) =>
    prev.place.name === next.place.name && prev.isFav === next.isFav,
);
const cardSt = StyleSheet.create({
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

const FilterModal = memo(
  ({
    visible,
    title,
    items,
    activeValue,
    onSelect,
    onClear,
    onClose,
  }: {
    visible: boolean;
    title: string;
    items: { label: string; value: string }[];
    activeValue: string | null;
    onSelect: (v: string) => void;
    onClear: () => void;
    onClose: () => void;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={fmSt.overlay} onPress={onClose}>
        <Pressable style={fmSt.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={fmSt.handle} />
          <Text style={fmSt.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const active = activeValue === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={fmSt.row}
                  onPress={() => {
                    onSelect(active ? "" : item.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      fmSt.rowText,
                      active && { color: "#E8622A", fontWeight: "700" },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color="#E8622A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={fmSt.clearBtn}
            onPress={() => {
              onClear();
              onClose();
            }}
          >
            <Text style={fmSt.clearText}>Wyczyść</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  ),
);
const fmSt = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "65%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  rowText: { fontSize: 15, color: "#333" },
  clearBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  clearText: { fontSize: 15, color: "#999", fontWeight: "600" },
});

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const suppressViewable = useRef(false);
  const currentDeltaRef = useRef(0.06);

  const FILTER_H = insets.top + 76 + 56;
  const POPUP_TOP = FILTER_H + 16;
  const CARDS_BOT = insets.bottom + 90;
  const CARDS_SLOT = 44 + CARD_H + 8;

  const [basePlaces, setBasePlaces] = useState<PlaceWithCoords[]>([]);
  const [cardPlaces, setCardPlaces] = useState<PlaceWithCoords[]>([]);
  const [activeFilter, setActiveFilter] = useState<MapFilterKey>("saved");
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [popupTrigger, setPopupTrigger] = useState(0);
  const [popupCount, setPopupCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [modal, setModal] = useState<"sub" | "price" | "district" | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [locationLoading, setLocationLoading] = useState(false);

  const cardsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardsAnim, {
      toValue: cardsOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [cardsOpen]);
  const cardsTranslate = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CARDS_SLOT + CARDS_BOT + 80, 0],
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserCoords(coords);
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        800,
      );
    })();
  }, []);

  useEffect(() => {
    loadPlaces(activeFilter);
  }, [activeFilter]);

  async function loadPlaces(filter: MapFilterKey) {
    setLoading(true);
    setCardsOpen(false);
    setSelectedName(null);
    setCardPlaces([]);
    setSearchText("");
    setActiveSub(null);
    setActivePrice(null);
    setActiveDistrict(null);
    try {
      let data: PlaceWithCoords[] = [];
      if (filter === "saved") {
        const raw = await getSavedPlaces();
        data = (raw as any[])
          .filter(
            (p) => (p.lat || p.metadata?.lat) && (p.lon || p.metadata?.lon),
          )
          .map((p) => ({
            ...p,
            lat: p.metadata?.lat ?? p.lat,
            lon: p.metadata?.lon ?? p.lon,
          }));
        setFavIds(new Set(data.map((p) => p.name)));
      } else {
        const raw = await getAllPlaces();
        data = (raw as any[]).filter(
          (p) => p.lat && p.lon && p.main_category === filter,
        );
      }
      const origin = userCoords ?? { latitude: 52.2297, longitude: 21.0122 };
      const sorted = [...data].sort(
        (a, b) =>
          haverDist(origin.latitude, origin.longitude, a.lat, a.lon) -
          haverDist(origin.latitude, origin.longitude, b.lat, b.lon),
      );
      setBasePlaces(sorted);
      setPopupCount(data.length);
      setPopupTrigger((t) => t + 1);
      const region = userCoords
        ? { ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }
        : WARSAW;
      mapRef.current?.animateToRegion(region, 700);
    } catch (e) {
      console.log("Map error", e);
    } finally {
      setLoading(false);
    }
  }

  const displayPlaces = React.useMemo(
    () =>
      basePlaces.filter((p) => {
        if (
          searchText &&
          !p.name.toLowerCase().includes(searchText.toLowerCase())
        )
          return false;
        if (activeSub && p.sub_category !== activeSub) return false;
        if (activePrice && p.price_level !== activePrice) return false;
        if (activeDistrict && p.district !== activeDistrict) return false;
        return true;
      }),
    [basePlaces, searchText, activeSub, activePrice, activeDistrict],
  );

  function handleRegionChangeComplete(r: Region) {
    currentDeltaRef.current = r.latitudeDelta;
    let { latitudeDelta: ld, longitudeDelta: lnd } = r;
    let clamp = false;
    if (ld > MAX_DELTA) {
      ld = MAX_DELTA;
      clamp = true;
    }
    if (lnd > MAX_DELTA) {
      lnd = MAX_DELTA;
      clamp = true;
    }
    if (ld < MIN_DELTA) {
      ld = MIN_DELTA;
      clamp = true;
    }
    if (clamp)
      mapRef.current?.animateToRegion(
        { ...r, latitudeDelta: ld, longitudeDelta: lnd },
        80,
      );
  }

  function zoomToPin(lat: number, lon: number) {
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: TIGHT_DELTA,
        longitudeDelta: TIGHT_DELTA,
      },
      500,
    );
  }

  function handleMarkerPress(place: PlaceWithCoords) {
    const resorted = [...displayPlaces].sort((a, b) => {
      if (a.name === place.name) return -1;
      if (b.name === place.name) return 1;
      return (
        haverDist(place.lat, place.lon, a.lat, a.lon) -
        haverDist(place.lat, place.lon, b.lat, b.lon)
      );
    });

    setCardPlaces(resorted);
    setSelectedName(place.name);
    setCardsOpen(true);

    suppressViewable.current = true;
    zoomToPin(place.lat, place.lon);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setTimeout(() => {
        suppressViewable.current = false;
      }, 300);
    }, 150);
  }

  const handleViewable = useCallback(({ viewableItems }: any) => {
    if (suppressViewable.current || !viewableItems.length) return;
    const item = viewableItems[0].item as PlaceWithCoords;
    if (!item) return;
    setSelectedName(item.name);
    zoomToPin(item.lat, item.lon);
  }, []);

  function closeCards() {
    setCardsOpen(false);
    setSelectedName(null);
    setTimeout(() => setCardPlaces([]), 450);
  }

  function toggleFav(name: string) {
    setFavIds((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function goToMyLocation() {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserCoords(coords);
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.035, longitudeDelta: 0.035 },
        800,
      );
    } catch {
    } finally {
      setLocationLoading(false);
    }
  }

  const renderCard = useCallback(
    ({ item }: { item: PlaceWithCoords }) => (
      <PlaceCard
        place={item}
        isFav={favIds.has(item.name)}
        onToggleFav={() => toggleFav(item.name)}
        onNavigate={() => {
          if (item.google_maps_direct_link)
            Linking.openURL(item.google_maps_direct_link);
        }}
      />
    ),
    [favIds],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CARD_W + CARD_GAP,
      offset: (CARD_W + CARD_GAP) * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback(
    (item: PlaceWithCoords, i: number) => `card-${item.name}-${i}`,
    [],
  );

  return (
    <View style={s.root}>
      <MapViewClustering
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={WARSAW}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
        moveOnMarkerPress={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        clusterColor="#fff"
        clusterTextColor="#1a1a1a"
        customMapStyle={[
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ]}
        radius={45}
        maxZoom={14}
        minPoints={2}
        renderCluster={(cluster: any) => {
          const { id, geometry, onPress, properties } = cluster;
          return (
            <Marker
              key={`c-${id}`}
              coordinate={{
                longitude: geometry.coordinates[0],
                latitude: geometry.coordinates[1],
              }}
              onPress={onPress}
              tracksViewChanges={false}
            >
              <View style={s.cluster}>
                <Text style={s.clusterTxt}>{properties.point_count}</Text>
              </View>
            </Marker>
          );
        }}
      >
        {displayPlaces.map((place, idx) => {
          const isSelected = place.name === selectedName;

          return (
            <Marker
              key={`${place.name}-${isSelected}`}
              coordinate={{ latitude: place.lat, longitude: place.lon }}
              onPress={() => handleMarkerPress(place)}
              tracksViewChanges={isSelected}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={isSelected ? 999 : 10}
            >
              <CategoryPin
                category={place.main_category ?? ""}
                selected={isSelected}
              />
            </Marker>
          );
        })}
        {userCoords && <PulsingDot coordinate={userCoords} />}
      </MapViewClustering>

      <MapFilterBar
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
        searchText={searchText}
        onSearchChange={setSearchText}
        activeSub={activeSub}
        onSubChange={setActiveSub}
        activePrice={activePrice}
        onPriceChange={setActivePrice}
        activeDistrict={activeDistrict}
        onDistrictChange={setActiveDistrict}
        onOpenModal={setModal}
      />

      <View style={[s.popupWrap, { top: POPUP_TOP }]} pointerEvents="none">
        <CountPopup count={popupCount} trigger={popupTrigger} />
      </View>

      {loading && (
        <View style={[s.loadingWrap, { top: FILTER_H + 16 }]}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="small" color="#E8622A" />
            <Text style={s.loadingTxt}>Ładowanie...</Text>
          </View>
        </View>
      )}

      <Animated.View
        style={[
          s.controls,
          {
            bottom: CARDS_BOT,
            transform: [
              {
                translateY: cardsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -(CARDS_SLOT + 12)],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity style={s.nearMe} onPress={goToMyLocation}>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <>
              <Ionicons name="navigate" size={15} color="#1a1a1a" />
              <Text style={s.nearMeTxt}>Near me</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          s.cardsWrap,
          { bottom: CARDS_BOT, transform: [{ translateY: cardsTranslate }] },
        ]}
        pointerEvents={cardsOpen ? "box-none" : "none"}
      >
        <TouchableOpacity style={s.closeBtn} onPress={closeCards}>
          <BlurView intensity={70} tint="light" style={s.closeBtnInner}>
            <Ionicons name="close" size={18} color="#333" />
          </BlurView>
        </TouchableOpacity>
        <FlatList
          ref={listRef}
          data={cardPlaces}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: (SCREEN_W - CARD_W) / 2 }}
          onViewableItemsChanged={handleViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 55 }}
          getItemLayout={getItemLayout}
          renderItem={renderCard}
          windowSize={3}
          maxToRenderPerBatch={3}
          initialNumToRender={3}
          removeClippedSubviews
          disableVirtualization={false}
        />
      </Animated.View>

      <FilterModal
        visible={modal === "sub"}
        title="Podkategoria"
        items={(SUB_BY_CATEGORY[activeFilter] ?? []).map((x) => ({
          label: x,
          value: x,
        }))}
        activeValue={activeSub}
        onSelect={(v) => setActiveSub(v || null)}
        onClear={() => setActiveSub(null)}
        onClose={() => setModal(null)}
      />
      <FilterModal
        visible={modal === "price"}
        title="Poziom cen"
        items={PRICE_LEVELS}
        activeValue={activePrice}
        onSelect={(v) => setActivePrice(v || null)}
        onClear={() => setActivePrice(null)}
        onClose={() => setModal(null)}
      />
      <FilterModal
        visible={modal === "district"}
        title="Dzielnica"
        items={DISTRICTS.map((d) => ({ label: d, value: d }))}
        activeValue={activeDistrict}
        onSelect={(v) => setActiveDistrict(v || null)}
        onClear={() => setActiveDistrict(null)}
        onClose={() => setModal(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  clusterTxt: { fontSize: 13, fontWeight: "800", color: "#1a1a1a" },
  popupWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  loadingWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 40,
  },
  loadingCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingTxt: { fontSize: 14, color: "#555" },
  controls: { position: "absolute", left: 16, right: 16 },
  nearMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  nearMeTxt: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  cardsWrap: { position: "absolute", left: 0, right: 0, zIndex: 100 },
  closeBtn: { alignSelf: "center", marginBottom: 12 },
  closeBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
});
