import { memo } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORY_GRADIENTS, CATEGORY_ICONS } from "@/components/map/FilterBar";

type Props = { category: string; selected: boolean };

export const CategoryPin = memo(({ category, selected }: Props) => {
  const grad = CATEGORY_GRADIENTS[category] ?? ["#F5934A", "#E8622A"];
  const icon = CATEGORY_ICONS[category] ?? "location-outline";
  const sz = selected ? 38 : 32;
  const iSz = selected ? 17 : 14;

  return (
    <View style={{ alignItems: "center" }}>
      {selected ? (
        <View
          style={[
            s.ring,
            { width: sz + 10, height: sz + 10, borderRadius: (sz + 10) / 2 },
          ]}
        >
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.circle, { width: sz, height: sz, borderRadius: sz / 2 }]}
          >
            <Ionicons name={icon} size={iSz} color="#fff" />
          </LinearGradient>
        </View>
      ) : (
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.circle, { width: sz, height: sz, borderRadius: sz / 2 }]}
        >
          <Ionicons name={icon} size={iSz} color="#fff" />
        </LinearGradient>
      )}
      <View
        style={[
          s.tail,
          { borderTopColor: grad[1], borderTopWidth: selected ? 8 : 6 },
        ]}
      />
    </View>
  );
});

const s = StyleSheet.create({
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
