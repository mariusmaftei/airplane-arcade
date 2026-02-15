import { StyleSheet, View, Text, Image } from "react-native";
import SoundPressable from "../components/SoundPressable";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  INTRO_IMAGE,
  UI_PRIMARY,
  UI_WHITE,
  UI_BODY,
  UI_BODY_MUTED,
  UI_PAGE_BG,
} from "../constants/constants";

export default function IntroScreen({ onBegin }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: 24 + insets.top,
          paddingBottom: 24 + insets.bottom,
          paddingLeft: 24 + insets.left,
          paddingRight: 24 + insets.right,
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.content}>
        {INTRO_IMAGE && (
          <Image source={INTRO_IMAGE} style={styles.image} resizeMode="contain" />
        )}
        <Text style={styles.title}>Airplane Arcade</Text>
        <Text style={styles.tagline}>Find and destroy the hidden planes</Text>
        <SoundPressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onBegin}
        >
          <Text style={styles.buttonText}>Press to Begin</Text>
        </SoundPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_PAGE_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 32,
    alignSelf: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: UI_BODY,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 15,
    color: UI_BODY_MUTED,
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: UI_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: UI_WHITE,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
