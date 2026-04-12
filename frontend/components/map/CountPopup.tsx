import { memo, useRef, useEffect } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

type Props = { count: number; trigger: number };

export const CountPopup = memo(({ count, trigger }: Props) => {
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
      style={[s.wrap, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <BlurView intensity={72} tint="light" style={s.blur}>
        <Text style={s.count}>{count}</Text>
        <Text style={s.label}>miejsc</Text>
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
