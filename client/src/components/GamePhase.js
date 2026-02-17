import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatTime } from "../utils/format";
import Grid from "./Grid";
import CoordPicker from "./CoordPicker";
import OpponentBoardCarousel from "./OpponentBoardCarousel";
import SoundPressable from "./SoundPressable";
import {
  UI_PRIMARY,
  UI_WHITE,
  UI_SUCCESS,
  UI_DANGER,
  UI_BODY_MUTED,
} from "../constants/constants";
import { useSoundSettings } from "../contexts/SoundSettingsContext";

const styles = StyleSheet.create({
  turnBar: {
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: UI_PRIMARY,
    backgroundColor: UI_PRIMARY,
    overflow: "hidden",
  },
  turnBarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  turnBarLabelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  turnBarRight: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  turnBarFeedback: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 32,
    justifyContent: "center",
  },
  turnBarFeedbackText: { fontSize: 14, fontWeight: "600", color: UI_WHITE },
  turnBarText: { fontSize: 15, fontWeight: "700", color: UI_WHITE },
  turnBarCpu: { borderColor: UI_PRIMARY, backgroundColor: UI_PRIMARY },
  turnBarCpuText: { color: UI_WHITE },
  burgerButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: UI_WHITE,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  burgerLine: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: UI_WHITE,
  },
  feedbackSlot: { minHeight: 20, marginBottom: 4 },
  win: { fontSize: 16, fontWeight: "600", color: UI_SUCCESS },
  lose: { fontSize: 16, fontWeight: "600", color: UI_DANGER },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  gameOverPanel: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  gameOverCardLose: {
    borderColor: UI_DANGER,
  },
  gameOverCardWin: {
    borderColor: UI_SUCCESS,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "800",
    color: UI_SUCCESS,
    marginBottom: 6,
  },
  loseTitleTextOverlay: {
    fontSize: 24,
    fontWeight: "800",
    color: UI_DANGER,
    marginBottom: 6,
  },
  gaveUpTextOverlay: {
    fontSize: 20,
    fontWeight: "700",
    color: UI_WHITE,
    marginBottom: 6,
  },
  winnerNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: UI_WHITE,
    marginBottom: 12,
  },
  gameOverStatsOverlay: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  scoreboard: {
    width: "100%",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 16,
  },
  scoreboardRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  scoreboardRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreboardRowPlayer: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  scoreboardRowOpponent: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  scoreboardRowWinner: {
    borderWidth: 2,
    borderColor: UI_SUCCESS,
  },
  scoreboardRowLoser: {
    opacity: 0.85,
  },
  scoreboardName: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
  scoreboardStats: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  scoreboardPlanes: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  gameOverMainMenuBtn: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: UI_PRIMARY,
    alignItems: "center",
    alignSelf: "stretch",
  },
  gameOverMainMenuBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_WHITE,
  },
  scoreboardBadge: {
    fontSize: 12,
    fontWeight: "800",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  scoreboardBadgeWin: {
    backgroundColor: UI_SUCCESS,
    color: UI_WHITE,
  },
  scoreboardBadgeLose: {
    backgroundColor: UI_DANGER,
  },
  scoreboardBadgeText: {
    color: UI_WHITE,
    fontWeight: "800",
    fontSize: 12,
  },
  feedback: { fontSize: 16, fontWeight: "600", color: UI_BODY_MUTED },
  turnBarMenu: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: UI_WHITE,
  },
  menuItemTextDanger: { color: UI_DANGER },
  soundSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  soundSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_WHITE,
    marginBottom: 10,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  soundLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    width: 100,
  },
  soundSlider: {
    flex: 1,
    height: 24,
  },
  soundMuteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 8,
  },
  soundMuteBtnActive: {
    backgroundColor: UI_DANGER,
  },
  soundMuteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_WHITE,
  },
  menuOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  menuPanel: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  gameRoot: { flex: 1 },
  gameScroll: { flex: 1 },
  gameScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  gameScrollContentGrow: {
    flexGrow: 1,
  },
  carouselSlot: {
    minHeight: 140,
    marginTop: 12,
  },
  bottomBar: {
    width: "100%",
    backgroundColor: UI_PRIMARY,
    borderTopWidth: 2,
    borderTopColor: UI_PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bottomBarStatsContainer: {
    backgroundColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    alignItems: "center",
    width: "100%",
  },
  bottomBarStatsText: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_SUCCESS,
  },
});

