import { View, Text, StyleSheet } from "react-native";

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
