import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  DIFFICULTIES,
  MAP_OPTIONS,
  MATH_PAPER_BG,
  UI_PRIMARY,
  UI_BODY,
  UI_BODY_MUTED,
  UI_CARD_BG,
  UI_INPUT_BG,
  UI_INPUT_BORDER,
  UI_UNSELECTED_BG,
  UI_WHITE,
  UI_SHADOW,
} from "../constants/constants";
import MapCarousel from "./MapCarousel";

const GRID_PREVIEW_CELL = 5;
const GRID_PREVIEW_SIZES = { easy: 4, medium: 5, hard: 6 };
const GRID_PREVIEW_LINE = "#b0bec5";

const GAME_MODES = [
  { id: "computer", label: "vs Computer" },
  { id: "multiplayer", label: "Multiplayer" },
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;

export default function MainMenu({
  playerName = "Player1",
  onPlayerNameChange,
  gameMode = "computer",
  onGameModeChange,
  numPlayers = 2,
  onNumPlayersChange,
  difficulty,
  onDifficultyChange,
  mapId,
  onMapIdChange,
  customPlacement,
  onCustomPlacementToggle,
  loading,
  onNewGame,
  onPlacePlanes,
}) {
  const isMultiplayer = gameMode === "multiplayer";

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Airplane Arcade</Text>
        <Text style={styles.tagline}>Place. Shoot. Sink.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Your name</Text>
        <TextInput
          style={styles.nameInput}
          value={playerName}
          onChangeText={onPlayerNameChange}
          placeholder="Player1"
          placeholderTextColor="#9ca3af"
          maxLength={20}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Game mode</Text>
        <View style={styles.pillRow}>
          {GAME_MODES.map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [
                styles.pill,
                gameMode === m.id ? styles.pillSelected : styles.pillUnselected,
                pressed && styles.pillPressed,
              ]}
              onPress={() => onGameModeChange(m.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  gameMode === m.id
                    ? styles.pillTextSelected
                    : styles.pillTextUnselected,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isMultiplayer && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Number of players</Text>
          <View style={styles.chipRow}>
            {Array.from(
              { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
              (_, i) => MIN_PLAYERS + i,
            ).map((n) => (
              <Pressable
                key={n}
                style={({ pressed }) => [
                  styles.chip,
                  numPlayers === n
                    ? styles.chipSelected
                    : styles.chipUnselected,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => onNumPlayersChange(n)}
              >
                <Text
                  style={[
                    styles.chipText,
                    numPlayers === n
                      ? styles.chipTextSelected
                      : styles.chipTextUnselected,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>
            {numPlayers === 2 ? "1 vs 1" : `${numPlayers} players`}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.diffRow}>
          {DIFFICULTIES.map((d) => {
            const isActive = difficulty === d.id;
            const size = GRID_PREVIEW_SIZES[d.id] ?? 4;
            const total = size * GRID_PREVIEW_CELL;
            return (
              <Pressable
                key={d.id}
                style={({ pressed }) => [
                  styles.diffCard,
                  isActive
                    ? styles.diffCardSelected
                    : styles.diffCardUnselected,
                  pressed && styles.diffCardPressed,
                ]}
                onPress={() => onDifficultyChange(d.id)}
              >
                <View
                  style={[
                    styles.diffGridPreview,
                    {
                      width: total,
                      height: total,
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.2)"
                        : MATH_PAPER_BG,
                    },
                  ]}
                >
                  {Array.from({ length: size * size }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.diffGridCell,
                        {
                          width: GRID_PREVIEW_CELL,
                          height: GRID_PREVIEW_CELL,
                          borderColor: isActive
                            ? "rgba(255,255,255,0.5)"
                            : GRID_PREVIEW_LINE,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.diffLabel,
                    isActive
                      ? styles.diffLabelSelected
                      : styles.diffLabelUnselected,
                  ]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[
                    styles.diffDesc,
                    isActive
                      ? styles.diffDescSelected
                      : styles.diffDescUnselected,
                  ]}
                >
                  {d.desc}
                </Text>
                <Text
                  style={[
                    styles.diffSize,
                    isActive
                      ? styles.diffSizeSelected
                      : styles.diffSizeUnselected,
                  ]}
                >
                  {d.gridSize}×{d.gridSize}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Map</Text>
        <MapCarousel
          mapOptions={MAP_OPTIONS}
          selectedId={mapId}
          onSelect={onMapIdChange}
        />
        <Text style={styles.mapName}>
          {MAP_OPTIONS.find((m) => m.id === mapId)?.label ?? "Default"}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.toggleRow,
          customPlacement && styles.toggleRowActive,
          pressed && styles.toggleRowPressed,
        ]}
        onPress={onCustomPlacementToggle}
      >
        <Text
          style={[
            styles.toggleLabel,
            customPlacement
              ? styles.toggleLabelActive
              : styles.toggleLabelUnselected,
          ]}
        >
          Custom placement
        </Text>
        <View
          style={[
            styles.togglePill,
            customPlacement ? styles.togglePillOn : styles.togglePillOff,
          ]}
        >
          <Text
            style={[
              styles.togglePillText,
              customPlacement
                ? styles.togglePillTextOn
                : styles.togglePillTextOff,
            ]}
          >
            {customPlacement ? "On" : "Off"}
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          loading && styles.primaryButtonDisabled,
          pressed && !loading && styles.primaryButtonPressed,
        ]}
        onPress={customPlacement ? onPlacePlanes : onNewGame}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {customPlacement ? "Place planes" : "New Game"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 4,
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: UI_BODY,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: UI_BODY_MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
  card: {
    backgroundColor: UI_CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: UI_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 12,
    color: UI_BODY_MUTED,
    marginBottom: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nameInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: UI_INPUT_BG,
    borderWidth: 1,
    borderColor: UI_INPUT_BORDER,
    fontSize: 16,
    fontWeight: "600",
    color: UI_BODY,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillUnselected: {
    backgroundColor: UI_UNSELECTED_BG,
  },
  pillSelected: {
    backgroundColor: UI_PRIMARY,
  },
  pillPressed: {
    opacity: 0.9,
  },
  pillText: {
    fontSize: 15,
    fontWeight: "700",
  },
  pillTextUnselected: {
    color: UI_BODY_MUTED,
  },
  pillTextSelected: {
    color: UI_WHITE,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipUnselected: {
    backgroundColor: UI_UNSELECTED_BG,
  },
  chipSelected: {
    backgroundColor: UI_PRIMARY,
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "700",
  },
  chipTextUnselected: {
    color: UI_BODY_MUTED,
  },
  chipTextSelected: {
    color: UI_WHITE,
  },
  hint: {
    fontSize: 13,
    color: UI_BODY_MUTED,
    marginTop: 10,
    fontWeight: "500",
  },
  diffRow: {
    flexDirection: "row",
    gap: 10,
  },
  diffCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  diffCardUnselected: {
    backgroundColor: UI_UNSELECTED_BG,
  },
  diffCardSelected: {
    backgroundColor: UI_PRIMARY,
  },
  diffCardPressed: {
    opacity: 0.95,
  },
  diffGridPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  diffGridCell: {
    borderWidth: 1,
  },
  diffLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  diffLabelUnselected: {
    color: UI_BODY,
  },
  diffLabelSelected: {
    color: UI_WHITE,
  },
  diffDesc: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  diffDescUnselected: {
    color: UI_BODY_MUTED,
  },
  diffDescSelected: {
    color: "rgba(255,255,255,0.9)",
  },
  diffSize: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  diffSizeUnselected: {
    color: UI_BODY_MUTED,
  },
  diffSizeSelected: {
    color: "rgba(255,255,255,0.75)",
  },
  mapName: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY,
    marginTop: 10,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 18,
    backgroundColor: UI_CARD_BG,
    shadowColor: UI_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleRowActive: {
    backgroundColor: UI_PRIMARY,
  },
  toggleRowPressed: {
    opacity: 0.98,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  toggleLabelUnselected: {
    color: UI_BODY,
  },
  toggleLabelActive: {
    color: "#fff",
  },
  togglePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  togglePillOff: {
    backgroundColor: UI_UNSELECTED_BG,
  },
  togglePillOn: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  togglePillTextOff: {
    color: UI_BODY_MUTED,
  },
  togglePillTextOn: {
    color: UI_WHITE,
  },
  primaryButton: {
    backgroundColor: UI_PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: UI_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: UI_WHITE,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
