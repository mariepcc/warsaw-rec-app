import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";

export default function AppLayout() {
  return (
    <Tabs
      initialRouteName="chat"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "transparent",
          borderRadius: 35,
          height: 70,
          position: "absolute",
          bottom: 20,
          marginHorizontal: 20,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          overflow: "hidden",
          paddingBottom: Platform.OS === "ios" ? 0 : 10,
        },
        tabBarItemStyle: {
          height: 50,
          marginTop: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="light"
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.4)",
            }}
          />
        ),
        tabBarActiveTintColor: "#E8622A",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: "Szukaj",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved/index"
        options={{
          title: "Ulubione",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved/[name]/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
