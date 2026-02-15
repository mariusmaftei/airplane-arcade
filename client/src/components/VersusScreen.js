import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { UI_PRIMARY } from "../constants/constants";

const STROKE_OFFSETS = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -2 },
  { x: 0, y: 2 },
  { x: -2, y: -2 },
  { x: -2, y: 2 },
  { x: 2, y: -2 },
  { x: 2, y: 2 },
];

function StrokeText({
  children,
  strokeColor = UI_PRIMARY,
  fillColor = "#fff",
  style,
  numberOfLines,
}) {
  return (
    <View style={styles.strokeWrap}>
      {STROKE_OFFSETS.map((o, i) => (
        <Text
          key={i}
          numberOfLines={numberOfLines}
          style={[
            style,
            styles.strokeLayer,
            {
              color: strokeColor,
              transform: [{ translateX: o.x }, { translateY: o.y }],
            },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text
        numberOfLines={numberOfLines}
        style={[style, styles.fillLayer, { color: fillColor }]}
      >
        {children}
      </Text>
    </View>
  );
}

export default function VersusScreen({ leftName, rightName, mapImage }) {
  const content = (
    <View style={styles.whiteBox}>
      <View style={styles.row}>
        <View style={styles.nameSide}>
          <StrokeText style={styles.name} numberOfLines={1}>
            {leftName}
          </StrokeText>
        </View>
        <View style={styles.vsCenter} pointerEvents="none">
          <StrokeText style={styles.vsText}>VS</StrokeText>
        </View>
        <View style={[styles.nameSide, styles.nameSideRight]}>
          <StrokeText style={[styles.name, styles.nameRight]} numberOfLines={1}>
            {rightName}
          </StrokeText>
        </View>
      </View>
    </View>
  );
  if (mapImage) {
    return (
      <ImageBackground
        source={mapImage}
        style={[styles.container, styles.containerWithMap]}
      >
        {content}
      </ImageBackground>
    );
  }
  return (
    <View style={[styles.container, styles.containerDefault]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_PRIMARY,
  },
  containerWithMap: {
    backgroundColor: "transparent",
  },
  containerDefault: {
    backgroundColor: "transparent",
  },
  whiteBox: {
    backgroundColor: "transparent",
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  nameSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    minWidth: 0,
    paddingHorizontal: 12,
  },
  nameSideRight: {
    alignItems: "flex-end",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
  },
  nameRight: {
    textAlign: "right",
  },
  vsCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  vsText: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 4,
  },
  strokeWrap: {
    position: "relative",
  },
  strokeLayer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  fillLayer: {
    zIndex: 1,
  },
});
