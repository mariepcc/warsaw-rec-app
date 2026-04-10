import { memo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { PlaceCard } from "@/components/places/PlaceCard";
import { Place } from "@/api/places";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  places?: Place[];
  isFollowup?: boolean;
};

export const MessageItem = memo(
  ({
    item,
    onPlacePress,
  }: {
    item: Message;
    onPlacePress: (place: Place) => void;
  }) => {
    const isUser = item.role === "user";
    const showPlaces =
      !isUser && !item.isFollowup && item.places && item.places.length > 0;

    return (
      <View style={[s.row, isUser ? s.rowUser : s.rowAssistant]}>
        <View style={[s.col, isUser && { alignItems: "flex-end" }]}>
          <View style={isUser ? s.bubbleUser : s.assistantTextContainer}>
            <Text style={[s.text, isUser ? s.textUser : s.textAssistant]}>
              {item.content}
            </Text>
          </View>
          {showPlaces && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 16 }}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {item.places!.map((place) => (
                <PlaceCard
                  key={place.name}
                  place={place}
                  onPress={() => onPlacePress(place)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id && prev.item.content === next.item.content,
);

const ACCENT = "#dcc3c3";

const s = StyleSheet.create({
  row: { marginBottom: 24 },
  rowUser: { alignItems: "flex-end" },
  rowAssistant: { alignItems: "flex-start" },
  col: { flex: 1 },
  bubbleUser: {
    backgroundColor: "rgba(228, 150, 119, 0.36)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  assistantTextContainer: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  text: { fontSize: 15, lineHeight: 24, color: "#2a2828" },
  textUser: { fontWeight: "600" },
  textAssistant: { fontWeight: "400" },
});
