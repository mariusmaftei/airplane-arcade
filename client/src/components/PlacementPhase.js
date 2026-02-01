import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import PlacementGrid from "./PlacementGrid";

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
  placementGridSize,
  placementPreviewCells,
  placementPreviewValid,
  allPlaced,
  onBack,
  onStartGame,
  loading,
}) {
  return (
    <>
      <Text style={styles.title}>Place planes</Text>
      <Text style={styles.subtitle}>Plane {selectedPlaneIndex + 1}</Text>
      <View style={styles.placementRow}>
        {placedPlanes.map((p, i) => (
          <Pressable
            key={i}
            style={[
              styles.planeBtn,
              selectedPlaneIndex === i && styles.planeBtnActive,
            ]}
            onPress={() => onSelectPlane(i)}
          >
            <Text
              style={[
                styles.planeLabel,
                selectedPlaneIndex === i && styles.planeLabelActive,
              ]}
            >
              Plane {i + 1}
            </Text>
            {p && <Text style={styles.planeCheck}>✓</Text>}
          </Pressable>
        ))}
      </View>
      <View style={styles.placementRow}>
        <Pressable style={styles.secondaryButton} onPress={onRotate}>
          <Text style={styles.secondaryButtonText}>Rotate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onClearPlane}>
          <Text style={styles.secondaryButtonText}>Clear plane</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            (!previewAt || !placementPreviewValid) && styles.buttonDisabled,
          ]}
          onPress={onConfirmPlace}
          disabled={!previewAt || !placementPreviewValid}
        >
          <Text style={styles.buttonText}>Place</Text>
        </Pressable>
      </View>
      <PlacementGrid
        gridSize={placementGridSize}
        placedPlanes={placedPlanes}
        previewCells={placementPreviewCells}
        previewValid={placementPreviewValid}
        onCellPress={(row, col) => onPreviewChange({ row, col })}
        onDragStart={(row, col) => onPreviewChange({ row, col })}
        onDragMove={(row, col) => onPreviewChange({ row, col })}
        mapBackground={false}
      />
      <View style={styles.placementRow}>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.button, !allPlaced && styles.buttonDisabled]}
          onPress={onStartGame}
          disabled={!allPlaced || loading}
        >
          {loading ? (
            <ActivityIndicator color={UI_BUTTON} />
          ) : (
            <Text style={styles.buttonText}>Start game</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const UI_BUTTON = "rgba(67, 67, 67, 1)";
const UI_BUTTON_ACTIVE_BG = "rgba(67, 67, 67, 0.15)";

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    marginBottom: 4,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  placementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  planeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  planeBtnActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  planeLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
  planeLabelActive: { color: UI_BUTTON },
  planeCheck: { fontSize: 14, color: "#2e7d32", fontWeight: "700" },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: UI_BUTTON,
    marginRight: 8,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
  button: {
    backgroundColor: UI_BUTTON,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
