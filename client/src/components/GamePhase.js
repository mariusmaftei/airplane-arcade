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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatTime } from "../utils/format";
import Grid from "./Grid";
import CoordPicker from "./CoordPicker";
import OpponentBoardCarousel from "./OpponentBoardCarousel";
import {
  UI_PRIMARY,
  UI_WHITE,
  UI_SUCCESS,
  UI_DANGER,
  UI_BODY_MUTED,
} from "../constants/constants";

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
  gaveUpText: { fontSize: 14, color: UI_BODY_MUTED },
  win: { fontSize: 16, fontWeight: "600", color: UI_SUCCESS },
  lose: { fontSize: 16, fontWeight: "600", color: UI_DANGER },
  gameOverCard: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: UI_SUCCESS,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gameOverCardLose: {
    borderColor: UI_DANGER,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "800",
    color: UI_SUCCESS,
    marginBottom: 6,
  },
  winnerNameText: {
    fontSize: 20,
    fontWeight: "700",
    color: UI_PRIMARY,
    marginBottom: 12,
  },
  gameOverStats: {
    fontSize: 14,
    fontWeight: "600",
    color: UI_BODY_MUTED,
  },
  loseTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: UI_DANGER,
    marginBottom: 4,
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
    turnLabel = "CPU turn";
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
        <View style={styles.feedbackSlot}>
          {gaveUp ? (
            <Text style={styles.gaveUpText}>You gave up — planes revealed</Text>
          ) : gameOver ? (
            playerWon === false ? (
              <View
                style={[
                  styles.gameOverCard,
                  styles.gameOverCardLose,
                ]}
              >
                <Text style={styles.loseTitleText}>Game over</Text>
                <Text style={styles.gameOverStats}>CPU wins</Text>
              </View>
            ) : (
              <View style={styles.gameOverCard}>
                <Text style={styles.congratsText}>Congrats!</Text>
                <Text style={styles.winnerNameText}>{name} wins!</Text>
                <Text style={styles.gameOverStats}>
                  Time: {formatTime(elapsed)} · Accuracy: {accuracy}%
                </Text>
              </View>
            )
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
          />
        </View>
      </ScrollView>
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
