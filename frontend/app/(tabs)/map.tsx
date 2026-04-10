import { useState, useRef, useEffect, useCallback } from "react";
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
  MapFilterKey,
} from "@/components/filter/FilterBar";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.78;
const CARD_GAP = 12;

const WARSAW: Region = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
const MIN_DELTA = 0.002;
const MAX_DELTA = 0.3;

type PlaceWithCoords = Place & { lat: number; lon: number };

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function PulsingDot({
  coordinate,
}: {
  coordinate: { latitude: number; longitude: number };
}) {
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
        <Animated.View style={[pd.ring, { transform: [{ scale }], opacity }]} />
        <View style={pd.dot} />
      </View>
    </Marker>
  );
}

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

function CategoryPin({
  category,
  selected,
}: {
  category: string;
  selected: boolean;
}) {
  const grad = CATEGORY_GRADIENTS[category] ?? ["#F5934A", "#E8622A"];
  const icon = CATEGORY_ICONS[category] ?? "location-outline";
  const sz = selected ? 44 : 38;
  const iSz = selected ? 22 : 18;
  const tailColor = grad[1];

  return (
    <View style={{ alignItems: "center" }}>
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          pin.circle,
          { width: sz, height: sz, borderRadius: sz / 2 },
          selected && pin.selectedShadow,
        ]}
      >
        <Ionicons name={icon} size={iSz} color="#fff" />
      </LinearGradient>
      <View
        style={[
          pin.tail,
          { borderTopColor: tailColor, borderTopWidth: selected ? 9 : 7 },
        ]}
      />
    </View>
  );
}

