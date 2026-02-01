import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { DIFFICULTIES, MAP_OPTIONS, MATH_PAPER_BG } from "../constants";
import MapCarousel from "./MapCarousel";

const GRID_PREVIEW_CELL = 5;
const GRID_PREVIEW_SIZES = { easy: 4, medium: 5, hard: 6 };
const GRID_PREVIEW_BORDER = "#1565c0";

const GAME_MODES = [
  { id: "computer", label: "vs Computer" },
  { id: "multiplayer", label: "Multiplayer" },
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const UI_BUTTON = "rgba(67, 67, 67, 1)";
const UI_BUTTON_ACTIVE_BG = "rgba(67, 67, 67, 0.15)";

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
      <Text style={styles.title}>Airplane Arcade</Text>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Your name</Text>
        <TextInput
          style={styles.nameInput}
          value={playerName}
          onChangeText={onPlayerNameChange}
          placeholder="Player1"
          placeholderTextColor="#999"
          maxLength={20}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Game mode</Text>
        <View style={styles.modeRow}>
          {GAME_MODES.map((m) => (
            <Pressable
              key={m.id}
              style={[
                styles.modeButton,
                gameMode === m.id && styles.modeButtonActive,
              ]}
              onPress={() => onGameModeChange(m.id)}
            >
              <Text
                style={[
                  styles.modeLabel,
                  gameMode === m.id && styles.modeLabelActive,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {isMultiplayer && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Number of players</Text>
          <View style={styles.playersRow}>
            {Array.from(
              { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
              (_, i) => MIN_PLAYERS + i,
            ).map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.playerButton,
                  numPlayers === n && styles.playerButtonActive,
                ]}
                onPress={() => onNumPlayersChange(n)}
              >
                <Text
                  style={[
                    styles.playerLabel,
                    numPlayers === n && styles.playerLabelActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.playersHint}>
            {numPlayers === 2 ? "1 vs 1" : `${numPlayers} players`}
          </Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((d) => {
            const isActive = difficulty === d.id;
            const size = GRID_PREVIEW_SIZES[d.id] ?? 4;
            const total = size * GRID_PREVIEW_CELL;
            return (
              <Pressable
                key={d.id}
                style={[
                  styles.diffButton,
                  isActive && styles.diffButtonActive,
                  d.id === "easy" && styles.diffButtonEasy,
                  d.id === "medium" && styles.diffButtonMedium,
                  d.id === "hard" && styles.diffButtonHard,
                  isActive && d.id === "easy" && styles.diffButtonEasyActive,
                  isActive &&
                    d.id === "medium" &&
                    styles.diffButtonMediumActive,
                  isActive && d.id === "hard" && styles.diffButtonHardActive,
                ]}
                onPress={() => onDifficultyChange(d.id)}
              >
                <View
                  style={[
                    styles.diffGridPreview,
                    {
                      width: total,
                      height: total,
                      backgroundColor: MATH_PAPER_BG,
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
                          borderColor: GRID_PREVIEW_BORDER,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[styles.diffLabel, isActive && styles.diffLabelActive]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[styles.diffDesc, isActive && styles.diffDescActive]}
                >
                  {d.desc}
                </Text>
                <Text style={styles.diffSize}>
                  {d.gridSize}×{d.gridSize}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Map</Text>
        <MapCarousel
          mapOptions={MAP_OPTIONS}
          selectedId={mapId}
          onSelect={onMapIdChange}
        />
        <Text style={styles.mapName}>
          {MAP_OPTIONS.find((m) => m.id === mapId)?.label ?? "Default"}
        </Text>
      </View>
      <View style={styles.section}>
        <Pressable
          style={[
            styles.customPlacementRow,
            customPlacement && styles.customPlacementRowActive,
          ]}
          onPress={onCustomPlacementToggle}
        >
          <Text
            style={[
              styles.customPlacementLabel,
              customPlacement && styles.customPlacementLabelActive,
            ]}
          >
            Custom placement
          </Text>
          <Text style={styles.customPlacementHint}>
            {customPlacement ? "On" : "Off"}
          </Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={customPlacement ? onPlacePlanes : onNewGame}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={UI_BUTTON} />
        ) : (
          <Text style={styles.buttonText}>
            {customPlacement ? "Place planes" : "New Game"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 400, alignSelf: "center" },
  section: { marginBottom: 24 },
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
  nameInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  modeRow: { flexDirection: "row", gap: 8 },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  modeLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  modeLabelActive: { color: UI_BUTTON },
  playersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  playerButton: {
    minWidth: 36,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  playerButtonActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  playerLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  playerLabelActive: { color: UI_BUTTON },
  playersHint: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
    fontWeight: "500",
  },
  difficultyRow: { flexDirection: "row", gap: 8 },
  diffButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  diffButtonEasy: { borderWidth: 2 },
  diffButtonMedium: { borderWidth: 2.5 },
  diffButtonHard: { borderWidth: 3 },
  diffButtonActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  diffButtonEasyActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  diffButtonMediumActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
    borderWidth: 2.5,
  },
  diffButtonHardActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
    borderWidth: 3,
  },
  diffGridPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  diffGridCell: {
    borderWidth: 1,
    backgroundColor: MATH_PAPER_BG,
  },
  diffLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  diffLabelActive: { color: UI_BUTTON },
  diffDesc: { fontSize: 11, color: "#666", marginTop: 2 },
  diffDescActive: { color: UI_BUTTON },
  diffSize: { fontSize: 9, color: "#999", marginTop: 2 },
  mapName: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 6 },
  customPlacementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  customPlacementRowActive: {
    borderColor: UI_BUTTON,
    backgroundColor: UI_BUTTON_ACTIVE_BG,
  },
  customPlacementLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  customPlacementLabelActive: { color: UI_BUTTON },
  customPlacementHint: { fontSize: 13, color: "#888", fontWeight: "500" },
  primaryButton: {
    backgroundColor: UI_BUTTON,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  primaryButtonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
