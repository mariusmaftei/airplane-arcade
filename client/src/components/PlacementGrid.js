import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
} from "react-native";
import {
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { useMemo, useRef, useEffect, useCallback } from "react";
import {
  UI_BODY,
  UI_INPUT_BORDER,
  UI_UNSELECTED_BG,
  UI_SUCCESS,
  UI_DANGER,
  UI_WHITE,
} from "../constants/constants";

const MIN_CELL = 24;
const MAX_CELL = 40;
const HORIZONTAL_PADDING = 32;
export const PLACEMENT_LABEL_WIDTH = 20;
const LABEL_WIDTH = PLACEMENT_LABEL_WIDTH;

export function getPlacementCellSize(gridSize) {
  const { width } = Dimensions.get("window");
  const maxGrid = width - HORIZONTAL_PADDING * 2 - PLACEMENT_LABEL_WIDTH;
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

function getCellPlacementState(
  placedPlanes,
  previewCells,
  row,
  col,
  movingPlaneIndex,
) {
  for (let i = 0; i < placedPlanes.length; i++) {
    const p = placedPlanes[i];
    if (p?.cells?.some((c) => c.row === row && c.col === col)) {
      if (i === movingPlaneIndex) return { type: "preview" };
      return { type: "plane", index: i };
    }
  }
  if (previewCells?.some((c) => c.row === row && c.col === col))
    return { type: "preview" };
  return { type: "empty" };
}

const PLANE_COLORS = ["#5c6bc0", "#43a047", "#fb8c00"];

function coordsToCellFromLocal(locationX, locationY, cellSize, labelWidth, gridSize) {
  const col = Math.floor((locationX - labelWidth) / cellSize);
  const row = Math.floor((locationY - cellSize) / cellSize);
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
  return { row, col };
}

function coordsToCellFromPage(pageX, pageY, gridLayout, cellSize, labelWidth, gridSize) {
  if (!gridLayout) return null;
  const localX = pageX - gridLayout.x;
  const localY = pageY - gridLayout.y;
  return coordsToCellFromLocal(localX, localY, cellSize, labelWidth, gridSize);
}

function getCellSize(gridSize) {
  return getPlacementCellSize(gridSize);
}

export default function PlacementGrid({
  gridSize,
  placedPlanes = [],
  previewCells = null,
  previewValid = false,
  movingPlaneIndex = null,
  gridContainerRef,
  dockDragging = false,
  onCellPress,
  onDragStart,
  onDragMove,
  onStartMovePlane,
  onDragEnd,
  onDragActiveChange,
  mapBackground = false,
}) {
  const cellSize = getCellSize(gridSize);
  const labelFontSize = Math.max(10, Math.min(14, cellSize - 4));
  const gridLayoutRef = useRef(null);
  const gridViewRef = useRef(null);

  const pendingGrantRef = useRef(false);

  const pageToCell = useCallback(
    (pageX, pageY) => {
      const layout = gridLayoutRef.current;
      if (!layout) return null;
      return coordsToCellFromPage(
        pageX,
        pageY,
        layout,
        cellSize,
        LABEL_WIDTH,
        gridSize,
      );
    },
    [cellSize, gridSize],
  );

  const handlePanStateChange = useCallback(
    (evt) => {
      const ne = evt?.nativeEvent;
      if (!ne || ne.state == null) return;
      const state = ne.state;
      if (state === State.ACTIVE) {
        if (onDragActiveChange) onDragActiveChange(true);
        const ax = ne.absoluteX;
        const ay = ne.absoluteY;
        if (typeof ax === "number" && typeof ay === "number") {
          const cell = pageToCell(ax, ay);
          if (cell) {
            const stateObj = getCellPlacementState(
              placedPlanes,
              previewCells,
              cell.row,
              cell.col,
              movingPlaneIndex,
            );
            if (stateObj.type === "plane" && onStartMovePlane) {
              const plane = placedPlanes[stateObj.index];
              if (plane?.head)
                onStartMovePlane(stateObj.index, plane.head.row, plane.head.col);
            } else if (onDragStart) {
              onDragStart(cell.row, cell.col);
            }
          }
        } else {
          pendingGrantRef.current = true;
        }
      } else if (state === State.END || state === State.CANCELLED) {
        pendingGrantRef.current = false;
        if (onDragEnd) onDragEnd();
        if (onDragActiveChange) onDragActiveChange(false);
      }
    },
    [
      placedPlanes,
      previewCells,
      movingPlaneIndex,
      onDragStart,
      onStartMovePlane,
      onDragEnd,
      onDragActiveChange,
      pageToCell,
    ],
  );

  const handlePanGesture = useCallback(
    (evt) => {
      const ne = evt?.nativeEvent;
      if (!ne || typeof ne.absoluteX !== "number" || typeof ne.absoluteY !== "number")
        return;
      const cell = pageToCell(ne.absoluteX, ne.absoluteY);
      if (pendingGrantRef.current && cell) {
        pendingGrantRef.current = false;
        const stateObj = getCellPlacementState(
          placedPlanes,
          previewCells,
          cell.row,
          cell.col,
          movingPlaneIndex,
        );
        if (stateObj.type === "plane" && onStartMovePlane) {
          const plane = placedPlanes[stateObj.index];
          if (plane?.head)
            onStartMovePlane(stateObj.index, plane.head.row, plane.head.col);
        } else if (onDragStart) {
          onDragStart(cell.row, cell.col);
        }
      }
      if (cell && onDragMove) onDragMove(cell.row, cell.col);
    },
    [
      pageToCell,
      onDragMove,
      placedPlanes,
      previewCells,
      movingPlaneIndex,
      onDragStart,
      onStartMovePlane,
    ],
  );

  const headerRow = (
    <View key="header" style={styles.row} pointerEvents="box-none">
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
      const state = getCellPlacementState(
        placedPlanes,
        previewCells,
        r,
        c,
        movingPlaneIndex,
      );
      let cellStyle = [styles.cell, { width: cellSize, height: cellSize }];
      if (state.type === "plane")
        cellStyle.push(styles.cellPlane, {
          backgroundColor: PLANE_COLORS[state.index % PLANE_COLORS.length],
        });
      else if (state.type === "preview")
        cellStyle.push(
          previewValid ? styles.cellPreviewValid : styles.cellPreviewInvalid,
        );
      else if (mapBackground) cellStyle.push(styles.cellOverMap);
      if (state.type === "plane" && onStartMovePlane) {
        const plane = placedPlanes[state.index];
        cells.push(
          <Pressable
            key={`${r}-${c}`}
            style={({ pressed }) => [
              cellStyle,
              pressed && styles.cellPressed,
            ]}
            onPressIn={() => {
              if (plane?.head)
                onStartMovePlane(state.index, plane.head.row, plane.head.col);
            }}
          >
            <Text
              style={[
                styles.cellText,
                { fontSize: Math.max(10, cellSize - 6) },
                styles.cellTextFilled,
              ]}
            >
              {""}
            </Text>
          </Pressable>,
        );
      } else {
        const handlePress = onCellPress
          ? () => onCellPress(r, c)
          : undefined;
        cells.push(
          <Pressable
            key={`${r}-${c}`}
            style={({ pressed }) => [
              cellStyle,
              pressed && styles.cellPressed,
            ]}
            onPressIn={handlePress}
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
    }
    rows.push(
      <View key={r} style={styles.row} pointerEvents="box-none">
        {cells}
      </View>,
    );
  }
  const hasDrag =
    !dockDragging &&
    (onDragStart || onDragMove || onStartMovePlane || onDragActiveChange);

  const measureGrid = useMemo(
    () => () => {
      const node = gridViewRef.current ?? gridContainerRef?.current;
      node?.measureInWindow((x, y, w, h) => {
        gridLayoutRef.current = { x, y, w: w || 0, h: h || 0 };
      });
    },
    [gridContainerRef],
  );

  useEffect(() => {
    if (!gridContainerRef || !hasDrag) return;
    const id = setTimeout(measureGrid, 50);
    return () => clearTimeout(id);
  }, [gridContainerRef, hasDrag, measureGrid]);

  const gridContent = (
    <View
      ref={gridViewRef}
      style={styles.grid}
      collapsable={false}
      onLayout={hasDrag ? measureGrid : undefined}
    >
      {rows}
    </View>
  );

  if (!hasDrag) return gridContent;

  return (
    <PanGestureHandler
      minDist={0}
      onHandlerStateChange={handlePanStateChange}
      onGestureEvent={handlePanGesture}
    >
      {gridContent}
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  grid: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  labelCell: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: { fontWeight: "600", color: UI_BODY },
  cell: {
    borderWidth: 1,
    borderColor: UI_INPUT_BORDER,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_UNSELECTED_BG,
  },
  cellPlane: {
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  cellOverMap: { backgroundColor: "rgba(255,255,255,0.15)" },
  cellPreviewValid: {
    backgroundColor: "rgba(46, 125, 50, 0.85)",
    borderColor: UI_SUCCESS,
    borderWidth: 2,
  },
  cellPreviewInvalid: {
    backgroundColor: "rgba(211, 47, 47, 0.85)",
    borderColor: UI_DANGER,
    borderWidth: 2,
  },
  cellText: {},
  cellTextFilled: { color: UI_WHITE },
  cellPressed: { opacity: 0.7 },
});
