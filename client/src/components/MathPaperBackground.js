import { StyleSheet, View, useWindowDimensions } from "react-native";
import { getCellSize } from "./Grid";
import { MATH_PAPER_BG, GRID_LINE_COLOR } from "../constants";

export default function MathPaperBackground({ gridSize }) {
  const { width, height } = useWindowDimensions();
  const spacing = getCellSize(gridSize);
  const vCount = Math.ceil(width / spacing) + 1;
  const hCount = Math.ceil(height / spacing) + 1;
  return (
    <View
      style={[
        styles.root,
        { width, height, backgroundColor: MATH_PAPER_BG },
      ]}
      pointerEvents="none"
    >
      {Array.from({ length: vCount }, (_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.line,
            { left: i * spacing, width: 1, height },
          ]}
        />
      ))}
      {Array.from({ length: hCount }, (_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.line,
            { top: i * spacing, height: 1, width },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0 },
  line: {
    position: "absolute",
    backgroundColor: GRID_LINE_COLOR,
  },
});
