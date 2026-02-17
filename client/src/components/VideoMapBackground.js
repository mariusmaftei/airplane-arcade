import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Platform } from "react-native";

export default function VideoMapBackground({ source, style, children }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.5;
    p.play();
  });

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        surfaceType={Platform.OS === "android" ? "textureView" : undefined}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
});
