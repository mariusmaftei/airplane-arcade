import { View, Text, Pressable, StyleSheet } from "react-native";
import { formatTime } from "../utils/format";
import Grid from "./Grid";
import CoordPicker from "./CoordPicker";

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  timer: { fontSize: 14, fontWeight: "600", color: "#333" },
  stats: { fontSize: 14, color: "#666" },
  menuRow: { flexDirection: "row", marginBottom: 12 },
  feedbackSlot: { minHeight: 24, marginBottom: 8 },
  gaveUpText: { fontSize: 14, color: "#666" },
  win: { fontSize: 16, fontWeight: "600", color: "#2e7d32" },
  feedback: { fontSize: 16, fontWeight: "600", color: "#5a6a6e" },
  cooldown: { fontSize: 14, color: "#666" },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#999",
    marginRight: 8,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
});

export default function GamePhase({
  elapsed,
  shots,
  hits,
  accuracy,
  gaveUp,
  gameOver,
  lastResult,
  sunkPlaneId,
  cooldownRemaining,
  onGiveUp,
  onMainMenu,
  gridSize,
  misses,
  revealedCells,
  onCellPress,
  gridDisabled,
  mapBackground,
  defaultMap,
  highlightCell,
  explodingCell,
  selectedCol,
  selectedRow,
  onColChange,
  onRowChange,
  onShoot,
  canShootCoord,
  coordDisabled,
  onPadTouchStart,
  onPadTouchEnd,
}) {
  return (
    <>
      <View style={styles.statsRow}>
        <Text style={styles.timer}>Time: {formatTime(elapsed)}</Text>
        <Text style={styles.stats}>
          Shots: {shots} · Hits: {hits.length} · {accuracy}%
        </Text>
      </View>
      <View style={styles.menuRow}>
        {!gameOver && !gaveUp && (
          <Pressable style={styles.secondaryButton} onPress={onGiveUp}>
            <Text style={styles.secondaryButtonText}>Give up</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={onMainMenu}>
          <Text style={styles.secondaryButtonText}>Main menu</Text>
        </Pressable>
      </View>
      <View style={styles.feedbackSlot}>
        {gaveUp ? (
          <Text style={styles.gaveUpText}>You gave up — planes revealed</Text>
        ) : gameOver ? (
          <Text style={styles.win}>
            You win! Time: {formatTime(elapsed)} · Accuracy: {accuracy}%
          </Text>
        ) : lastResult ? (
          <Text style={styles.feedback}>
            {lastResult === "miss" && "Miss"}
            {lastResult === "hit" && "Hit!"}
            {lastResult === "sunk" &&
              (sunkPlaneId
                ? `Plane ${sunkPlaneId} shot down!`
                : "Plane shot down!")}
          </Text>
        ) : cooldownRemaining > 0 ? (
          <Text style={styles.cooldown}>Next shot in {cooldownRemaining}s</Text>
        ) : null}
      </View>
      <Grid
        gridSize={gridSize}
        hits={hits}
        misses={misses}
        revealedCells={revealedCells}
        onCellPress={onCellPress}
        disabled={gridDisabled}
        mapBackground={mapBackground}
        defaultMap={defaultMap}
        highlightCell={highlightCell}
        explodingCell={explodingCell}
      />
      {!gameOver && !gaveUp && (
        <CoordPicker
          gridSize={gridSize}
          selectedCol={selectedCol}
          selectedRow={selectedRow}
          onColChange={onColChange}
          onRowChange={onRowChange}
          onShoot={onShoot}
          canShoot={canShootCoord}
          disabled={coordDisabled}
          onPadTouchStart={onPadTouchStart}
          onPadTouchEnd={onPadTouchEnd}
        />
      )}
    </>
  );
}
