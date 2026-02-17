import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { UI_BODY, UI_INPUT_BORDER, UI_UNSELECTED_BG } from "../constants/constants";

const MINI_CELL = 8;

function getCellState(hits, misses, revealedCells, row, col) {
  if (hits?.some((h) => h.row === row && h.col === col)) return "hit";
  if (misses?.some((m) => m.row === row && m.col === col)) return "miss";
  if (revealedCells?.some((c) => c.row === row && c.col === col))
    return "revealed";
  return "empty";
}

function MiniBoard({ gridSize, hits, misses, revealedCells, label, selected, onPress }) {
  const rows = [];
  for (let r = 0; r < gridSize; r++) {
    const cells = [];
    for (let c = 0; c < gridSize; c++) {
      const state = getCellState(hits, misses, revealedCells, r, c);
      let bg = UI_UNSELECTED_BG;
      if (state === "hit") bg = "#e57373";
      else if (state === "miss") bg = "#b0bec5";
      else if (state === "revealed") bg = "#90a4ae";
      cells.push(
        <View
          key={`${r}-${c}`}
          style={[styles.miniCell, { backgroundColor: bg }]}
        />,
      );
    }
    rows.push(
      <View key={r} style={styles.miniRow}>
        {cells}
      </View>,
    );
  }
  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};
  return (
    <Wrapper style={[styles.card, selected && styles.cardSelected]} {...wrapperProps}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.miniGrid}>{rows}</View>
    </Wrapper>
  );
}

export default function OpponentBoardCarousel({
  gridSize,
  hits = [],
  misses = [],
  revealedCells = [],
  gameMode = "computer",
  numPlayers = 2,
  carouselLabel,
  carouselItems = [],
  selectedTargetId,
  onSelectTarget,
}) {
  const isMultiplayer = gameMode === "multiplayer";
  const items = carouselItems?.length > 0
    ? carouselItems
    : isMultiplayer
      ? [{ id: "opponent", label: carouselLabel ?? "Opponent", hits, misses, revealedCells }]
      : [{ id: "cpu", label: carouselLabel ?? "CPU", hits, misses, revealedCells }];

  if (items.length === 0) return null;

  const canSelect = isMultiplayer && items.length > 1 && onSelectTarget;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <MiniBoard
            key={item.id}
            gridSize={gridSize}
            hits={item.hits ?? []}
            misses={item.misses ?? []}
            revealedCells={item.revealedCells ?? []}
            label={item.label ?? item.name ?? "Opponent"}
            selected={selectedTargetId === item.id}
            onPress={canSelect ? () => onSelectTarget(item.id) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 8 },
  scrollContent: { paddingHorizontal: 4 },
  card: {
    backgroundColor: UI_UNSELECTED_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UI_INPUT_BORDER,
    padding: 8,
    alignItems: "center",
    marginRight: 12,
  },
  cardSelected: {
    borderColor: UI_BODY,
    borderWidth: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_BODY,
    marginBottom: 6,
  },
  miniGrid: {},
  miniRow: { flexDirection: "row" },
  miniCell: {
    width: MINI_CELL,
    height: MINI_CELL,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.15)",
  },
});
