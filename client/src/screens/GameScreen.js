import { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ImageBackground,
  Alert,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import MathPaperBackground from "../components/MathPaperBackground";
import IntroScreen from "./IntroScreen";
import MainMenu from "../components/MainMenu";
import PlacementPhase from "../components/PlacementPhase";
import GamePhase from "../components/GamePhase";
import { createGame, shoot, giveUp as giveUpApi } from "../api";
import { PLANE_SHAPE, getShapeCells } from "../utils/planeShape";
import { DIFFICULTIES, MAP_OPTIONS } from "../constants";

const HIT_SOUND = require("../../assets/sounds/Big Explosion Sound Effect - Lightning Editor.mp3");

export default function GameScreen() {
  const [showIntro, setShowIntro] = useState(true);
  const [difficulty, setDifficulty] = useState("medium");
  const [gameId, setGameId] = useState(null);
  const [gridSize, setGridSize] = useState(10);
  const [hits, setHits] = useState([]);
  const [misses, setMisses] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [sunkPlaneId, setSunkPlaneId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [revealedCells, setRevealedCells] = useState([]);
  const [mapId, setMapId] = useState("default");
  const [gameMode, setGameMode] = useState("computer");
  const [numPlayers, setNumPlayers] = useState(2);
  const [customPlacement, setCustomPlacement] = useState(false);
  const [placementPhase, setPlacementPhase] = useState(false);
  const [placedPlanes, setPlacedPlanes] = useState([]);
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(0);
  const [placementRotation, setPlacementRotation] = useState(0);
  const [previewAt, setPreviewAt] = useState(null);
  const [selectedCol, setSelectedCol] = useState(0);
  const [selectedRow, setSelectedRow] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [explodingCell, setExplodingCell] = useState(null);

  const timerRef = useRef(null);
  const explosionTimeoutRef = useRef(null);
  const hitPlayer = useAudioPlayer(HIT_SOUND);

  const difficultyConfig =
    DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[1];
  const placementGridSize = placementPhase
    ? difficultyConfig.gridSize
    : gridSize;
  const placementNumPlanes = difficultyConfig.numPlanes;

  useEffect(() => {
    setSelectedCol((c) => Math.min(c, Math.max(0, gridSize - 1)));
    setSelectedRow((r) => Math.min(r, Math.max(0, gridSize - 1)));
  }, [gridSize]);

  useEffect(() => {
    if (!gameId || gameOver) return;
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [gameId, gameOver]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(
      () => setCooldownRemaining((c) => (c <= 0 ? 0 : c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [cooldownRemaining]);

  const startNewGame = useCallback(async () => {
    setLoading(true);
    setLastResult(null);
    setSunkPlaneId(null);
    setGameOver(false);
    setCooldownRemaining(0);
    setElapsed(0);
    setGaveUp(false);
    setRevealedCells([]);
    setExplodingCell(null);
    try {
      const res = await createGame(difficulty);
      setGameId(res.gameId);
      setGridSize(res.gridSize ?? difficultyConfig.gridSize);
      setHits(res.hits ?? []);
      setMisses(res.misses ?? []);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not start game");
    } finally {
      setLoading(false);
    }
  }, [difficulty, difficultyConfig.gridSize]);

  const startPlacementPhase = useCallback(() => {
    setPlacedPlanes(Array(difficultyConfig.numPlanes).fill(null));
    setSelectedPlaneIndex(0);
    setPlacementRotation(0);
    setPreviewAt(null);
    setPlacementPhase(true);
  }, [difficultyConfig.numPlanes]);

  const handleConfirmPlace = useCallback(() => {
    if (!previewAt) return;
    const cells = getShapeCells(
      PLANE_SHAPE,
      previewAt.row,
      previewAt.col,
      placementRotation,
      placementGridSize,
    );
    if (!cells) return;
    setPlacedPlanes((prev) => {
      const next = [...prev];
      next[selectedPlaneIndex] = {
        id: selectedPlaneIndex + 1,
        cells,
        head: cells[0],
      };
      return next;
    });
    setPreviewAt(null);
    setSelectedPlaneIndex((i) => Math.min(i + 1, placementNumPlanes - 1));
  }, [
    previewAt,
    placementRotation,
    placementGridSize,
    selectedPlaneIndex,
    placementNumPlanes,
  ]);

  const handleClearPlane = useCallback(() => {
    setPlacedPlanes((prev) => {
      const next = [...prev];
      next[selectedPlaneIndex] = null;
      return next;
    });
    setPreviewAt(null);
  }, [selectedPlaneIndex]);

  const startGameFromPlacement = useCallback(async () => {
    const planes = placedPlanes
      .filter(Boolean)
      .map((p) => ({ cells: p.cells, head: p.head }));
    if (planes.length !== placementNumPlanes) return;
    setLoading(true);
    setLastResult(null);
    setSunkPlaneId(null);
    setGameOver(false);
    setCooldownRemaining(0);
    setElapsed(0);
    setGaveUp(false);
    setRevealedCells([]);
    setExplodingCell(null);
    try {
      const res = await createGame(difficulty, planes);
      setGameId(res.gameId);
      setGridSize(res.gridSize ?? difficultyConfig.gridSize);
      setHits(res.hits ?? []);
      setMisses(res.misses ?? []);
      setPlacementPhase(false);
      setPlacedPlanes([]);
      setPreviewAt(null);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not start game");
    } finally {
      setLoading(false);
    }
  }, [difficulty, placedPlanes, placementNumPlanes, difficultyConfig.gridSize]);

  const goToMainMenu = useCallback(() => {
    setGameId(null);
    setGridSize(10);
    setHits([]);
    setMisses([]);
    setLastResult(null);
    setSunkPlaneId(null);
    setGameOver(false);
    setCooldownRemaining(0);
    setElapsed(0);
    setGaveUp(false);
    setRevealedCells([]);
    setExplodingCell(null);
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!gameId) {
      goToMainMenu();
      return;
    }
    Alert.alert("Give up", "Reveal planes and return to menu?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Give up",
        style: "destructive",
        onPress: async () => {
          try {
            const { planeCells } = await giveUpApi(gameId);
            setRevealedCells(planeCells || []);
            setGaveUp(true);
          } catch (e) {
            if (e.status === 404) {
              Alert.alert(
                "Game not found",
                "This game is no longer available (server may have restarted).",
                [{ text: "OK", onPress: goToMainMenu }],
              );
              goToMainMenu();
            } else {
              Alert.alert("Error", e.message || "Could not reveal planes");
            }
          }
        },
      },
    ]);
  }, [gameId, goToMainMenu]);

  const handleCellPress = useCallback(
    async (row, col) => {
      if (!gameId || gameOver || loading || cooldownRemaining > 0) return;
      setLoading(true);
      setLastResult(null);
      setSunkPlaneId(null);
      try {
        const res = await shoot(gameId, row, col);
        setHits(res.hits ?? hits);
        setMisses(res.misses ?? misses);
        setLastResult(res.result);
        if (res.sunkPlaneId != null) setSunkPlaneId(res.sunkPlaneId);
        if (res.gameOver) {
          setGameOver(true);
          Vibration.vibrate(300);
        } else if (res.result === "sunk") Vibration.vibrate(100);
        else if (res.result === "hit") Vibration.vibrate(50);
        if (res.result === "hit" || res.result === "sunk") {
          hitPlayer.seekTo(0);
          hitPlayer.play();
          setExplodingCell({ row, col });
          if (explosionTimeoutRef.current)
            clearTimeout(explosionTimeoutRef.current);
          explosionTimeoutRef.current = setTimeout(
            () => setExplodingCell(null),
            500,
          );
        }
        if (res.cooldownRemaining != null)
          setCooldownRemaining(res.cooldownRemaining);
      } catch (e) {
        if (e.status === 429) {
          const sec =
            e.data?.cooldownRemaining ??
            Math.ceil((e.data?.retryAfterMs ?? 1000) / 1000);
          setCooldownRemaining(sec);
        } else {
          Alert.alert("Error", e.message || "Shot failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [gameId, gameOver, loading, cooldownRemaining, hits, misses, hitPlayer],
  );

  const placementPreviewCells =
    previewAt &&
    getShapeCells(
      PLANE_SHAPE,
      previewAt.row,
      previewAt.col,
      placementRotation,
      placementGridSize,
    );
  const placementPreviewValid =
    placementPreviewCells &&
    !placementPreviewCells.some(({ row, col }) =>
      placedPlanes.some(
        (p, i) =>
          i !== selectedPlaneIndex &&
          p?.cells?.some((c) => c.row === row && c.col === col),
      ),
    );
  const allPlaced = placedPlanes.filter(Boolean).length === placementNumPlanes;
  const shots = hits.length + misses.length;
  const accuracy = shots > 0 ? Math.round((hits.length / shots) * 100) : 0;
  const effCol = Math.min(selectedCol, gridSize - 1);
  const effRow = Math.min(selectedRow, gridSize - 1);
  const coordCellShot =
    hits.some((h) => h.row === effRow && h.col === effCol) ||
    misses.some((m) => m.row === effRow && m.col === effCol) ||
    revealedCells?.some((c) => c.row === effRow && c.col === effCol);
  const highlightCell = !coordCellShot ? { row: effRow, col: effCol } : null;
  const canShootCoord =
    !!highlightCell &&
    !loading &&
    !gameOver &&
    !gaveUp &&
    cooldownRemaining === 0;

  const mapOption = MAP_OPTIONS.find((m) => m.id === mapId);
  const Wrapper = mapId === "default" ? View : ImageBackground;
  const wrapperProps =
    mapId === "default" ? {} : { source: mapOption?.image, style: { flex: 1 } };
  const insets = useSafeAreaInsets();

  const handleCoordShoot = useCallback(() => {
    if (!canShootCoord || !highlightCell) return;
    handleCellPress(highlightCell.row, highlightCell.col);
  }, [canShootCoord, highlightCell, handleCellPress]);

  if (showIntro) {
    return <IntroScreen onBegin={() => setShowIntro(false)} />;
  }

  return (
    <Wrapper
      {...wrapperProps}
      style={[styles.container, mapId !== "default" && styles.containerOverMap]}
    >
      {mapId === "default" && (
        <MathPaperBackground
          gridSize={placementPhase ? placementGridSize : gridSize}
        />
      )}
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: 20 + insets.top,
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {placementPhase ? (
          <PlacementPhase
            selectedPlaneIndex={selectedPlaneIndex}
            onSelectPlane={setSelectedPlaneIndex}
            placedPlanes={placedPlanes}
            placementRotation={placementRotation}
            onRotate={() => setPlacementRotation((r) => (r + 1) % 4)}
            onClearPlane={handleClearPlane}
            previewAt={previewAt}
            onPreviewChange={setPreviewAt}
            onConfirmPlace={handleConfirmPlace}
            placementGridSize={placementGridSize}
            placementPreviewCells={placementPreviewCells}
            placementPreviewValid={placementPreviewValid}
            allPlaced={allPlaced}
            onBack={() => setPlacementPhase(false)}
            onStartGame={startGameFromPlacement}
            loading={loading}
          />
        ) : !gameId ? (
          <MainMenu
            gameMode={gameMode}
            onGameModeChange={setGameMode}
            numPlayers={numPlayers}
            onNumPlayersChange={setNumPlayers}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            mapId={mapId}
            onMapIdChange={setMapId}
            customPlacement={customPlacement}
            onCustomPlacementToggle={() => setCustomPlacement((c) => !c)}
            loading={loading}
            onNewGame={startNewGame}
            onPlacePlanes={startPlacementPhase}
          />
        ) : (
          <GamePhase
            elapsed={elapsed}
            shots={shots}
            hits={hits}
            accuracy={accuracy}
            gaveUp={gaveUp}
            gameOver={gameOver}
            lastResult={lastResult}
            sunkPlaneId={sunkPlaneId}
            cooldownRemaining={cooldownRemaining}
            onGiveUp={handleGiveUp}
            onMainMenu={goToMainMenu}
            gridSize={gridSize}
            misses={misses}
            revealedCells={revealedCells}
            onCellPress={handleCellPress}
            gridDisabled={
              loading || gameOver || gaveUp || cooldownRemaining > 0
            }
            mapBackground={mapId !== "default"}
            defaultMap={mapId === "default"}
            highlightCell={highlightCell}
            explodingCell={explodingCell}
            selectedCol={effCol}
            selectedRow={effRow}
            onColChange={setSelectedCol}
            onRowChange={setSelectedRow}
            onShoot={handleCoordShoot}
            canShootCoord={canShootCoord}
            coordDisabled={loading || cooldownRemaining > 0}
            onPadTouchStart={() => setScrollEnabled(false)}
            onPadTouchEnd={() => setScrollEnabled(true)}
          />
        )}
      </ScrollView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  containerOverMap: { backgroundColor: "transparent" },
  scroll: { paddingHorizontal: 20, alignItems: "center" },
});
