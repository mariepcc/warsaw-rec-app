import { memo, useRef, useEffect } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type Props = { count: number };

export const FilterResultPopup = memo(({ count }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ scale }] }]}>
      <BlurView intensity={72} tint="light" style={s.blur}>
        <Ionicons name="filter" size={14} color="#555" />
        <Text style={s.text}>
          {count === 0
            ? "Brak wyników"
            : `${count} ${count === 1 ? "miejsce" : count < 5 ? "miejsca" : "miejsc"}`}
        </Text>
      </BlurView>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  wrap: { alignSelf: "center", marginTop: 8 },
  blur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.07)",
  },
  text: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
});
