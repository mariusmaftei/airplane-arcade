import { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { PLANE_SHAPE, getShapeCells } from "../utils/planeShape";
import { getPlacementCellSize } from "./PlacementGrid";
import { UI_BODY_MUTED } from "../constants/constants";

const DOCK_PIVOTS = [
  { row: 2, col: 1 },
  { row: 3, col: 3 },
  { row: 2, col: 3 },
  { row: 2, col: 2 },
];

const DOCK_GRID_SIZE = 6;
const DOCK_CELL_PX = 16;
const SHADOW_GRID_SIZE = 6;

export function DockDragShadow({
  pageX,
  pageY,
  rotation,
  planeColor,
  placementGridSize = 10,
}) {
  const cellSize = getPlacementCellSize(placementGridSize);
  const shadowSize = SHADOW_GRID_SIZE * cellSize;
  const shapeCells = useMemo(() => {
    const pivot = DOCK_PIVOTS[rotation] ?? DOCK_PIVOTS[0];
    return (
      getShapeCells(
        PLANE_SHAPE,
        pivot.row,
        pivot.col,
        rotation,
        SHADOW_GRID_SIZE,
      ) || []
    );
  }, [rotation]);
  const grid = [];
  for (let r = 0; r < SHADOW_GRID_SIZE; r++) {
    for (let c = 0; c < SHADOW_GRID_SIZE; c++) {
      const filled = shapeCells.some(
        (cell) => cell.row === r && cell.col === c,
      );
      grid.push(
        <View
          key={`${r}-${c}`}
          style={[
            styles.shadowCell,
            { width: cellSize, height: cellSize },
            filled && {
              backgroundColor: planeColor,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.15)",
            },
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
          left: pageX - shadowSize / 2,
          top: pageY - shadowSize / 2,
          width: shadowSize,
          height: shadowSize,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.shadowGrid, { width: shadowSize, height: shadowSize }]}>
        {grid}
      </View>
    </View>
  );
}

export default function PlaneDock({
  placementRotation,
  placementGridSize,
  gridWidth,
  boardWidth,
  gridContainerRef,
  dockPlaneRef,
  placedPlanes = [],
  selectedPlaneIndex = 0,
  hasActivePreview = false,
  onPreviewChange,
  onDragActiveChange,
  onDockDragPosition,
  onDockDragEnd,
  draggingPlaneIndex = null,
  planeColors = ["#5c6bc0", "#43a047", "#fb8c00"],
}) {
  const isCurrentPlanePlaced = !!placedPlanes[selectedPlaneIndex];

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

  const previewSize = DOCK_GRID_SIZE * DOCK_CELL_PX;
  const planeColor = planeColors[selectedPlaneIndex % planeColors.length];
  const isDragging = draggingPlaneIndex === selectedPlaneIndex;
  const grid = [];
  for (let r = 0; r < DOCK_GRID_SIZE; r++) {
    for (let c = 0; c < DOCK_GRID_SIZE; c++) {
      const filled =
        !isCurrentPlanePlaced &&
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

  return (
    <View style={styles.root}>
      {isCurrentPlanePlaced ? (
        <>
          <Text style={styles.placedLabel}>
            Plane {selectedPlaneIndex + 1} placed
          </Text>
          <Text style={styles.placedHint}>
            Select another tab or tap Clear to move it back
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            {hasActivePreview
              ? "Adjust position on board below, then press Confirm"
              : `Plane ${selectedPlaneIndex + 1} — drag onto board below`}
          </Text>
          {hasActivePreview ? (
            <View
              style={[
                styles.planeWrap,
                { width: previewSize, height: previewSize },
                styles.planeWrapDisabled,
              ]}
            >
              <View
                style={[
                  styles.grid,
                  { width: previewSize, height: previewSize },
                ]}
              >
                {grid}
              </View>
            </View>
          ) : (
            <View
              ref={dockPlaneRef}
              style={[
                styles.planeWrap,
                { width: previewSize, height: previewSize },
              ]}
            >
              <View
                style={[
                  styles.grid,
                  { width: previewSize, height: previewSize },
                  isDragging && styles.dockHidden,
                ]}
              >
                {grid}
              </View>
            </View>
          )}
        </>
      )}
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
  placedLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_BODY_MUTED,
  },
  placedHint: {
    fontSize: 12,
    color: UI_BODY_MUTED,
    marginTop: 4,
    opacity: 0.9,
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
  planeWrap: {
    padding: 8,
    borderRadius: 8,
  },
  planeWrapDisabled: {
    opacity: 0.6,
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
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  shadowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  shadowCell: {
    backgroundColor: "transparent",
  },
});
