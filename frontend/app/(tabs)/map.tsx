import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { getAllPlaces, getFavouritePlaces } from "@/api/places";
import type { Place } from "@/api/places";
import { PulsingDot } from "@/components/map/PulsingDot";
import { CategoryPin } from "@/components/map/CategoryPin";
import { CountPopup } from "@/components/map/CountPopup";
import {
  PlaceCard,
  CARD_W,
  CARD_GAP,
  CARD_H,
} from "@/components/map/PlaceCard";
import { FilterModal } from "@/components/map/FilterModal";
import MapFilterBar, {
  SUB_BY_CATEGORY,
  PRICE_LEVELS,
  DISTRICTS,
  MapFilterKey,
} from "@/components/map/FilterBar";

const { width: SCREEN_W } = Dimensions.get("window");

const WARSAW: Region = {
  latitude: 52.2297,
  longitude: 21.0122,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
const MIN_DELTA = 0.001;
const MAX_DELTA = 0.08;
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const suppressViewable = useRef(false);
  const currentDeltaRef = useRef(0.06);

  const FILTER_H = insets.top + 76 + 56;
  const POPUP_TOP = FILTER_H + 16;
  const CARDS_BOT = insets.bottom + 70;
  const CARDS_SLOT = CARD_H;

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

  const nearMeOpacity = cardsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
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
        const raw = await getFavouritePlaces();
        data = (raw as any[])
          .filter((p) => {
            const lat = p.metadata?.lat ?? p.lat;
            const lon = p.metadata?.lon ?? p.lon;
            return lat != null && lon != null;
          })
          .map((p) => ({
            ...p,
            lat: p.metadata?.lat ?? p.lat,
            lon: p.metadata?.lon ?? p.lon,
          }));
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
      mapRef.current?.animateToRegion(
        userCoords
          ? { ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }
          : WARSAW,
        700,
      );
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
    ({ item }: { item: PlaceWithCoords }) => <PlaceCard place={item} />,
    [],
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
    (item: PlaceWithCoords) => `card-${item.id}`,
    [],
  );

  return (
    <View style={s.root}>
      <MapViewClustering
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={WARSAW}
        cameraZoomRange={{
          minCenterCoordinateDistance: 500, // max zoom in
          maxCenterCoordinateDistance: 50000, // max zoom out (ogranicz oddalanie)
          animated: true,
        }}
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
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }],
          },
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
        ]}
        maxZoom={14}
        radius={45}
        minPoints={2}
        renderCluster={(cluster: any) => {
          const { id, geometry, onPress, properties } = cluster;

          const lon = geometry?.coordinates?.[0];
          const lat = geometry?.coordinates?.[1];
          if (lat == null || lon == null) return null;
          if (!properties) return null;
          if (properties.point_count == null) return null;
          return (
            <Marker
              key={`c-${id}`}
              coordinate={{ longitude: lon, latitude: lat }}
              onPress={onPress ?? undefined}
              tracksViewChanges={false}
            >
              <View style={s.cluster}>
                <Text style={s.clusterTxt}>{properties.point_count}</Text>
              </View>
            </Marker>
          );
        }}
      >
        {displayPlaces
          .filter((place) => place.lat != null && place.lon != null)
          .map((place) => {
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
        onFilterChange={setActiveFilter}
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
          s.controlsRow,
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
        <Animated.View
          style={{ opacity: nearMeOpacity }}
          pointerEvents={cardsOpen ? "none" : "auto"}
        >
          <TouchableOpacity style={s.nearMe} onPress={goToMyLocation}>
            <BlurView intensity={80} tint="light" style={s.nearMeBlur}>
              {locationLoading ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <>
                  <Ionicons name="navigate" size={15} color="#1a1a1a" />
                  <Text style={s.nearMeTxt}>Near me</Text>
                </>
              )}
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {cardsOpen && (
          <TouchableOpacity style={s.closeBtn} onPress={closeCards}>
            <BlurView intensity={80} tint="light" style={s.closeBtnInner}>
              <Ionicons name="close" size={20} color="#111" />
            </BlurView>
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View
        style={[
          s.cardsWrap,
          { bottom: CARDS_BOT, transform: [{ translateY: cardsTranslate }] },
        ]}
        pointerEvents={cardsOpen ? "box-none" : "none"}
      >
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
          extraData={selectedName}
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
  controlsRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 110,
  },
  nearMe: {
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  nearMeBlur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  nearMeTxt: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  cardsWrap: { position: "absolute", left: 0, right: 0, zIndex: 100 },
  closeBtn: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  closeBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
