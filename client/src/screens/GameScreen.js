import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import {
  StyleSheet,
  View,
  Text,
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
import { DockDragShadow } from "../components/PlaneDock";
import {
  getPlacementCellSize,
  PLACEMENT_LABEL_WIDTH,
} from "../components/PlacementGrid";
import VersusScreen from "../components/VersusScreen";
import GamePhase from "../components/GamePhase";
import {
  createGame,
  shoot,
  giveUp as giveUpApi,
  cpuShoot as cpuShootApi,
} from "../services/game-services";
import {
  PLANE_SHAPE,
  getShapeCells,
  getShapeCellsFromHead,
} from "../utils/planeShape";
import {
  DIFFICULTIES,
  MAP_OPTIONS,
  UI_PAGE_BG,
  BATTLE_MUSIC_TRACKS,
  WINNING_SOUND,
} from "../constants/constants";

const HIT_SOUND = require("../../assets/sounds/Big Explosion Sound Effect - Lightning Editor.mp3");
const MISS_SOUND = require("../../assets/sounds/Sound Effect - Missile Launch.mp3");
const PLANE_COLORS = ["#5c6bc0", "#43a047", "#fb8c00"];

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
  const [playerName, setPlayerName] = useState("Player1");
  const [gameMode, setGameMode] = useState("computer");
  const [numPlayers, setNumPlayers] = useState(2);
  const [customPlacement, setCustomPlacement] = useState(true);
  const [placementPhase, setPlacementPhase] = useState(false);
  const [placedPlanes, setPlacedPlanes] = useState([]);
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(0);
  const [placementRotation, setPlacementRotation] = useState(0);
  const [previewAt, setPreviewAt] = useState(null);
  const [movingPlaneIndex, setMovingPlaneIndex] = useState(null);
  const [placementGridDragging, setPlacementGridDragging] = useState(false);
  const [dockDragPosition, setDockDragPosition] = useState(null);
  const [dockDragOverGrid, setDockDragOverGrid] = useState(false);
  const placementGridContainerRef = useRef(null);
  const [selectedCol, setSelectedCol] = useState(0);
  const [selectedRow, setSelectedRow] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [explodingCell, setExplodingCell] = useState(null);
  const [smokeCell, setSmokeCell] = useState(null);
  const [isMatch, setIsMatch] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [turnSwitchDelay, setTurnSwitchDelay] = useState(false);
  const [playerBoardHits, setPlayerBoardHits] = useState([]);
  const [playerBoardMisses, setPlayerBoardMisses] = useState([]);
  const [playerWon, setPlayerWon] = useState(null);
  const [showVersusScreen, setShowVersusScreen] = useState(false);
  const [versusLeftName, setVersusLeftName] = useState("");
  const [versusRightName, setVersusRightName] = useState("");

  const timerRef = useRef(null);
  const versusTimeoutRef = useRef(null);
  const explosionTimeoutRef = useRef(null);
  const smokeTimeoutRef = useRef(null);
  const turnSwitchTimeoutRef = useRef(null);
  const battleTrackIndexRef = useRef(0);
  const isBattleActiveRef = useRef(false);
  const hitPlayer = useAudioPlayer(HIT_SOUND, { shouldPlay: false });
  const missPlayer = useAudioPlayer(MISS_SOUND, { shouldPlay: false });
  const battleMusicPlayer = useAudioPlayer(null, { shouldPlay: false });
  const winningPlayer = useAudioPlayer(WINNING_SOUND, { shouldPlay: false });

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
    hitPlayer.volume = 0.4;
    missPlayer.volume = 0.5;
    winningPlayer.volume = 0.6;
  }, [hitPlayer, missPlayer, winningPlayer]);

  useEffect(() => {
    if (playerWon === true) {
      winningPlayer.seekTo(0);
      winningPlayer.play();
    }
  }, [playerWon, winningPlayer]);

  const isBattleActive =
    gameId && !placementPhase && !gameOver && !gaveUp;
  isBattleActiveRef.current = isBattleActive;

  const playNextBattleTrack = useCallback(() => {
    if (BATTLE_MUSIC_TRACKS.length === 0) return;
    const nextIndex =
      (battleTrackIndexRef.current + 1) % BATTLE_MUSIC_TRACKS.length;
    battleTrackIndexRef.current = nextIndex;
    const track = BATTLE_MUSIC_TRACKS[nextIndex];
    battleMusicPlayer.replace(track);
    battleMusicPlayer.volume = 0.35;
    battleMusicPlayer.loop = false;
    battleMusicPlayer.seekTo(0);
    battleMusicPlayer.play();
  }, [battleMusicPlayer]);

  useEffect(() => {
    if (isBattleActive) {
      battleTrackIndexRef.current = Math.floor(
        Math.random() * BATTLE_MUSIC_TRACKS.length,
      );
      const track =
        BATTLE_MUSIC_TRACKS[battleTrackIndexRef.current];
      battleMusicPlayer.replace(track);
      battleMusicPlayer.volume = 0.35;
      battleMusicPlayer.loop = false;
      battleMusicPlayer.seekTo(0);
      battleMusicPlayer.play();
    } else {
      battleMusicPlayer.pause();
    }
  }, [isBattleActive, battleMusicPlayer]);

  useEffect(() => {
    const disposer = battleMusicPlayer?.addListener?.(
      "playbackStatusUpdate",
      (status) => {
        if (status?.didJustFinish && isBattleActiveRef.current) {
          playNextBattleTrack();
        }
      },
    );
    return () => disposer?.remove?.();
  }, [battleMusicPlayer, playNextBattleTrack]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const t = setInterval(
      () => setCooldownRemaining((c) => (c <= 0 ? 0 : c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [cooldownRemaining]);

  useEffect(() => {
    return () => {
      if (versusTimeoutRef.current) clearTimeout(versusTimeoutRef.current);
      if (turnSwitchTimeoutRef.current)
        clearTimeout(turnSwitchTimeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!dockDragPosition) {
      setDockDragOverGrid(false);
      return;
    }
    const node = placementGridContainerRef.current;
    if (!node) return;
    node.measureInWindow((x, y, w, h) => {
      const { pageX, pageY } = dockDragPosition;
      const inside =
        pageX >= x && pageX <= x + w && pageY >= y && pageY <= y + h;
      setDockDragOverGrid(inside);
      if (inside && placementPhase) {
        const cellSize = getPlacementCellSize(placementGridSize);
        const localX = pageX - x;
        const localY = pageY - y;
        const col = Math.floor((localX - PLACEMENT_LABEL_WIDTH) / cellSize);
        const row = Math.floor((localY - cellSize) / cellSize);
        if (
          row >= 0 &&
          row < placementGridSize &&
          col >= 0 &&
          col < placementGridSize
        ) {
          setPreviewAt({ row, col });
        } else {
          setPreviewAt(null);
        }
      } else if (inside === false) {
        setPreviewAt(null);
      }
    });
  }, [dockDragPosition, placementPhase, placementGridSize]);

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
    setSmokeCell(null);
    setTurnSwitchDelay(false);
    setIsPlayerTurn(true);
    setPlayerBoardHits([]);
    setPlayerBoardMisses([]);
    setPlayerWon(null);
    try {
      const vsCpu = gameMode === "computer";
      const res = await createGame(difficulty, null, { vsCpu });
      setGameId(res.gameId);
      setGridSize(res.gridSize ?? difficultyConfig.gridSize);
      setHits(res.hits ?? []);
      setMisses(res.misses ?? []);
      setIsMatch(res.isMatch ?? false);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not start game");
    } finally {
      setLoading(false);
    }
  }, [difficulty, difficultyConfig.gridSize, gameMode]);

  const startPlacementPhase = useCallback(() => {
    setPlacedPlanes(Array(difficultyConfig.numPlanes).fill(null));
    setSelectedPlaneIndex(0);
    setPlacementRotation(0);
    setPreviewAt(null);
    setPlacementPhase(true);
  }, [difficultyConfig.numPlanes]);

  const handleConfirmPlace = useCallback(
    (arg) => {
      const at = typeof arg === "object" && arg?.at ? arg.at : arg ?? previewAt;
      if (!at) return;
      const planeIndex =
        typeof arg === "object" && typeof arg?.planeIndex === "number"
          ? arg.planeIndex
          : selectedPlaneIndex;
      const rotation =
        typeof arg === "object" && typeof arg?.rotation === "number"
          ? arg.rotation
          : movingPlaneIndex != null
            ? placedPlanes[movingPlaneIndex]?.rotation ?? 0
            : placementRotation;
      const cells = getShapeCellsFromHead(
        PLANE_SHAPE,
        at.row,
        at.col,
        rotation,
        placementGridSize,
      );
      if (!cells) return;
      setPlacedPlanes((prev) => {
        const next = prev.length ? [...prev] : Array(placementNumPlanes).fill(null);
        next[planeIndex] = {
          id: planeIndex + 1,
          cells,
          head: cells[0],
          rotation,
        };
        return next;
      });
    setPreviewAt(null);
      setMovingPlaneIndex(null);
    setDockDragPosition(null);
    setSelectedPlaneIndex((i) => Math.min(i + 1, placementNumPlanes - 1));
  },
    [
      previewAt,
      placementGridSize,
      selectedPlaneIndex,
      placementNumPlanes,
      movingPlaneIndex,
      placedPlanes,
    ],
  );

  const handleClearPlane = useCallback(() => {
    setPlacedPlanes((prev) => {
      const next = [...prev];
      next[selectedPlaneIndex] = null;
      return next;
    });
    setPreviewAt(null);
    setMovingPlaneIndex(null);
    setDockDragPosition(null);
  }, [selectedPlaneIndex]);

  const handleSelectPlane = useCallback((index) => {
    setSelectedPlaneIndex(index);
    setPreviewAt(null);
    setMovingPlaneIndex(null);
    setDockDragPosition(null);
  }, []);

  const handleStartMovePlane = useCallback(
    (planeIndex, headRow, headCol) => {
      setMovingPlaneIndex(planeIndex);
      setSelectedPlaneIndex(planeIndex);
      setPreviewAt({ row: headRow, col: headCol });
      setPlacementRotation(() => placedPlanes[planeIndex]?.rotation ?? 0);
    },
    [placedPlanes],
  );

  const handleEndMovePlane = useCallback(() => {
    if (movingPlaneIndex == null) return;
    if (!previewAt || !placementPreviewValid) {
      setPreviewAt(null);
    }
    setMovingPlaneIndex(null);
  }, [movingPlaneIndex, previewAt, placementPreviewValid]);

  const handleDockDragEnd = useCallback(
    (wasOverGrid, dropCell) => {
      if (wasOverGrid && dropCell) {
        setPreviewAt(dropCell);
      } else {
        setPreviewAt(null);
      }
    },
    [],
  );

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
    setSmokeCell(null);
    setTurnSwitchDelay(false);
    setIsMatch(true);
    setIsPlayerTurn(true);
    setPlayerBoardHits([]);
    setPlayerBoardMisses([]);
    setPlayerWon(null);
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
    setSmokeCell(null);
    setTurnSwitchDelay(false);
    setIsMatch(false);
    setIsPlayerTurn(true);
    setPlayerBoardHits([]);
    setPlayerBoardMisses([]);
    setPlayerWon(null);
    setShowVersusScreen(false);
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
      if (turnSwitchDelay) return;
      if (isMatch && !isPlayerTurn) return;
      setLoading(true);
      setLastResult(null);
      setSunkPlaneId(null);
      try {
        const res = await shoot(gameId, row, col);
        setHits(res.hits ?? hits);
        setMisses(res.misses ?? misses);
        setLastResult(res.result);
        if (res.sunkPlaneId != null) setSunkPlaneId(res.sunkPlaneId);
        if (res.isPlayerTurn !== undefined) {
          if (res.result === "miss") {
            setTurnSwitchDelay(true);
            setVersusLeftName("CPU");
            setVersusRightName((playerName || "Player1").trim() || "Player1");
            if (versusTimeoutRef.current)
              clearTimeout(versusTimeoutRef.current);
            if (turnSwitchTimeoutRef.current)
              clearTimeout(turnSwitchTimeoutRef.current);
            versusTimeoutRef.current = setTimeout(() => {
              setShowVersusScreen(true);
              turnSwitchTimeoutRef.current = setTimeout(() => {
                setIsPlayerTurn(res.isPlayerTurn);
                setTurnSwitchDelay(false);
                setShowVersusScreen(false);
              }, 2000);
            }, 2000);
          } else {
            setIsPlayerTurn(res.isPlayerTurn);
          }
        }
        if (res.gameOver) {
          setGameOver(true);
          setPlayerWon(true);
          Vibration.vibrate(300);
        } else if (res.result === "sunk") Vibration.vibrate(100);
        else if (res.result === "hit") Vibration.vibrate(50);
        if (res.result === "hit" || res.result === "sunk") {
          try {
            hitPlayer.seekTo(0);
            hitPlayer.play();
          } catch (e) {
            console.warn("Hit sound play failed:", e);
          }
          setExplodingCell({ row, col });
          if (explosionTimeoutRef.current)
            clearTimeout(explosionTimeoutRef.current);
          explosionTimeoutRef.current = setTimeout(
            () => setExplodingCell(null),
            500,
          );
        } else if (res.result === "miss") {
          try {
            missPlayer.seekTo(0);
            missPlayer.play();
          } catch (e) {
            console.warn("Miss sound play failed:", e);
          }
          setSmokeCell({ row, col });
          if (smokeTimeoutRef.current) clearTimeout(smokeTimeoutRef.current);
          smokeTimeoutRef.current = setTimeout(() => setSmokeCell(null), 800);
        }
        if (res.cooldownRemaining != null)
          setCooldownRemaining(res.cooldownRemaining);
      } catch (e) {
        if (e.status === 429) {
          const sec =
            e.data?.cooldownRemaining ??
            Math.ceil((e.data?.retryAfterMs ?? 1000) / 1000);
          setCooldownRemaining(sec);
        } else if (e.status === 400 && e.data?.error === "Not your turn") {
          setIsPlayerTurn(false);
          setTurnSwitchDelay(false);
        } else {
          Alert.alert("Error", e.message || "Shot failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      gameId,
      gameOver,
      loading,
      cooldownRemaining,
      turnSwitchDelay,
      hits,
      misses,
      hitPlayer,
      missPlayer,
      isMatch,
      isPlayerTurn,
      playerName,
    ],
  );

  useEffect(() => {
    if (
      !gameId ||
      !isMatch ||
      isPlayerTurn ||
      gameOver ||
      gaveUp ||
      loading ||
      turnSwitchDelay
    )
      return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await cpuShootApi(gameId);
        setPlayerBoardHits(res.playerHits ?? []);
        setPlayerBoardMisses(res.playerMisses ?? []);
        if (res.gameOver) {
          setGameOver(true);
          setPlayerWon(false);
          setIsPlayerTurn(res.isPlayerTurn ?? true);
        } else if (res.result === "miss") {
          setTurnSwitchDelay(true);
          setVersusLeftName((playerName || "Player1").trim() || "Player1");
          setVersusRightName("CPU");
          if (versusTimeoutRef.current) clearTimeout(versusTimeoutRef.current);
          if (turnSwitchTimeoutRef.current)
            clearTimeout(turnSwitchTimeoutRef.current);
          versusTimeoutRef.current = setTimeout(() => {
            setShowVersusScreen(true);
            turnSwitchTimeoutRef.current = setTimeout(() => {
              setIsPlayerTurn(res.isPlayerTurn ?? true);
              setTurnSwitchDelay(false);
              setShowVersusScreen(false);
            }, 2000);
          }, 2000);
        } else {
          setIsPlayerTurn(res.isPlayerTurn ?? true);
        }
        if (res.result === "hit" || res.result === "sunk") {
          try {
            hitPlayer.seekTo(0);
            hitPlayer.play();
          } catch (e) {
            console.warn("Hit sound play failed:", e);
          }
          if (res.cell)
            setExplodingCell({ row: res.cell.row, col: res.cell.col });
          setTimeout(() => setExplodingCell(null), 500);
        } else if (res.result === "miss" && res.cell) {
          try {
            missPlayer.seekTo(0);
            missPlayer.play();
          } catch (e) {
            console.warn("Miss sound play failed:", e);
          }
          setSmokeCell({ row: res.cell.row, col: res.cell.col });
          setTimeout(() => setSmokeCell(null), 800);
        }
      } catch (e) {
        setIsPlayerTurn(true);
        setTurnSwitchDelay(false);
        if (e.status !== 400 || e.data?.error !== "Not CPU turn") {
          Alert.alert("Error", e.message || "CPU shot failed");
        }
      } finally {
        setLoading(false);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [
    gameId,
    isMatch,
    isPlayerTurn,
    gameOver,
    gaveUp,
    loading,
    turnSwitchDelay,
    hitPlayer,
    missPlayer,
  ]);

  const effectivePlacementRotation =
    movingPlaneIndex != null
      ? placedPlanes[movingPlaneIndex]?.rotation ?? 0
      : placementRotation;
  const placementPreviewCells =
    previewAt &&
    getShapeCellsFromHead(
      PLANE_SHAPE,
      previewAt.row,
      previewAt.col,
      effectivePlacementRotation,
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
  const gridHits = isMatch && !isPlayerTurn ? playerBoardHits : hits;
  const gridMisses = isMatch && !isPlayerTurn ? playerBoardMisses : misses;
  const gridRevealed = isMatch && !isPlayerTurn ? revealedCells : [];
  const effectiveIsPlayerTurn = isMatch
    ? isPlayerTurn
    : !loading && cooldownRemaining === 0 && !gameOver && !gaveUp;
  const canShootCoord =
    !!highlightCell &&
    !loading &&
    !gameOver &&
    !gaveUp &&
    !turnSwitchDelay &&
    cooldownRemaining === 0 &&
    (!isMatch || isPlayerTurn);

  const mapOption = MAP_OPTIONS.find((m) => m.id === mapId);
  const isMainMenu = !gameId && !placementPhase;
  const Wrapper =
    isMainMenu ? View : mapId === "default" ? View : ImageBackground;
  const wrapperProps =
    isMainMenu || mapId === "default"
      ? {}
      : { source: mapOption?.image, style: { flex: 1 } };
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
      style={[
        styles.container,
        !isMainMenu && mapId !== "default" && styles.containerOverMap,
      ]}
    >
      {(isMainMenu || mapId === "default" || placementPhase) && (
        <MathPaperBackground
          gridSize={placementPhase ? placementGridSize : gridSize}
        />
      )}
      {placementPhase ? (
        <>
          <View
            style={[
              styles.scroll,
              styles.placementWrapper,
              {
                paddingTop: 20 + insets.top,
                paddingBottom: 40 + insets.bottom,
              },
            ]}
          >
            <PlacementPhase
              selectedPlaneIndex={selectedPlaneIndex}
              onSelectPlane={handleSelectPlane}
              placedPlanes={placedPlanes}
              placementRotation={placementRotation}
              onRotate={() => setPlacementRotation((r) => (r + 1) % 4)}
              onClearPlane={handleClearPlane}
              previewAt={previewAt}
              onPreviewChange={(pos) => {
                setPreviewAt(pos);
                setDockDragPosition(null);
              }}
              onConfirmPlace={handleConfirmPlace}
              onStartMovePlane={handleStartMovePlane}
              onDragEnd={handleEndMovePlane}
              onDragActiveChange={setPlacementGridDragging}
              onDockDragPosition={setDockDragPosition}
              onDockDragEnd={handleDockDragEnd}
              dockDragPosition={dockDragPosition}
              placementGridContainerRef={placementGridContainerRef}
              movingPlaneIndex={movingPlaneIndex}
              placementGridSize={placementGridSize}
              placementPreviewCells={placementPreviewCells}
              placementPreviewValid={placementPreviewValid}
              allPlaced={allPlaced}
              onBack={() => setPlacementPhase(false)}
              onStartGame={startGameFromPlacement}
              loading={loading}
            />
          </View>
          {dockDragPosition && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View
                style={[
                  styles.dragBanner,
                  { top: 20 + insets.top + 8 },
                ]}
              >
                <Text style={styles.dragBannerText}>
                  Holding plane{" "}
                  {(dockDragPosition.planeIndex ?? selectedPlaneIndex) + 1} •{" "}
                  Release on board to place
                </Text>
              </View>
              {!dockDragOverGrid && (
              <DockDragShadow
                pageX={dockDragPosition.pageX}
                pageY={dockDragPosition.pageY}
                rotation={placementRotation}
                placementGridSize={placementGridSize}
                planeColor={
                  PLANE_COLORS[
                    (dockDragPosition.planeIndex ?? selectedPlaneIndex) %
                      PLANE_COLORS.length
                  ]
                }
              />
              )}
            </View>
          )}
        </>
      ) : !gameId ? (
        <View
          style={[
            styles.scroll,
            styles.mainMenuWrapper,
            {
              paddingTop: 20 + insets.top,
              paddingBottom: 40 + insets.bottom,
            },
          ]}
        >
          <MainMenu
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
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
        </View>
      ) : showVersusScreen ? (
        <View style={styles.gameView}>
          {mapId === "default" && <MathPaperBackground gridSize={gridSize} />}
          <VersusScreen
            leftName={versusLeftName}
            rightName={versusRightName}
            mapImage={mapOption?.image}
          />
        </View>
      ) : (
        <View style={styles.gameView}>
          <GamePhase
            gameMode={gameMode}
            numPlayers={numPlayers}
            playerName={playerName}
            isPlayerTurn={effectiveIsPlayerTurn}
            gaveUp={gaveUp}
            gameOver={gameOver}
            playerWon={playerWon}
            elapsed={elapsed}
            shots={shots}
            hits={gridHits}
            accuracy={accuracy}
            lastResult={lastResult}
            sunkPlaneId={sunkPlaneId}
            cooldownRemaining={cooldownRemaining}
            onGiveUp={handleGiveUp}
            onMainMenu={goToMainMenu}
            gridSize={gridSize}
            misses={gridMisses}
            revealedCells={gridRevealed}
            carouselHits={
              isMatch ? (isPlayerTurn ? playerBoardHits : hits) : undefined
            }
            carouselMisses={
              isMatch ? (isPlayerTurn ? playerBoardMisses : misses) : undefined
            }
            carouselRevealed={
              isMatch ? (isPlayerTurn ? revealedCells : []) : undefined
            }
            carouselLabel={
              isMatch
                ? isPlayerTurn
                  ? (playerName || "Player1").trim() || "Player1"
                  : "CPU"
                : undefined
            }
            attackShots={isMatch ? hits.length + misses.length : undefined}
            attackHits={isMatch ? hits.length : undefined}
            onCellPress={handleCellPress}
            gridDisabled={
              loading ||
              gameOver ||
              gaveUp ||
              turnSwitchDelay ||
              cooldownRemaining > 0 ||
              (isMatch && !isPlayerTurn)
            }
            mapBackground={mapId !== "default"}
            defaultMap={mapId === "default"}
            highlightCell={isMatch && !isPlayerTurn ? null : highlightCell}
            explodingCell={explodingCell}
            smokeCell={smokeCell}
            selectedCol={effCol}
            selectedRow={effRow}
            onColChange={setSelectedCol}
            onRowChange={setSelectedRow}
            onShoot={handleCoordShoot}
            canShootCoord={canShootCoord}
            coordDisabled={
              loading ||
              turnSwitchDelay ||
              cooldownRemaining > 0 ||
              (isMatch && !isPlayerTurn)
            }
            onPadTouchStart={() => setScrollEnabled(false)}
            onPadTouchEnd={() => setScrollEnabled(true)}
          />
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI_PAGE_BG },
  containerOverMap: { backgroundColor: "transparent" },
  scroll: { paddingHorizontal: 20, alignItems: "center" },
  placementWrapper: { flex: 1 },
  mainMenuWrapper: { flex: 1, justifyContent: "center" },
  gameView: { flex: 1 },
  dragBanner: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(44, 62, 80, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dragBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
});
