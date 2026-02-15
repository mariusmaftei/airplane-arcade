import { useMemo } from "react";
import { StyleSheet, View, Text, PanResponder } from "react-native";
import { PLANE_SHAPE, getShapeCells } from "../utils/planeShape";
import { getPlacementCellSize, PLACEMENT_LABEL_WIDTH } from "./PlacementGrid";
import { UI_BODY_MUTED } from "../constants/constants";

const DOCK_PIVOTS = [
  { row: 2, col: 1 },
  { row: 3, col: 3 },
  { row: 2, col: 3 },
  { row: 2, col: 2 },
];

const DOCK_GRID_SIZE = 6;
const DOCK_CELL_PX = 16;
const SHADOW_SIZE = 96;
const SHADOW_CELL = SHADOW_SIZE / DOCK_GRID_SIZE;

export function DockDragShadow({ pageX, pageY, rotation, planeColor }) {
  const shapeCells = useMemo(() => {
    const pivot = DOCK_PIVOTS[rotation] ?? DOCK_PIVOTS[0];
    return (
      getShapeCells(
        PLANE_SHAPE,
        pivot.row,
        pivot.col,
        rotation,
        DOCK_GRID_SIZE,
      ) || []
    );
  }, [rotation]);
  const grid = [];
  for (let r = 0; r < DOCK_GRID_SIZE; r++) {
    for (let c = 0; c < DOCK_GRID_SIZE; c++) {
      const filled = shapeCells.some(
        (cell) => cell.row === r && cell.col === c,
      );
      grid.push(
        <View
          key={`${r}-${c}`}
          style={[
            styles.shadowCell,
            { width: SHADOW_CELL, height: SHADOW_CELL },
            filled && { backgroundColor: planeColor },
          ]}
        />,
      );
    }
  }
  return (
    <View
      style={[
        styles.shadowWrap,
        {
          left: pageX - SHADOW_SIZE / 2,
          top: pageY - SHADOW_SIZE / 2,
          width: SHADOW_SIZE,
          height: SHADOW_SIZE,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.shadowGrid}>{grid}</View>
    </View>
  );
}

export default function PlaneDock({
  placementRotation,
  placementGridSize,
  gridWidth,
  boardWidth,
  gridContainerRef,
  onPreviewChange,
  onDragActiveChange,
  onDockDragPosition,
  isDraggingFromDock = false,
  isCurrentPlanePlaced = false,
  planeNumber = 1,
  planeColor = "#5c6bc0",
}) {
  const dockShapeCells = useMemo(() => {
    const pivot = DOCK_PIVOTS[placementRotation] ?? DOCK_PIVOTS[0];
    return (
      getShapeCells(
        PLANE_SHAPE,
        pivot.row,
        pivot.col,
        placementRotation,
        DOCK_GRID_SIZE,
      ) || []
    );
  }, [placementRotation]);

  const pageToGridCell = (pageX, pageY) => {
    if (!gridContainerRef?.current) return null;
    gridContainerRef.current.measureInWindow((gx, gy, gw, gh) => {
      const localX = pageX - gx;
      const localY = pageY - gy;
      const cellSize = getPlacementCellSize(placementGridSize);
      const col = Math.floor((localX - PLACEMENT_LABEL_WIDTH) / cellSize);
      const row = Math.floor((localY - cellSize) / cellSize);
      if (
        row >= 0 &&
        row < placementGridSize &&
        col >= 0 &&
        col < placementGridSize
      ) {
        onPreviewChange({ row, col });
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          if (onDragActiveChange) onDragActiveChange(true);
          if (onDockDragPosition) onDockDragPosition({ pageX, pageY });
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          pageToGridCell(pageX, pageY);
          if (onDockDragPosition) onDockDragPosition({ pageX, pageY });
        },
        onPanResponderRelease: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          pageToGridCell(pageX, pageY);
          if (onDockDragPosition) onDockDragPosition(null);
          if (onDragActiveChange) onDragActiveChange(false);
        },
        onPanResponderTerminate: () => {
          if (onDockDragPosition) onDockDragPosition(null);
          if (onDragActiveChange) onDragActiveChange(false);
        },
      }),
    [
      placementGridSize,
      onPreviewChange,
      onDragActiveChange,
      onDockDragPosition,
      gridContainerRef,
    ],
  );

  const grid = [];
  const showPlane = !isCurrentPlanePlaced;
  for (let r = 0; r < DOCK_GRID_SIZE; r++) {
    for (let c = 0; c < DOCK_GRID_SIZE; c++) {
      const filled =
        showPlane &&
        dockShapeCells.some((cell) => cell.row === r && cell.col === c);
      grid.push(
        <View
          key={`${r}-${c}`}
          style={[
            styles.cell,
            { width: DOCK_CELL_PX, height: DOCK_CELL_PX },
            filled && { backgroundColor: planeColor },
          ]}
        />,
      );
    }
  }

  const previewSize = DOCK_GRID_SIZE * DOCK_CELL_PX;
  const previewWidth = gridWidth != null ? gridWidth : boardWidth;
  const alignWithGrid = gridWidth != null;
  return (
    <View
      style={styles.root}
      {...(!isCurrentPlanePlaced ? panResponder.panHandlers : {})}
    >
      {!isCurrentPlanePlaced && (
        <Text style={styles.hint}>Drag plane onto board below</Text>
      )}
      <View
        style={[
          styles.preview,
          previewWidth != null && { width: previewWidth },
          alignWithGrid && styles.previewAlignGrid,
        ]}
      >
        {isCurrentPlanePlaced ? (
          <Text style={styles.placedText}>Plane {planeNumber} Placed</Text>
        ) : (
          <View
            style={[
              styles.grid,
              { width: previewSize, height: previewSize },
              isDraggingFromDock && styles.dockHidden,
            ]}
          >
            {grid}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_BODY_MUTED,
    marginBottom: 8,
  },
  placedText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_BODY_MUTED,
  },
  preview: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewAlignGrid: {
    alignSelf: "flex-end",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  dockHidden: {
    opacity: 0,
  },
  shadowWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  shadowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: SHADOW_SIZE,
    height: SHADOW_SIZE,
  },
  shadowCell: {
    backgroundColor: "transparent",
  },
});
