import { useEffect } from "react";
import { Text } from "react-native";
import { Stack } from "expo-router";
import { Amplify } from "aws-amplify";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import amplifyConfig from "@/amplify-config";

Amplify.configure(amplifyConfig);
SplashScreen.preventAutoHideAsync();

const defaultTextStyle = Text as any;
const originalDefaultProps = defaultTextStyle.defaultProps;
defaultTextStyle.defaultProps = {
  ...originalDefaultProps,
  style: [{ fontFamily: "DMSans_400Regular" }, originalDefaultProps?.style],
};

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular: DMSans_400Regular,
    DMSans_500Medium: DMSans_500Medium,
    DMSans_600SemiBold: DMSans_600SemiBold,
    DMSans_700Bold: DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
