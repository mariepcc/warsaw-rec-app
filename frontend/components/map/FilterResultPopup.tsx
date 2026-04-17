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
        <Text style={s.count}>{count}</Text>
        <Text style={s.label}>
          {count === 0
            ? "Brak wyników"
            : `${count === 1 ? "miejsce" : count < 5 ? "miejsca" : "miejsc"}`}
        </Text>
      </BlurView>
    </Animated.View>
  );
});

const s = StyleSheet.create({
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