const pin = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  selectedShadow: {
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
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

function CountPopup({ count, visible }: { count: number; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      prevVisible.current = true;
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
        ]).start(() => {
          prevVisible.current = false;
        });
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [visible, count]);

  return (
    <Animated.View
      style={[pop.wrap, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <BlurView intensity={72} tint="light" style={pop.blur}>
        <Text style={pop.count}>{count}</Text>
        <Text style={pop.label}>miejsc</Text>
      </BlurView>
    </Animated.View>
  );
}

const pop = StyleSheet.create({
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  count: { fontSize: 15, fontWeight: "800", color: "#1a1a1a" },
  label: { fontSize: 15, color: "#3f3f3f", fontWeight: "500" },
});

function PlaceCard({
  place,
  isFav,
  onToggleFav,
  onNavigate,
}: {
  place: PlaceWithCoords;
  isFav: boolean;
  onToggleFav: () => void;
  onNavigate: () => void;
}) {
  const grad = CATEGORY_GRADIENTS[place.main_category ?? ""] ?? [
    "#F5934A",
    "#E8622A",
  ];
  const icon = CATEGORY_ICONS[place.main_category ?? ""] ?? "location-outline";
  const color = CATEGORY_COLORS[place.main_category ?? ""] ?? "#E8622A";

  return (
    <View style={card.wrap}>
      <View style={card.header}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={card.iconBox}
        >
          <Ionicons name={icon} size={15} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={card.name} numberOfLines={2}>
            {place.name}
          </Text>
          {place.sub_category && (
            <Text style={card.sub}>{place.sub_category}</Text>
          )}
        </View>
        <View style={card.topRight}>
          {place.rating != null && (
            <View style={card.ratingBox}>
              <Ionicons name="star" size={11} color="#F5A623" />
              <Text style={card.rating}>{Number(place.rating).toFixed(1)}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onToggleFav}
            style={card.heartBtn}
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
        <Text style={card.address} numberOfLines={1}>
          {place.address}
        </Text>
      )}

      <View style={card.footer}>
        {place.district && <Text style={card.district}>{place.district}</Text>}
        {place.price_level && (
          <Text style={[card.price, { color }]}>
            {place.price_level === "PRICE_LEVEL_INEXPENSIVE"
              ? "$"
              : place.price_level === "PRICE_LEVEL_MODERATE"
                ? "$$"
                : place.price_level === "PRICE_LEVEL_EXPENSIVE"
                  ? "$$$"
                  : "$$$$"}
          </Text>
        )}
      </View>

      <TouchableOpacity style={card.navBtn} onPress={onNavigate}>
        <Ionicons name="navigate-outline" size={14} color="#555" />
        <Text style={card.navText}>Nawiguj</Text>
      </TouchableOpacity>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    width: CARD_W,
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
  heartBtn: { padding: 2 },
  address: { fontSize: 12, color: "#888", marginBottom: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  district: { fontSize: 12, color: "#bbb" },
  price: { fontSize: 13, fontWeight: "700" },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  navText: { color: "#444", fontSize: 14, fontWeight: "600" },
});

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const isMapDrivingList = useRef(false);

  const FILTER_H = insets.top + 62 + 76;
  const POPUP_TOP = FILTER_H + 16;

  const [places, setPlaces] = useState<PlaceWithCoords[]>([]);
  const [sortedPlaces, setSortedPlaces] = useState<PlaceWithCoords[]>([]);
  const [activeFilter, setActiveFilter] = useState<MapFilterKey>("saved");
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupCount, setPopupCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [locationLoading, setLocationLoading] = useState(false);

  const cardsAnim = useRef(new Animated.Value(0)).current;
  const cardsVisible = selectedIdx !== null && sortedPlaces.length > 0;

  useEffect(() => {
    Animated.spring(cardsAnim, {
      toValue: cardsVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [cardsVisible]);

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
        { ...coords, latitudeDelta: 0.035, longitudeDelta: 0.035 },
        800,
      );
    })();
  }, []);

  useEffect(() => {
    loadPlaces(activeFilter);
  }, [activeFilter]);

  async function loadPlaces(filter: MapFilterKey) {
    setLoading(true);
    setSelectedIdx(null);
    setSearchText("");
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
      setPlaces(data);

      let initialSorted = [...data];
      if (userCoords) {
        initialSorted.sort((a, b) => {
          const distA = getDistance(
            userCoords.latitude,
            userCoords.longitude,
            a.lat,
            a.lon,
          );
          const distB = getDistance(
            userCoords.latitude,
            userCoords.longitude,
            b.lat,
            b.lon,
          );
          return distA - distB;
        });
      }

      setSortedPlaces(initialSorted);
      setPopupCount(data.length);
      setShowPopup(false);
      setTimeout(() => setShowPopup(true), 80);
      zoomToUser(true);
    } catch (e) {
      console.log("Map error", e);
    } finally {
      setLoading(false);
    }
  }

  function zoomToUser(strongZoom = false) {
    const delta = strongZoom ? 0.015 : 0.045;
    const region = userCoords
      ? { ...userCoords, latitudeDelta: delta, longitudeDelta: delta }
      : { ...WARSAW };
    mapRef.current?.animateToRegion(region, 700);
  }

  function handleRegionChangeComplete(r: Region) {
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

  function handleMarkerPress(place: PlaceWithCoords) {
    isMapDrivingList.current = true;

    const newSorted = [...places].sort((a, b) => {
      if (a.name === place.name) return -1;
      if (b.name === place.name) return 1;
      const distA = getDistance(place.lat, place.lon, a.lat, a.lon);
      const distB = getDistance(place.lat, place.lon, b.lat, b.lon);
      return distA - distB;
    });

    setSortedPlaces(newSorted);
    setSelectedIdx(0);

    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0.5,
      });
      setTimeout(() => {
        isMapDrivingList.current = false;
      }, 400);
    }, 100);

    mapRef.current?.animateCamera(
      {
        center: { latitude: place.lat, longitude: place.lon },
        pitch: 0,
        heading: 0,
        zoom: 17,
      },
      { duration: 800 },
    );
  }

  const handleViewable = useCallback(
    ({ viewableItems }: any) => {
      if (isMapDrivingList.current) return;
      if (!viewableItems.length) return;
      const idx = viewableItems[0].index as number;
      if (idx == null) return;

      setSelectedIdx(idx);
      const place = sortedPlaces[idx];

      if (place) {
        mapRef.current?.animateCamera(
          {
            center: {
              latitude: place.lat - 0.002,
              longitude: place.lon,
            },
            zoom: 16,
          },
          { duration: 500 },
        );
      }
    },
    [sortedPlaces],
  );

  function closeCards() {
    setSelectedIdx(null);
  }

  function toggleFav(place: PlaceWithCoords) {
    setFavIds((prev) => {
      const next = new Set(prev);
      next.has(place.name) ? next.delete(place.name) : next.add(place.name);
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

  const displayPlaces = searchText
    ? sortedPlaces.filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : sortedPlaces;

  const CARDS_BOTTOM = insets.bottom + 90;
  const cardsTranslate = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

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
        clusterTextColor="#E8622A"
        radius={50}
        extent={1024}
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
        {displayPlaces.map((place, idx) => (
          <Marker
            key={`${place.name}-${idx}`}
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            onPress={() => handleMarkerPress(place)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <CategoryPin
              category={place.main_category ?? ""}
              selected={
                selectedIdx !== null &&
                sortedPlaces[selectedIdx]?.name === place.name
              }
            />
          </Marker>
        ))}

        {userCoords && <PulsingDot coordinate={userCoords} />}
      </MapViewClustering>

      <MapFilterBar
        activeFilter={activeFilter}
        onFilterChange={(f) => {
          setActiveFilter(f);
          setSelectedIdx(null);
        }}
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <View style={[s.popupWrap, { top: POPUP_TOP }]} pointerEvents="none">
        <CountPopup count={popupCount} visible={showPopup} />
      </View>

      {loading && (
        <View style={[s.loadingWrap, { top: FILTER_H + 16 }]}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="small" color="#E8622A" />
            <Text style={s.loadingTxt}>Ładowanie...</Text>
          </View>
        </View>
      )}

      <View
        style={[
          s.controls,
          { bottom: CARDS_BOTTOM + (cardsVisible ? 168 : 0) },
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
      </View>

      <Animated.View
        style={[
          s.cardsWrap,
          { bottom: CARDS_BOTTOM, transform: [{ translateY: cardsTranslate }] },
        ]}
      >
        <TouchableOpacity style={s.closeBtn} onPress={closeCards}>
          <BlurView intensity={70} tint="light" style={s.closeBtnInner}>
            <Ionicons name="close" size={18} color="#333" />
          </BlurView>
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={displayPlaces}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: (SCREEN_W - CARD_W) / 2 }}
          onViewableItemsChanged={handleViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 55 }}
          getItemLayout={(_, index) => ({
            length: CARD_W + CARD_GAP,
            offset: (CARD_W + CARD_GAP) * index,
            index,
          })}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              isFav={favIds.has(item.name)}
              onToggleFav={() => toggleFav(item)}
              onNavigate={() => {
                if (item.google_maps_direct_link)
                  Linking.openURL(item.google_maps_direct_link);
              }}
            />
          )}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  cluster: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E8622A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  clusterTxt: { fontSize: 14, fontWeight: "800", color: "#E8622A" },

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

  cardsWrap: { position: "absolute", left: 0, right: 0 },

  closeBtn: {
    alignSelf: "flex-end",
    marginRight: (SCREEN_W - CARD_W) / 2,
    marginBottom: 8,
  },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
});
