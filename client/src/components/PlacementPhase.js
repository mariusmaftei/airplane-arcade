import { useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Vibration,
} from "react-native";
import SoundPressable from "./SoundPressable";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import PlacementGrid from "./PlacementGrid";
import {
  getPlacementCellSize,
  PLACEMENT_LABEL_WIDTH,
} from "./PlacementGrid";
import PlaneDock from "./PlaneDock";
import {
  UI_PRIMARY,
  UI_WHITE,
  UI_BODY,
  UI_BODY_MUTED,
  UI_SUCCESS,
  UI_UNSELECTED_BG,
} from "../constants/constants";

const PLANE_COLORS = ["#5c6bc0", "#43a047", "#fb8c00"];

export default function PlacementPhase({
  selectedPlaneIndex,
  onSelectPlane,
  placedPlanes,
  placementRotation,
  onRotate,
  onClearPlane,
  previewAt,
  onPreviewChange,
  onConfirmPlace,
  onStartMovePlane,
  onDragEnd,
  onDragActiveChange,
  onDockDragPosition,
  onDockDragEnd,
  dockDragPosition,
  placementGridContainerRef,
  movingPlaneIndex = null,
  placementGridSize,
  placementPreviewCells,
  placementPreviewValid,
  allPlaced,
  onBack,
  onStartGame,
  loading,
}) {
  const internalGridRef = useRef(null);
  const gridContainerRef = placementGridContainerRef ?? internalGridRef;
  const dockPlaneRef = useRef(null);
  const dockDragStartedRef = useRef(false);
  const currentPlanePlaced = placedPlanes[selectedPlaneIndex];
  const placedCount = placedPlanes.filter(Boolean).length;
  const totalPlanes = placedPlanes.length;
  const boardCellSize = getPlacementCellSize(placementGridSize);
  const gridWidth = placementGridSize * boardCellSize;
  const boardWidth = PLACEMENT_LABEL_WIDTH + gridWidth;

  const checkTouchOnDockPlane = useCallback((pageX, pageY) => {
    return new Promise((resolve) => {
      if (!dockPlaneRef.current) {
        resolve(false);
        return;
      }
      dockPlaneRef.current.measureInWindow((x, y, w, h) => {
        const inside =
          pageX >= x &&
          pageX <= x + w &&
          pageY >= y &&
          pageY <= y + h;
        resolve(inside);
      });
    });
  }, []);

  const reportPosition = useCallback(
    (x, y) => {
      onDockDragPosition?.({
        pageX: x,
        pageY: y,
        planeIndex: selectedPlaneIndex,
      });
    },
    [onDockDragPosition, selectedPlaneIndex],
  );

  const handleDockGestureState = useCallback(
    async (evt) => {
      const ne = evt?.nativeEvent;
      if (!ne || ne.state == null) return;
      if (ne.state === State.ACTIVE) {
        const x = ne.absoluteX ?? ne.x;
        const y = ne.absoluteY ?? ne.y;
        const onDock = await checkTouchOnDockPlane(x, y);
        if (!onDock) return;
        dockDragStartedRef.current = true;
        Vibration.vibrate(30);
        onDragActiveChange?.(true);
        reportPosition(x, y);
      } else if (ne.state === State.END || ne.state === State.CANCELLED) {
        const started = dockDragStartedRef.current;
        dockDragStartedRef.current = false;
        if (!started) return;
        const x = ne.absoluteX ?? ne.x;
        const y = ne.absoluteY ?? ne.y;
        if (!gridContainerRef?.current) {
          onDockDragPosition?.(null);
          onDragActiveChange?.(false);
          onDockDragEnd?.(false, null);
          return;
        }
        gridContainerRef.current.measureInWindow((gx, gy, gw, gh) => {
          const px = typeof x === "number" ? x : 0;
          const py = typeof y === "number" ? y : 0;
          const wasOverGrid =
            px >= gx && px <= gx + gw && py >= gy && py <= gy + gh;
          let dropCell = null;
          if (wasOverGrid) {
            const cellSize = getPlacementCellSize(placementGridSize);
            const localX = px - gx;
            const localY = py - gy;
            const col = Math.floor(
              (localX - PLACEMENT_LABEL_WIDTH) / cellSize,
            );
            const row = Math.floor((localY - cellSize) / cellSize);
            if (
              row >= 0 &&
              row < placementGridSize &&
              col >= 0 &&
              col < placementGridSize
            ) {
              dropCell = { row, col };
            }
          }
          onDockDragPosition?.(null);
          onDragActiveChange?.(false);
          onDockDragEnd?.(wasOverGrid, dropCell);
        });
      }
    },
    [
      placementGridSize,
      checkTouchOnDockPlane,
      reportPosition,
      onDragActiveChange,
      onDockDragPosition,
      onDockDragEnd,
      gridContainerRef,
    ],
  );

  const handleDockGesture = useCallback(
    (evt) => {
      if (!dockDragStartedRef.current) return;
      const ne = evt?.nativeEvent;
      if (!ne) return;
      const x = ne.absoluteX ?? ne.x;
      const y = ne.absoluteY ?? ne.y;
      if (typeof x === "number" && typeof y === "number") reportPosition(x, y);
    },
    [reportPosition],
  );

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
          <Text style={styles.title}>Place planes</Text>
          <Text style={styles.step}>
            {placedCount}/{totalPlanes} placed
          </Text>
        </View>

        <View style={styles.tabs}>
        {placedPlanes.map((p, i) => (
          <SoundPressable
            key={i}
            style={({ pressed }) => [
              styles.tab,
              selectedPlaneIndex === i && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
            onPress={() => onSelectPlane(i)}
          >
            {p ? (
              <Text
                style={[
                  styles.check,
                  selectedPlaneIndex === i && styles.checkActive,
                ]}
              >
                ✓
              </Text>
            ) : (
              <Text
                style={[
                  styles.tabNum,
                  selectedPlaneIndex === i && styles.tabNumActive,
                ]}
              >
                {i + 1}
              </Text>
            )}
          </SoundPressable>
        ))}
      </View>

      <PanGestureHandler
        minDist={0}
        shouldCancelWhenOutside={false}
        onHandlerStateChange={handleDockGestureState}
        onGestureEvent={handleDockGesture}
      >
        <View style={[styles.dockAndBoardWrap]}>
      <View
        style={[styles.toolCard, { width: boardWidth, alignSelf: "center" }]}
      >
        <PlaneDock
          placementRotation={placementRotation}
          placementGridSize={placementGridSize}
          gridWidth={gridWidth}
          boardWidth={boardWidth}
          gridContainerRef={gridContainerRef}
          dockPlaneRef={dockPlaneRef}
          placedPlanes={placedPlanes}
          selectedPlaneIndex={selectedPlaneIndex}
          hasActivePreview={!!previewAt && movingPlaneIndex == null}
          onPreviewChange={onPreviewChange}
          onDragActiveChange={onDragActiveChange}
          onDockDragPosition={onDockDragPosition}
          onDockDragEnd={onDockDragEnd}
          draggingPlaneIndex={dockDragPosition?.planeIndex ?? null}
          planeColors={PLANE_COLORS}
        />
        <View style={styles.toolActions}>
          <SoundPressable
            style={({ pressed }) => [
              styles.actionBtn,
              previewAt && styles.actionBtnDisabled,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={onRotate}
            disabled={!!previewAt}
          >
            <Text style={styles.actionBtnText}>↻ Rotate</Text>
          </SoundPressable>
          <SoundPressable
            style={({ pressed }) => [
              styles.actionBtn,
              !currentPlanePlaced && !previewAt && styles.actionBtnDisabled,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={onClearPlane}
            disabled={!currentPlanePlaced && !previewAt}
          >
            <Text style={styles.actionBtnText}>Clear</Text>
          </SoundPressable>
          <SoundPressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnPrimary,
              (!previewAt || !placementPreviewValid) &&
                styles.actionBtnDisabled,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={() =>
              previewAt &&
              placementPreviewValid &&
              onConfirmPlace({
                at: previewAt,
                planeIndex: selectedPlaneIndex,
                rotation: placementRotation,
              })
            }
            disabled={!previewAt || !placementPreviewValid}
          >
            <Text style={styles.actionBtnTextPrimary}>Confirm</Text>
          </SoundPressable>
        </View>
      </View>

      <View
        ref={gridContainerRef}
        collapsable={false}
        style={[styles.boardWrap, { width: boardWidth, alignSelf: "center" }]}
      >
        <PlacementGrid
          gridSize={placementGridSize}
          placedPlanes={placedPlanes}
          previewCells={placementPreviewCells}
          previewValid={placementPreviewValid}
          movingPlaneIndex={movingPlaneIndex}
          gridContainerRef={gridContainerRef}
          dockDragging={!!dockDragPosition}
          onCellPress={(row, col) => onPreviewChange({ row, col })}
          onDragStart={(row, col) => onPreviewChange({ row, col })}
          onDragMove={(row, col) => onPreviewChange({ row, col })}
          onStartMovePlane={onStartMovePlane}
          onDragEnd={onDragEnd}
          onDragActiveChange={onDragActiveChange}
          mapBackground={false}
        />
      </View>
        </View>
      </PanGestureHandler>

      <View style={styles.footer}>
        <SoundPressable
          style={({ pressed }) => [
            styles.footerBack,
            pressed && styles.footerBackPressed,
          ]}
          onPress={onBack}
        >
          <Text style={styles.footerBackText}>← Back</Text>
        </SoundPressable>
        <SoundPressable
          style={({ pressed }) => [
            styles.footerStart,
            !allPlaced && styles.footerStartDisabled,
            pressed && styles.footerStartPressed,
          ]}
          onPress={onStartGame}
          disabled={!allPlaced || loading}
        >
          {loading ? (
            <ActivityIndicator color={UI_WHITE} size="small" />
          ) : (
            <Text style={styles.footerStartText}>Start game</Text>
          )}
        </SoundPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: 4,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: UI_BODY,
  },
  step: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_BODY_MUTED,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  tab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI_UNSELECTED_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: UI_PRIMARY,
  },
  tabPressed: {
    opacity: 0.9,
  },
  tabNum: {
    fontSize: 14,
    fontWeight: "800",
    color: UI_BODY,
  },
  tabNumActive: {
    color: UI_WHITE,
  },
  check: {
    fontSize: 16,
    fontWeight: "800",
    color: UI_SUCCESS,
  },
  checkActive: {
    color: UI_WHITE,
  },
  dockAndBoardWrap: {
    width: "100%",
    alignItems: "center",
  },
  toolCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  toolActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    justifyContent: "center",
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: UI_UNSELECTED_BG,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimary: {
    backgroundColor: UI_PRIMARY,
  },
  actionBtnPressed: {
    opacity: 0.9,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY,
  },
  actionBtnTextPrimary: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_WHITE,
  },
  boardWrap: {
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },
  footerBack: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: UI_UNSELECTED_BG,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  footerBackPressed: {
    opacity: 0.9,
  },
  footerBackText: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY,
  },
  footerStart: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: UI_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  footerStartDisabled: {
    opacity: 0.5,
  },
  footerStartPressed: {
    opacity: 0.95,
  },
  footerStartText: {
    fontSize: 17,
    fontWeight: "800",
    color: UI_WHITE,
  },
});
