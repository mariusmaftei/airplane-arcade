import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Dimensions,
  PanResponder,
} from "react-native";
import { useMemo } from "react";

const MIN_CELL = 24;
const MAX_CELL = 40;
const HORIZONTAL_PADDING = 32;
const LABEL_WIDTH = 20;

function getCellSize(gridSize) {
  const { width } = Dimensions.get("window");
  const maxGrid = width - HORIZONTAL_PADDING * 2 - LABEL_WIDTH;
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

function getCellPlacementState(placedPlanes, previewCells, row, col) {
  for (let i = 0; i < placedPlanes.length; i++) {
    const p = placedPlanes[i];
    if (p?.cells?.some((c) => c.row === row && c.col === col))
      return { type: "plane", index: i };
  }
  if (previewCells?.some((c) => c.row === row && c.col === col))
    return { type: "preview" };
  return { type: "empty" };
}

const PLANE_COLORS = ["#5c6bc0", "#43a047", "#fb8c00"];

function coordsToCell(locationX, locationY, cellSize, labelWidth, gridSize) {
  const col = Math.floor((locationX - labelWidth) / cellSize);
  const row = Math.floor((locationY - cellSize) / cellSize);
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
  return { row, col };
}

export default function PlacementGrid({
  gridSize,
  placedPlanes = [],
  previewCells = null,
  previewValid = false,
  onCellPress,
  onDragStart,
  onDragMove,
  mapBackground = false,
}) {
  const cellSize = getCellSize(gridSize);
  const labelFontSize = Math.max(10, Math.min(14, cellSize - 4));

  const getCellFromEvent = (evt) => {
    const native = evt?.nativeEvent;
    if (
      native == null ||
      typeof native.locationX !== "number" ||
      typeof native.locationY !== "number"
    )
      return null;
    return coordsToCell(
      native.locationX,
      native.locationY,
      cellSize,
      LABEL_WIDTH,
      gridSize,
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (_, evt) => {
          const cell = getCellFromEvent(evt);
          return cell !== null;
        },
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, evt) => {
          const cell = getCellFromEvent(evt);
          if (cell && onDragStart) onDragStart(cell.row, cell.col);
        },
        onPanResponderMove: (_, evt) => {
          const cell = getCellFromEvent(evt);
          if (cell && onDragMove) onDragMove(cell.row, cell.col);
        },
        onPanResponderRelease: () => {},
      }),
    [gridSize, cellSize, onDragStart, onDragMove],
  );

  const headerRow = (
    <View key="header" style={styles.row}>
      <View
        style={[styles.labelCell, { width: LABEL_WIDTH, height: cellSize }]}
      />
      {Array.from({ length: gridSize }, (_, c) => (
        <View
          key={`col-${c}`}
          style={[styles.labelCell, { width: cellSize, height: cellSize }]}
        >
          <Text style={[styles.labelText, { fontSize: labelFontSize }]}>
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
        style={[styles.labelCell, { width: LABEL_WIDTH, height: cellSize }]}
      >
        <Text style={[styles.labelText, { fontSize: labelFontSize }]}>
          {r + 1}
        </Text>
      </View>,
    );
    for (let c = 0; c < gridSize; c++) {
      const state = getCellPlacementState(placedPlanes, previewCells, r, c);
      let cellStyle = [styles.cell, { width: cellSize, height: cellSize }];
      if (state.type === "plane")
        cellStyle.push({
          backgroundColor: PLANE_COLORS[state.index % PLANE_COLORS.length],
        });
      else if (state.type === "preview")
        cellStyle.push(
          previewValid ? styles.cellPreviewValid : styles.cellPreviewInvalid,
        );
      else if (mapBackground) cellStyle.push(styles.cellOverMap);
      cells.push(
        <Pressable
          key={`${r}-${c}`}
          style={cellStyle}
          onPress={() => onCellPress(r, c)}
        >
          <Text
            style={[
              styles.cellText,
              { fontSize: Math.max(10, cellSize - 6) },
              state.type !== "empty" && styles.cellTextFilled,
            ]}
          >
            {""}
          </Text>
        </Pressable>,
      );
    }
    rows.push(
      <View key={r} style={styles.row}>
        {cells}
      </View>,
    );
  }
  return (
    <View
      style={styles.grid}
      {...(onDragStart || onDragMove ? panResponder.panHandlers : {})}
    >
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  labelCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: { fontWeight: "600", color: "#333" },
  cell: {
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e8f0",
  },
  cellOverMap: { backgroundColor: "rgba(255,255,255,0.15)" },
  cellPreviewValid: {
    backgroundColor: "rgba(46, 125, 50, 0.7)",
    borderColor: "#2e7d32",
  },
  cellPreviewInvalid: {
    backgroundColor: "rgba(211, 47, 47, 0.7)",
    borderColor: "#c62828",
  },
  cellText: {},
  cellTextFilled: { color: "#fff" },
});
