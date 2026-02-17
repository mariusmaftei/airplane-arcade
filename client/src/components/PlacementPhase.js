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
  PLACEMENT_WIDTH_RATIO,
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
  onClearAll,
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
  onRandomPlace,
  loading,
  startButtonLabel = "Start game",
}) {
  const internalGridRef = useRef(null);
  const gridContainerRef = placementGridContainerRef ?? internalGridRef;
  const dockPlaneRef = useRef(null);
  const dockDragStartedRef = useRef(false);
  const currentPlanePlaced = placedPlanes[selectedPlaneIndex];
  const placedCount = placedPlanes.filter(Boolean).length;
  const totalPlanes = placedPlanes.length;
  const boardCellSize = getPlacementCellSize(
    placementGridSize,
    PLACEMENT_WIDTH_RATIO,
  );
  const gridWidth = placementGridSize * boardCellSize;
  const boardWidth = PLACEMENT_LABEL_WIDTH + gridWidth;
  const dockCardWidth = 112;

  const checkTouchOnDockPlane = useCallback((pageX, pageY) => {
    return new Promise((resolve) => {
      if (!dockPlaneRef.current) {
        resolve(false);
        return;
      }
      dockPlaneRef.current.measureInWindow((x, y, w, h) => {
        const inside =
          pageX >= x && pageX <= x + w && pageY >= y && pageY <= y + h;
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
            const cellSize = getPlacementCellSize(
              placementGridSize,
              PLACEMENT_WIDTH_RATIO,
            );
            const localX = px - gx;
            const localY = py - gy;
            const col = Math.floor((localX - PLACEMENT_LABEL_WIDTH) / cellSize);
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
      PLACEMENT_WIDTH_RATIO,
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

  const showConfirm = !!previewAt && placementPreviewValid && !allPlaced;
  const footerPrimaryLabel = allPlaced ? startButtonLabel : "Confirm";
  const footerPrimaryOnPress = allPlaced
    ? onStartGame
    : () =>
        onConfirmPlace({
          at: previewAt,
          planeIndex: selectedPlaneIndex,
          rotation: placementRotation,
        });

  return (
    <View style={styles.page}>
      <SoundPressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        onPress={onBack}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </SoundPressable>
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
        <View style={styles.boardDockCenter}>
          <View style={styles.hintContainer}>
            <Text style={styles.boardHint}>
              {!!previewAt && movingPlaneIndex == null
                ? "Adjust position on board, then press Confirm"
                : !currentPlanePlaced
                  ? `Plane ${selectedPlaneIndex + 1} — drag onto board`
                  : `Plane ${selectedPlaneIndex + 1} placed`}
            </Text>
          </View>
          <View style={styles.dockAndBoardWrap}>
            <View
              style={[
                styles.boardWrap,
                styles.boardLeft,
                { width: boardWidth },
              ]}
            >
              <View ref={gridContainerRef} collapsable={false}>
                <PlacementGrid
                  gridSize={placementGridSize}
                  widthRatio={PLACEMENT_WIDTH_RATIO}
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
            <View style={[styles.toolCard, { width: dockCardWidth }]}>
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
                {onRandomPlace && (
                  <SoundPressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.actionBtnCompact,
                      styles.actionBtnDockWidth,
                      previewAt && styles.actionBtnDisabled,
                      pressed && styles.actionBtnPressed,
                    ]}
                    onPress={onRandomPlace}
                    disabled={!!previewAt}
                  >
                    <Text style={styles.actionBtnTextCompact}>Random</Text>
                  </SoundPressable>
                )}
                <SoundPressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnCompact,
                    styles.actionBtnDockWidth,
                    previewAt && styles.actionBtnDisabled,
                    pressed && styles.actionBtnPressed,
                  ]}
                  onPress={onRotate}
                  disabled={!!previewAt}
                >
                  <Text style={styles.actionBtnTextCompact}>↻ Rotate</Text>
                </SoundPressable>
              </View>
            </View>
          </View>
        </View>
      </PanGestureHandler>

      <View style={styles.footer}>
        <SoundPressable
          style={({ pressed }) => [
            styles.footerBack,
            allPlaced
              ? placedCount === 0
              : !currentPlanePlaced && !previewAt
                ? styles.footerStartDisabled
                : null,
            pressed && styles.footerBackPressed,
          ]}
          onPress={allPlaced && onClearAll ? onClearAll : onClearPlane}
          disabled={
            allPlaced ? placedCount === 0 : !currentPlanePlaced && !previewAt
          }
        >
          <Text style={styles.footerBackText}>
            {allPlaced && onClearAll ? "Clear all" : "Clear"}
          </Text>
        </SoundPressable>
        <SoundPressable
          style={({ pressed }) => [
            styles.footerStart,
            !showConfirm && !allPlaced && styles.footerStartDisabled,
            pressed && styles.footerStartPressed,
          ]}
          onPress={footerPrimaryOnPress}
          disabled={(!showConfirm && !allPlaced) || loading}
        >
          {loading ? (
            <ActivityIndicator color={UI_WHITE} size="small" />
          ) : (
            <Text style={styles.footerStartText}>{footerPrimaryLabel}</Text>
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
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY_MUTED,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
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
    gap: 6,
    marginBottom: 10,
    justifyContent: "center",
  },
  tab: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  boardDockCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dockAndBoardWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 0,
  },
  boardLeft: {
    flexShrink: 0,
    marginBottom: 0,
  },
  hintContainer: {
    backgroundColor: UI_UNSELECTED_BG,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  boardHint: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_BODY,
    textAlign: "center",
  },
  toolCard: {
    flexShrink: 0,
    borderRadius: 12,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 0,
    marginBottom: 0,
  },
  toolActions: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    marginLeft: 14,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: UI_UNSELECTED_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnCompact: {
    minWidth: 0,
  },
  actionBtnDockWidth: {
    width: 96,
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
  actionBtnTextCompact: {
    fontSize: 10,
    fontWeight: "700",
    color: UI_BODY,
  },
  actionBtnTextPrimary: {
    color: UI_WHITE,
  },
  boardWrap: {
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  footerBack: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: UI_UNSELECTED_BG,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 88,
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
    paddingVertical: 12,
    borderRadius: 10,
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
