import { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

const FRAMES = [
  require("../../assets/iamges/effects/explosion-1.png"),
  require("../../assets/iamges/effects/explosion-2.png"),
  require("../../assets/iamges/effects/explosion-3.png"),
  require("../../assets/iamges/effects/explosion-4.png"),
  require("../../assets/iamges/effects/explosion-5.png"),
];

const FRAME_MS = 80;

export default function ExplosionEffect({ size, onComplete }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frame >= FRAMES.length - 1) {
      const t = setTimeout(() => onComplete?.(), FRAME_MS);
      return () => clearTimeout(t);
    }
    const t = setInterval(
      () => setFrame((f) => Math.min(f + 1, FRAMES.length - 1)),
      FRAME_MS,
    );
    return () => clearInterval(t);
  }, [frame, onComplete]);

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
