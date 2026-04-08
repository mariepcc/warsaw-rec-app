import { useState, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";

const PALETTES: [string, string][] = [
  ["#bde7f0", "#fcb69f"],
  ["#fcb69f", "#bde7f0"],
  ["#bde7f0", "#fcb69f"],
  ["#fcb69f", "#bde7f0"],
];

export function useGradientCycle() {
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const [colors, setColors] = useState<[string, string]>(PALETTES[0]);
  const progress = useRef(new Animated.Value(0)).current;

  const advance = useCallback(() => {
    if (animatingRef.current) return;

    animatingRef.current = true;
    const fromIndex = indexRef.current;
    const toIndex = (fromIndex + 1) % PALETTES.length;

    const from = PALETTES[fromIndex];
    const to = PALETTES[toIndex];

    progress.setValue(0);

    const listenerId = progress.addListener(({ value }) => {
      setColors([
        interpolateColor(from[0], to[0], value),
        interpolateColor(from[1], to[1], value),
      ]);
    });

    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
      useNativeDriver: false,
    }).start(() => {
      progress.removeListener(listenerId);
      indexRef.current = toIndex;
      animatingRef.current = false;
    });
  }, [progress]);

  return { colors, advance };
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function interpolateColor(from: string, to: string, t: number): string {
  const f = hexToRgb(from);
  const s = hexToRgb(to);

  const r = Math.round(f.r + (s.r - f.r) * t);
  const g = Math.round(f.g + (s.g - f.g) * t);
  const b = Math.round(f.b + (s.b - f.b) * t);

  return `rgb(${r},${g},${b})`;
}
