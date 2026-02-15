import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Image,
  Dimensions,
} from "react-native";
import ExplosionEffect from "./ExplosionEffect";
import SmokeEffect from "./SmokeEffect";
import { UI_BODY, UI_INPUT_BORDER, UI_UNSELECTED_BG } from "../constants/constants";

const AIM_IMAGE = require("../../assets/images/effects/aim.png");

const MIN_CELL = 24;
const MAX_CELL = 40;
const HORIZONTAL_PADDING = 32;

function getCellState(hits, misses, revealedCells, row, col) {
  if (hits.some((h) => h.row === row && h.col === col)) return "hit";
  if (misses.some((m) => m.row === row && m.col === col)) return "miss";
  if (revealedCells?.some((c) => c.row === row && c.col === col))
    return "revealed";
  return "empty";
}

export function getCellSize(gridSize) {
  const { width } = Dimensions.get("window");
  const labelWidth = 20;
  const maxGrid = width - HORIZONTAL_PADDING * 2 - labelWidth;
  const size = Math.floor(maxGrid / gridSize);
  return Math.min(MAX_CELL, Math.max(MIN_CELL, size));
}

function colToLetter(col) {
  let s = "";
  let n = col;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

const LABEL_BLUE = "#1565c0";

export default function Grid({
  gridSize,
  hits,
  misses,
  revealedCells,
  onCellPress,
  disabled,
  mapBackground = false,
  defaultMap = false,
  highlightCell = null,
  explodingCell = null,
  smokeCell = null,
}) {
  const cellSize = getCellSize(gridSize);
  const labelWidth = 20;
  const labelFontSize = Math.max(10, Math.min(14, cellSize - 4));
  const cellStyles = mapBackground ? stylesMap : styles;
  const labelColor = defaultMap ? LABEL_BLUE : undefined;

  const headerRow = (
    <View key="header" style={styles.row}>
      <View
        style={[styles.labelCell, { width: labelWidth, height: cellSize }]}
      />
      {Array.from({ length: gridSize }, (_, c) => (
        <View
          key={`col-${c}`}
          style={[styles.labelCell, { width: cellSize, height: cellSize }]}
        >
          <Text
            style={[
              styles.labelText,
              { fontSize: labelFontSize },
              labelColor && { color: labelColor },
            ]}
          >
            {colToLetter(c)}
          </Text>
        </View>
      ))}
    </View>
  );

  const rows = [headerRow];
  for (let r = 0; r < gridSize; r++) {
    const cells = [];
    cells.push(
      <View
        key="row-label"
        style={[styles.labelCell, { width: labelWidth, height: cellSize }]}
      >
        <Text
          style={[
            styles.labelText,
            { fontSize: labelFontSize },
            labelColor && { color: labelColor },
          ]}
        >
          {r + 1}
        </Text>
      </View>,
    );
    for (let c = 0; c < gridSize; c++) {
      const state = getCellState(hits, misses, revealedCells, r, c);
      const isShot = state !== "empty" && state !== "revealed";
      const isHighlighted =
        highlightCell && highlightCell.row === r && highlightCell.col === c;
      const isExploding =
        explodingCell &&
        state === "hit" &&
        explodingCell.row === r &&
        explodingCell.col === c;
      const isSmoke =
        smokeCell &&
        state === "miss" &&
        smokeCell.row === r &&
        smokeCell.col === c;
      cells.push(
        <Pressable
          key={`${r}-${c}`}
          style={[
            cellStyles.cell,
            { width: cellSize, height: cellSize },
            defaultMap && { borderColor: LABEL_BLUE },
            state === "hit" && !isExploding && cellStyles.cellHit,
            state === "miss" && cellStyles.cellMiss,
            state === "revealed" && cellStyles.cellRevealed,
            defaultMap && state === "revealed" && { borderColor: LABEL_BLUE },
          ]}
          onPress={() => !disabled && !isShot && onCellPress(r, c)}
          disabled={disabled || isShot}
        >
          {isExploding ? (
            <ExplosionEffect size={cellSize} />
          ) : isSmoke ? (
            <SmokeEffect size={cellSize} />
          ) : isHighlighted && AIM_IMAGE ? (
            <Image
              source={AIM_IMAGE}
              style={[styles.aimImage, { width: cellSize, height: cellSize }]}
              resizeMode="contain"
            />
          ) : (
            <Text
              style={[
                styles.cellText,
                { fontSize: Math.max(10, cellSize - 6) },
              ]}
            >
              {""}
            </Text>
          )}
        </Pressable>,
      );
    }
    rows.push(
      <View key={r} style={styles.row}>
        {cells}
      </View>,
    );
  }
  return <View style={styles.grid}>{rows}</View>;
}

const styles = StyleSheet.create({
  grid: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  labelCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: {
    fontWeight: "600",
    color: UI_BODY,
  },
  cell: {
    borderWidth: 1,
    borderColor: UI_INPUT_BORDER,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_UNSELECTED_BG,
  },
  cellHit: { backgroundColor: "#e57373" },
  cellMiss: { backgroundColor: "#b0bec5" },
  cellRevealed: { backgroundColor: "#90a4ae", borderColor: "#546e7a" },
  cellText: {},
  aimImage: {},
});

const stylesMap = StyleSheet.create({
  ...styles,
  cell: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cellHit: { backgroundColor: "rgba(229, 115, 115, 0.85)" },
  cellMiss: { backgroundColor: "rgba(176, 190, 197, 0.85)" },
  cellRevealed: {
    backgroundColor: "rgba(144, 164, 174, 0.85)",
    borderColor: "rgba(84, 110, 122, 0.9)",
  },
});
