import { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

const FRAMES = [
  require("../../assets/iamges/effects/smoke-1.png"),
  require("../../assets/iamges/effects/smoke-2.png"),
  require("../../assets/iamges/effects/smoke-3.png"),
  require("../../assets/iamges/effects/smoke-4.png"),
  require("../../assets/iamges/effects/smoke-5.png"),
];

const FRAME_MS = 100;

export default function SmokeEffect({ size }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frame >= FRAMES.length - 1) return;
    const t = setInterval(
      () => setFrame((f) => Math.min(f + 1, FRAMES.length - 1)),
      FRAME_MS,
    );
    return () => clearInterval(t);
  }, [frame]);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Image
        source={FRAMES[frame]}
        style={[styles.frame, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {},
});