export default function GamePhase({
  gameMode = "computer",
  numPlayers = 2,
  playerName = "Player1",
  isPlayerTurn = true,
  elapsed,
  shots,
  hits,
  accuracy,
  attackShots,
  attackHits,
  gaveUp,
  gameOver,
  playerWon,
  lastResult,
  sunkPlaneId,
  cooldownRemaining,
  onGiveUp,
  onMainMenu,
  gridSize,
  misses,
  revealedCells,
  carouselHits,
  carouselMisses,
  carouselRevealed,
  carouselLabel,
  carouselItems,
  selectedTargetId,
  onSelectTarget,
  onCellPress,
  gridDisabled,
  mapBackground,
  defaultMap,
  highlightCell,
  explodingCell,
  smokeCell,
  selectedCol,
  selectedRow,
  onColChange,
  onRowChange,
  onShoot,
  canShootCoord,
  coordDisabled,
  onPadTouchStart,
  onPadTouchEnd,
  opponentShots,
  opponentHits,
  opponentName = "CPU",
  numPlanes,
  playerPlanesSunk,
  cpuPlanesSunk,
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = (playerName || "").trim() || "Player1";
  const scrollContentMinHeight = windowHeight - 200;

  const feedbackText =
    lastResult === "miss"
      ? "Miss"
      : lastResult === "hit"
        ? "Hit!"
        : lastResult === "sunk"
          ? sunkPlaneId
            ? `Plane ${sunkPlaneId} shot down!`
            : "Plane shot down!"
          : null;

  const closeMenu = () => setMenuOpen(false);
  const {
    soundEffectsVolume,
    soundEffectsMuted,
    battleMusicVolume,
    battleMusicMuted,
    setSoundEffectsVolume,
    setSoundEffectsMuted,
    setBattleMusicVolume,
    setBattleMusicMuted,
  } = useSoundSettings();
  const handleGiveUpPress = () => {
    closeMenu();
    onGiveUp();
  };
  const handleMainMenuPress = () => {
    closeMenu();
    onMainMenu();
  };

  let turnLabel = "";
  let turnStyle = [styles.turnBar];
  let turnTextStyle = [styles.turnBarText];
  if (gameOver || gaveUp) {
    turnLabel = "Game over";
    turnStyle = [styles.turnBar, styles.turnBarCpu];
    turnTextStyle = [styles.turnBarText, styles.turnBarCpuText];
  } else if (isPlayerTurn) {
    turnLabel = `${name}'s turn`;
  } else {
    turnLabel = `${opponentName}'s turn`;
    turnStyle = [styles.turnBar, styles.turnBarCpu];
    turnTextStyle = [styles.turnBarText, styles.turnBarCpuText];
  }

  return (
    <View style={styles.gameRoot}>
      <ScrollView
        style={styles.gameScroll}
        contentContainerStyle={[
          styles.gameScrollContent,
          styles.gameScrollContentGrow,
          {
            paddingTop: 4 + insets.top,
            minHeight: scrollContentMinHeight,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={turnStyle}>
          <View style={styles.turnBarRow}>
            <View style={styles.turnBarLabelWrap} pointerEvents="none">
              <Text style={turnTextStyle}>{turnLabel}</Text>
            </View>
            <View style={styles.turnBarRight}>
              <Pressable
                style={styles.burgerButton}
                onPress={() => setMenuOpen((open) => !open)}
                accessibilityLabel={menuOpen ? "Close menu" : "Open menu"}
              >
                <View style={styles.burgerLine} />
                <View style={styles.burgerLine} />
                <View style={styles.burgerLine} />
              </Pressable>
            </View>
          </View>
          <View style={styles.turnBarFeedback}>
            {feedbackText != null && (
              <Text style={styles.turnBarFeedbackText}>{feedbackText}</Text>
            )}
          </View>
        </View>
        <View style={styles.feedbackSlot} />
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
          smokeCell={smokeCell}
        />
        <View style={styles.carouselSlot}>
          <OpponentBoardCarousel
            gridSize={gridSize}
            hits={carouselHits ?? hits}
            misses={carouselMisses ?? misses}
            revealedCells={carouselRevealed ?? revealedCells}
            gameMode={gameMode}
            numPlayers={numPlayers}
            carouselLabel={carouselLabel}
            carouselItems={carouselItems}
            selectedTargetId={selectedTargetId}
            onSelectTarget={onSelectTarget}
          />
        </View>
      </ScrollView>
      {(gameOver || gaveUp) && (
        <View style={styles.gameOverOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.gameOverPanel,
              gaveUp || playerWon === false
                ? styles.gameOverCardLose
                : styles.gameOverCardWin,
            ]}
          >
            {gaveUp ? (
              <Text style={styles.gaveUpTextOverlay}>
                You gave up — planes revealed
              </Text>
            ) : playerWon === false ? (
              <>
                <Text style={styles.loseTitleTextOverlay}>Game over</Text>
                <Text style={styles.gameOverStatsOverlay}>{opponentName} wins</Text>
              </>
            ) : (
              <>
                <Text style={styles.congratsText}>Congrats!</Text>
                <Text style={styles.winnerNameText}>{name} wins!</Text>
              </>
            )}
            {(() => {
              const playerShots = attackShots ?? shots;
              const playerHitsCount = attackHits ?? (hits?.length ?? 0);
              const oppShots = opponentShots ?? 0;
              const oppHits = opponentHits ?? 0;
              const oppAccuracy =
                oppShots > 0 ? Math.round((oppHits / oppShots) * 100) : 0;
              const showScoreboard = playerShots > 0 || oppShots > 0;
              const playerWonGame = !gaveUp && playerWon === true;
              const totalPlanes = numPlanes ?? 3;
              const playerDown = playerPlanesSunk ?? 0;
              const playerLeft = Math.max(0, totalPlanes - playerDown);
              const cpuDown = cpuPlanesSunk ?? 0;
              const cpuLeft = Math.max(0, totalPlanes - cpuDown);
              return (
                showScoreboard && (
                  <View style={styles.scoreboard}>
                    <View
                      style={[
                        styles.scoreboardRow,
                        styles.scoreboardRowPlayer,
                        playerWonGame
                          ? styles.scoreboardRowWinner
                          : styles.scoreboardRowLoser,
                      ]}
                    >
                      <View style={styles.scoreboardRowHeader}>
                        <Text style={styles.scoreboardName}>{name}</Text>
                        <View
                          style={[
                            styles.scoreboardBadge,
                            playerWonGame
                              ? styles.scoreboardBadgeWin
                              : styles.scoreboardBadgeLose,
                          ]}
                        >
                          <Text style={styles.scoreboardBadgeText}>
                            {playerWonGame ? "WIN" : "LOSE"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scoreboardStats}>
                        {formatTime(elapsed)} · {playerShots} shots ·{" "}
                        {playerHitsCount} hits · {accuracy}%
                      </Text>
                      <Text style={styles.scoreboardPlanes}>
                        {playerDown} plane{playerDown !== 1 ? "s" : ""} down,{" "}
                        {playerLeft} left
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.scoreboardRow,
                        styles.scoreboardRowOpponent,
                        playerWonGame
                          ? styles.scoreboardRowLoser
                          : styles.scoreboardRowWinner,
                      ]}
                    >
                      <View style={styles.scoreboardRowHeader}>
                        <Text style={styles.scoreboardName}>{opponentName}</Text>
                        <View
                          style={[
                            styles.scoreboardBadge,
                            playerWonGame
                              ? styles.scoreboardBadgeLose
                              : styles.scoreboardBadgeWin,
                          ]}
                        >
                          <Text style={styles.scoreboardBadgeText}>
                            {playerWonGame ? "LOSE" : "WIN"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scoreboardStats}>
                        {oppShots} shots · {oppHits} hits · {oppAccuracy}%
                      </Text>
                      <Text style={styles.scoreboardPlanes}>
                        {cpuDown} plane{cpuDown !== 1 ? "s" : ""} down, {cpuLeft}{" "}
                        left
                      </Text>
                    </View>
                  </View>
                )
              );
            })()}
            <SoundPressable
              style={styles.gameOverMainMenuBtn}
              onPress={handleMainMenuPress}
            >
              <Text style={styles.gameOverMainMenuBtnText}>
                Return to main menu
              </Text>
            </SoundPressable>
          </View>
        </View>
      )}
      {menuOpen && (
        <View style={styles.menuOverlayWrap} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.menuOverlay} />
          </TouchableWithoutFeedback>
          <View
            style={[styles.menuPanel, { top: 8 + insets.top }]}
            pointerEvents="box-none"
          >
            <View style={turnStyle}>
              <View style={styles.turnBarRow}>
                <View style={styles.turnBarLabelWrap} pointerEvents="none">
                  <Text style={turnTextStyle}>{turnLabel}</Text>
                </View>
                <View style={styles.turnBarRight}>
                  <Pressable
                    style={styles.burgerButton}
                    onPress={closeMenu}
                    accessibilityLabel="Close menu"
                  >
                    <View style={styles.burgerLine} />
                    <View style={styles.burgerLine} />
                    <View style={styles.burgerLine} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.turnBarMenu}>
                <View style={styles.soundSection}>
                  <Text style={styles.soundSectionTitle}>Sound</Text>
                  <View style={styles.soundRow}>
                    <Text style={styles.soundLabel}>Effects</Text>
                    <Slider
                      style={styles.soundSlider}
                      minimumValue={0}
                      maximumValue={1}
                      value={soundEffectsMuted ? 0 : soundEffectsVolume}
                      onValueChange={(v) => {
                        setSoundEffectsMuted(false);
                        setSoundEffectsVolume(v);
                      }}
                      minimumTrackTintColor={UI_WHITE}
                      maximumTrackTintColor="rgba(255,255,255,0.4)"
                      thumbTintColor={UI_WHITE}
                      disabled={soundEffectsMuted}
                    />
                    <Pressable
                      style={[
                        styles.soundMuteBtn,
                        soundEffectsMuted && styles.soundMuteBtnActive,
                      ]}
                      onPress={() =>
                        setSoundEffectsMuted(!soundEffectsMuted)
                      }
                    >
                      <Text style={styles.soundMuteBtnText}>
                        {soundEffectsMuted ? "Unmute" : "Mute"}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.soundRow}>
                    <Text style={styles.soundLabel}>Battle music</Text>
                    <Slider
                      style={styles.soundSlider}
                      minimumValue={0}
                      maximumValue={1}
                      value={battleMusicMuted ? 0 : battleMusicVolume}
                      onValueChange={(v) => {
                        setBattleMusicMuted(false);
                        setBattleMusicVolume(v);
                      }}
                      minimumTrackTintColor={UI_WHITE}
                      maximumTrackTintColor="rgba(255,255,255,0.4)"
                      thumbTintColor={UI_WHITE}
                      disabled={battleMusicMuted}
                    />
                    <Pressable
                      style={[
                        styles.soundMuteBtn,
                        battleMusicMuted && styles.soundMuteBtnActive,
                      ]}
                      onPress={() =>
                        setBattleMusicMuted(!battleMusicMuted)
                      }
                    >
                      <Text style={styles.soundMuteBtnText}>
                        {battleMusicMuted ? "Unmute" : "Mute"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                {!gameOver && !gaveUp && (
                  <Pressable
                    style={styles.menuItem}
                    onPress={handleGiveUpPress}
                  >
                    <Text
                      style={[styles.menuItemText, styles.menuItemTextDanger]}
                    >
                      Give up
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.menuItem}
                  onPress={handleMainMenuPress}
                >
                  <Text style={styles.menuItemText}>Return to main menu</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
      {!gameOver && !gaveUp && (
        <View style={[styles.bottomBar, { paddingBottom: 6 + insets.bottom }]}>
          <View style={styles.bottomBarStatsContainer}>
            <Text style={styles.bottomBarStatsText}>
              Time: {formatTime(elapsed)} · Shots: {attackShots ?? shots} ·
              Hits: {attackHits ?? hits.length} · {accuracy}%
            </Text>
          </View>
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
        </View>
      )}
    </View>
  );
}
