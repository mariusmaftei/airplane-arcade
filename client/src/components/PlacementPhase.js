import { useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import PlacementGrid from "./PlacementGrid";
import { getPlacementCellSize, PLACEMENT_LABEL_WIDTH } from "./PlacementGrid";
import PlaneDock from "./PlaneDock";
import {
  UI_PRIMARY,
  UI_WHITE,
  UI_BODY,
  UI_BODY_MUTED,
  UI_SUCCESS,
  UI_UNSELECTED_BG,
  UI_CARD_BG,
  UI_SHADOW,
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
  const currentPlanePlaced = placedPlanes[selectedPlaneIndex];
  const placedCount = placedPlanes.filter(Boolean).length;
  const totalPlanes = placedPlanes.length;
  const boardCellSize = getPlacementCellSize(placementGridSize);
  const gridWidth = placementGridSize * boardCellSize;
  const boardWidth = PLACEMENT_LABEL_WIDTH + gridWidth;

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
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.tab,
              selectedPlaneIndex === i && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
            onPress={() => onSelectPlane(i)}
          >
            <Text
              style={[
                styles.tabNum,
                selectedPlaneIndex === i && styles.tabNumActive,
              ]}
            >
              {i + 1}
            </Text>
            {p && (
              <View style={styles.checkWrap}>
                <Text
                  style={[
                    styles.check,
                    selectedPlaneIndex === i && styles.checkActive,
                  ]}
                >
                  ✓
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View
        style={[styles.toolCard, { width: boardWidth, alignSelf: "center" }]}
      >
        <PlaneDock
          placementRotation={placementRotation}
          placementGridSize={placementGridSize}
          gridWidth={gridWidth}
          boardWidth={boardWidth}
          gridContainerRef={gridContainerRef}
          onPreviewChange={onPreviewChange}
          onDragActiveChange={onDragActiveChange}
          onDockDragPosition={onDockDragPosition}
          isDraggingFromDock={!!dockDragPosition}
          isCurrentPlanePlaced={!!placedPlanes[selectedPlaneIndex]}
          planeNumber={selectedPlaneIndex + 1}
          planeColor={PLANE_COLORS[selectedPlaneIndex % PLANE_COLORS.length]}
        />
        <View style={styles.toolActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={onRotate}
          >
            <Text style={styles.actionBtnText}>↻ Rotate</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={onClearPlane}
          >
            <Text style={styles.actionBtnText}>Clear</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnPrimary,
              (!previewAt || !placementPreviewValid) &&
                styles.actionBtnDisabled,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={onConfirmPlace}
            disabled={!previewAt || !placementPreviewValid}
          >
            <Text style={styles.actionBtnTextPrimary}>Confirm</Text>
          </Pressable>
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
          onCellPress={(row, col) => onPreviewChange({ row, col })}
          onDragStart={(row, col) => onPreviewChange({ row, col })}
          onDragMove={(row, col) => onPreviewChange({ row, col })}
          onStartMovePlane={onStartMovePlane}
          onDragEnd={onDragEnd}
          onDragActiveChange={onDragActiveChange}
          mapBackground={false}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.footerBack,
            pressed && styles.footerBackPressed,
          ]}
          onPress={onBack}
        >
          <Text style={styles.footerBackText}>← Back</Text>
        </Pressable>
        <Pressable
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
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
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
    gap: 10,
    marginBottom: 14,
    justifyContent: "center",
  },
  tab: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 18,
    fontWeight: "800",
    color: UI_BODY,
  },
  tabNumActive: {
    color: UI_WHITE,
  },
  checkWrap: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
  check: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_SUCCESS,
  },
  checkActive: {
    color: UI_WHITE,
  },
  toolCard: {
    backgroundColor: UI_CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: UI_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
