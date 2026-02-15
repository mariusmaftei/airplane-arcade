import { StyleSheet, View, ImageBackground } from "react-native";
import { MAP_OPTIONS, MATH_PAPER_BG, GRID_LINE_COLOR } from "../constants/constants";

export default function BoardPreview({ gridSize, mapId, size = 160 }) {
  const mapOption = MAP_OPTIONS.find((m) => m.id === mapId);
  const cellSize = Math.floor(size / gridSize);
  const gridWidth = cellSize * gridSize;

  const gridLines = (
    <View style={[styles.gridWrap, { width: gridWidth, height: gridWidth }]}>
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.gridLine,
            styles.gridLineV,
            {
              left: i * cellSize,
              height: gridWidth,
            },
          ]}
        />
      ))}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.gridLine,
            styles.gridLineH,
            {
              top: i * cellSize,
              width: gridWidth,
            },
          ]}
        />
      ))}
    </View>
  );

  if (mapId === "default" || !mapOption?.image) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, backgroundColor: MATH_PAPER_BG },
        ]}
      >
        {gridLines}
      </View>
    );
  }

  return (
    <ImageBackground
      source={mapOption.image}
      style={[styles.container, { width: size, height: size }]}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      {gridLines}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {},
  gridWrap: {
    position: "absolute",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: GRID_LINE_COLOR,
  },
  gridLineV: {
    width: 1,
  },
  gridLineH: {
    height: 1,
  },
});
