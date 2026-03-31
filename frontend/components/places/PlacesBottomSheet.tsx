import {
  Modal,
  Text,
  ScrollView,
  PanResponder,
  Dimensions,
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Place } from "@/api/places";
import React from "react";
import { PlaceCard } from "./PlaceCard";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.5;

type SheetProps = {
  visible: boolean;
  places: Place[];
  sessionId?: string;
  onClose: () => void;
};

export function PlacesBottomSheet({
  visible,
  places,
  sessionId,
  onClose,
}: SheetProps) {
  const translateY = React.useRef(new Animated.Value(SHEET_H)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      translateY.setValue(SHEET_H);
    }
  }, [visible]);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SHEET_H,
            duration: 220,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 180,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible && !places.length) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={sheetStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[sheetStyles.sheet, { transform: [{ translateY }] }]}
      >
        <View {...panResponder.panHandlers} style={sheetStyles.handleArea}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.sheetTitle}>
            {places.length}{" "}
            {places.length === 1
              ? "miejsce"
              : places.length < 5
                ? "miejsca"
                : "miejsc"}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sheetStyles.list}
          decelerationRate="fast"
          snapToInterval={232}
          snapToAlignment="start"
        >
          {places.map((place) => (
            <PlaceCard key={place.name} place={place} />
          ))}
        </ScrollView>

        <View style={sheetStyles.footer}>
          <TouchableOpacity style={sheetStyles.closeBtn} onPress={onClose}>
            <Text style={sheetStyles.closeBtnText}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: "#F7F7F7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleArea: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F7F7",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    alignSelf: "flex-start",
  },
  list: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 0,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#F7F7F7",
  },
  closeBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
