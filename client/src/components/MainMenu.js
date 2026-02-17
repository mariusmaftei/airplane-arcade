import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import SoundPressable from "./SoundPressable";
import {
  DIFFICULTIES,
  MAP_OPTIONS,
  UI_PRIMARY,
  INTRO_IMAGE,
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
import BoardPreview from "./BoardPreview";
import LanJoinForm from "./LanJoinForm";

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
  lanMode,
  onLanModeChange,
  onHostLan,
  onJoinLanFound,
  onJoinPlacePlanes,
  onJoinWithRandomPlanes,
  onFindLanGame,
  onServerUrlChange,
  joinLoading,
  lanJoinInfo,
  baseUrl,
}) {
  const [stage, setStage] = useState(1);
  const [joinConnectStep, setJoinConnectStep] = useState(1);
  const isMultiplayer = gameMode === "multiplayer";

  useEffect(() => {
    if (lanMode !== "join") setJoinConnectStep(1);
  }, [lanMode]);

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        {stage === 1 && (
          <Image
            source={INTRO_IMAGE}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <Text style={styles.title}>Airplane Arcade</Text>
        <Text style={styles.tagline}>Place. Shoot. Sink.</Text>
      </View>

      {stage === 1 ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Game mode</Text>
            <View style={styles.pillRow}>
              {GAME_MODES.map((m) => (
                <SoundPressable
                  key={m.id}
                  style={({ pressed }) => [
                    styles.pill,
                    gameMode === m.id
                      ? styles.pillSelected
                      : styles.pillUnselected,
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
                </SoundPressable>
              ))}
            </View>
          </View>

          {isMultiplayer && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>LAN multiplayer</Text>
              <View style={styles.chipRow}>
                <SoundPressable
                  style={({ pressed }) => [
                    styles.chip,
                    lanMode === "host"
                      ? styles.chipSelected
                      : styles.chipUnselected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => onLanModeChange?.("host")}
                >
                  <Text
                    style={[
                      styles.chipText,
                      lanMode === "host"
                        ? styles.chipTextSelected
                        : styles.chipTextUnselected,
                    ]}
                  >
                    Host
                  </Text>
                </SoundPressable>
                <SoundPressable
                  style={({ pressed }) => [
                    styles.chip,
                    lanMode === "join"
                      ? styles.chipSelected
                      : styles.chipUnselected,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => onLanModeChange?.("join")}
                >
                  <Text
                    style={[
                      styles.chipText,
                      lanMode === "join"
                        ? styles.chipTextSelected
                        : styles.chipTextUnselected,
                    ]}
                  >
                    Join
                  </Text>
                </SoundPressable>
              </View>
              <Text style={styles.hint}>
                Host creates game, Join enters code
              </Text>
            </View>
          )}

          {(!isMultiplayer || lanMode) ? (
            <SoundPressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={() => setStage(2)}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </SoundPressable>
          ) : null}
        </>
      ) : stage === 2 ? (
        <>
          <SoundPressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => setStage(1)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </SoundPressable>

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

          <SoundPressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={() => setStage(3)}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </SoundPressable>
        </>
      ) : (
        <>
          <SoundPressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => {
              if (lanMode === "join" && joinConnectStep === 2) {
                setJoinConnectStep(1);
              } else {
                setStage(2);
                setJoinConnectStep(1);
              }
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </SoundPressable>

          {isMultiplayer && lanMode === "join" && joinConnectStep === 2 ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Connect to LAN</Text>
              <LanJoinForm
                onFound={(info) => {
                  if (customPlacement) {
                    onJoinLanFound(info);
                    onJoinPlacePlanes();
                  } else {
                    onJoinWithRandomPlanes?.(info);
                  }
                }}
                loading={joinLoading}
                onFind={onFindLanGame}
                onServerUrlChange={onServerUrlChange}
                baseUrl={baseUrl}
                buttonLabel="Connect"
              />
            </View>
          ) : (
          <>
            {(!isMultiplayer || lanMode === "host") && (
            <View style={[styles.card, styles.cardCompact]}>
              <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>
                Difficulty
              </Text>
              <View style={[styles.diffRow, styles.diffRowCompact]}>
                {DIFFICULTIES.map((d) => {
                  const isActive = difficulty === d.id;
                  return (
                    <SoundPressable
                      key={d.id}
                      style={({ pressed }) => [
                        styles.diffCard,
                        styles.diffCardCompact,
                        isActive
                          ? styles.diffCardSelected
                          : styles.diffCardUnselected,
                        pressed && styles.diffCardPressed,
                      ]}
                      onPress={() => onDifficultyChange(d.id)}
                    >
                      <Text
                        style={[
                          styles.diffLabel,
                          styles.diffLabelCompact,
                          isActive
                            ? styles.diffLabelSelected
                            : styles.diffLabelUnselected,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </SoundPressable>
                );
              })}
            </View>
          </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Board preview</Text>
              {isMultiplayer && lanMode === "join" ? (
                <Text style={styles.hint}>
                  10×10 grid • 3 planes (from host game)
                </Text>
              ) : (
                (() => {
                  const d = DIFFICULTIES.find((x) => x.id === difficulty);
                  return d ? (
                    <Text style={styles.hint}>
                      {d.desc} • {d.gridSize}×{d.gridSize} grid • {d.numPlanes}{" "}
                      plane
                      {d.numPlanes > 1 ? "s" : ""}
                    </Text>
                  ) : null;
                })()
              )}
              <View style={styles.boardPreviewWrap}>
                <BoardPreview
                  gridSize={
                    isMultiplayer && lanMode === "join"
                      ? 10
                      : DIFFICULTIES.find((d) => d.id === difficulty)?.gridSize ?? 10
                  }
                  mapId={mapId}
                  size={112}
                />
              </View>
              <Text style={styles.mapName}>
                {MAP_OPTIONS.find((m) => m.id === mapId)?.label ?? "Default"}
              </Text>
            </View>

            <View style={[styles.card, styles.cardCompact]}>
              <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>
                Map
              </Text>
              <MapCarousel
                mapOptions={MAP_OPTIONS}
                selectedId={mapId}
                onSelect={onMapIdChange}
                compact
              />
            </View>

            <View style={[styles.card, styles.cardCompact]}>
              <Text style={[styles.sectionLabel, styles.sectionLabelCompact]}>
                Plane placement
              </Text>
              <View style={[styles.pillRow, styles.pillRowCompact]}>
                <SoundPressable
                  style={({ pressed }) => [
                    styles.pill,
                    styles.pillCompact,
                    customPlacement
                      ? styles.pillSelected
                      : styles.pillUnselected,
                    pressed && styles.pillPressed,
                  ]}
                  onPress={() => !customPlacement && onCustomPlacementToggle()}
                >
                  <Text
                    style={[
                      styles.pillText,
                      styles.pillTextCompact,
                      customPlacement
                        ? styles.pillTextSelected
                        : styles.pillTextUnselected,
                    ]}
                  >
                    Custom
                  </Text>
                </SoundPressable>
                <SoundPressable
                  style={({ pressed }) => [
                    styles.pill,
                    styles.pillCompact,
                    !customPlacement
                      ? styles.pillSelected
                      : styles.pillUnselected,
                    pressed && styles.pillPressed,
                  ]}
                  onPress={() => customPlacement && onCustomPlacementToggle()}
                >
                  <Text
                    style={[
                      styles.pillText,
                      styles.pillTextCompact,
                      !customPlacement
                        ? styles.pillTextSelected
                        : styles.pillTextUnselected,
                    ]}
                  >
                    Random
                  </Text>
                </SoundPressable>
              </View>
            </View>

            {isMultiplayer && lanMode === "join" ? (
              <SoundPressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={() => setJoinConnectStep(2)}
              >
                <Text style={styles.primaryButtonText}>Connect to LAN</Text>
              </SoundPressable>
            ) : (
              <SoundPressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  loading && styles.primaryButtonDisabled,
                  pressed && !loading && styles.primaryButtonPressed,
                ]}
                onPress={
                  isMultiplayer && lanMode === "host"
                    ? onHostLan
                    : customPlacement
                      ? onPlacePlanes
                      : onNewGame
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isMultiplayer && lanMode === "host"
                      ? "Host game"
                      : customPlacement
                        ? "Place planes"
                        : "Start Game"}
                  </Text>
                )}
              </SoundPressable>
            )}
          </>
          )}
        </>
      )}
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
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 128,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY_MUTED,
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
  cardCompact: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 11,
  },
  sectionLabel: {
    fontSize: 12,
    color: UI_BODY_MUTED,
    marginBottom: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLabelCompact: {
    fontSize: 10,
    marginBottom: 10,
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
  pillRowCompact: {
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillCompact: {
    paddingVertical: 11,
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
  pillTextCompact: {
    fontSize: 12,
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
  diffRowCompact: {
    gap: 8,
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
  diffCardCompact: {
    paddingVertical: 11,
    paddingHorizontal: 8,
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
  diffLabelCompact: {
    fontSize: 12,
  },
  mapName: {
    fontSize: 15,
    fontWeight: "700",
    color: UI_BODY,
    marginTop: 10,
    textAlign: "center",
  },
  mapNameCompact: {
    fontSize: 12,
    marginTop: 8,
  },
  boardPreviewWrap: {
    marginTop: 12,
    alignItems: "center",
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
