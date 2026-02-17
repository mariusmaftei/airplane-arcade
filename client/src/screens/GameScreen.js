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
import VideoMapBackground from "../components/VideoMapBackground";
import IntroScreen from "./IntroScreen";
import MainMenu from "../components/MainMenu";
import PlacementPhase from "../components/PlacementPhase";
import { DockDragShadow } from "../components/PlaneDock";
import {
  getPlacementCellSize,
  PLACEMENT_WIDTH_RATIO,
  PLACEMENT_LABEL_WIDTH,
} from "../components/PlacementGrid";
import VersusScreen from "../components/VersusScreen";
import GamePhase from "../components/GamePhase";
import LanHostLobby from "../components/LanHostLobby";
import LanHostSetup from "../components/LanHostSetup";
import SoundPressable from "../components/SoundPressable";
import {
  createGame,
  shoot,
  giveUp as giveUpApi,
  cpuShoot as cpuShootApi,
  lanLookup,
  lanJoin,
  lanStatus,
  lanJoining,
  lanHostReady,
  lanJoinerReady,
} from "../services/game-services";
import {
  PLANE_SHAPE,
  getShapeCells,
  getShapeCellsFromHead,
  generateRandomPlanes,
} from "../utils/planeShape";
import {
  DIFFICULTIES,
  MAP_OPTIONS,
  UI_PAGE_BG,
  UI_PRIMARY,
  UI_WHITE,
  BATTLE_MUSIC_TRACKS,
  WINNING_SOUND,
} from "../constants/constants";
import { useSoundSettings } from "../contexts/SoundSettingsContext";
import { useApiConfig } from "../contexts/ApiConfigContext";

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
  const [playerPlanesSunk, setPlayerPlanesSunk] = useState(0);
  const [cpuPlanesSunk, setCpuPlanesSunk] = useState(0);
  const [playerWon, setPlayerWon] = useState(null);
  const [showVersusScreen, setShowVersusScreen] = useState(false);
  const [versusLeftName, setVersusLeftName] = useState("");
  const [versusRightName, setVersusRightName] = useState("");
  const [versusTurnName, setVersusTurnName] = useState("");
  const [lanMode, setLanMode] = useState(null);
  const [lanPlayerSide, setLanPlayerSide] = useState(null);
  const [lanLobbyCode, setLanLobbyCode] = useState("");
  const [lanHostIp, setLanHostIp] = useState("");
  const [lanWaitingForOpponent, setLanWaitingForOpponent] = useState(false);
  const [lanConnectionLost, setLanConnectionLost] = useState(false);
  const [lanJoiningPlayer, setLanJoiningPlayer] = useState(null);
  const [lanJoinerReadyFromServer, setLanJoinerReadyFromServer] = useState(false);
  const [lanConnectedPlayerName, setLanConnectedPlayerName] = useState(null);
  const [lanOpponentName, setLanOpponentName] = useState(null);
  const [lanOpponents, setLanOpponents] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [lanCurrentTurnName, setLanCurrentTurnName] = useState(null);
  const [lanCurrentTurnId, setLanCurrentTurnId] = useState(null);
  const [lanAllPlayers, setLanAllPlayers] = useState([]);
  const [lanHostReadySent, setLanHostReadySent] = useState(false);
  const [lanJoinerReadySent, setLanJoinerReadySent] = useState(false);
  const [lanWaitingForHost, setLanWaitingForHost] = useState(false);
  const [lanHostReadyFromServer, setLanHostReadyFromServer] = useState(false);
  const [lanJoinInfo, setLanJoinInfo] = useState(null);
  const [lanJoinStatus, setLanJoinStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showLanHostSetup, setShowLanHostSetup] = useState(false);
  const [lanHostConfig, setLanHostConfig] = useState({
    password: null,
    minPlayers: 2,
    maxPlayers: 2,
  });
  const lanHostConfigRef = useRef(lanHostConfig);
  lanHostConfigRef.current = lanHostConfig;
  const lanServerUrlRef = useRef(null);
  const lanJoinerBaseUrlRef = useRef(null);
  const lastTurnSwitchAtShownRef = useRef(0);

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
  const {
    soundEffectsVolumeEffective,
    battleMusicVolumeEffective,
  } = useSoundSettings();
  const { baseUrl, setServerUrlOverride, resetServerUrl } = useApiConfig();

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
    const v = soundEffectsVolumeEffective;
    hitPlayer.volume = 0.4 * v;
    missPlayer.volume = 0.5 * v;
    winningPlayer.volume = 0.6 * v;
  }, [
    hitPlayer,
    missPlayer,
    winningPlayer,
    soundEffectsVolumeEffective,
  ]);

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
    battleMusicPlayer.volume = 0.35 * battleMusicVolumeEffective;
    battleMusicPlayer.loop = false;
    battleMusicPlayer.seekTo(0);
    battleMusicPlayer.play();
  }, [battleMusicPlayer, battleMusicVolumeEffective]);

  useEffect(() => {
    battleMusicPlayer.volume = 0.35 * battleMusicVolumeEffective;
  }, [battleMusicPlayer, battleMusicVolumeEffective]);

  useEffect(() => {
    if (isBattleActive) {
      battleTrackIndexRef.current = Math.floor(
        Math.random() * BATTLE_MUSIC_TRACKS.length,
      );
      const track =
        BATTLE_MUSIC_TRACKS[battleTrackIndexRef.current];
      battleMusicPlayer.replace(track);
      battleMusicPlayer.volume = 0.35 * battleMusicVolumeEffective;
      battleMusicPlayer.loop = false;
      battleMusicPlayer.seekTo(0);
      battleMusicPlayer.play();
    } else {
      battleMusicPlayer.pause();
    }
  }, [isBattleActive, battleMusicPlayer, battleMusicVolumeEffective]);

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
        const cellSize = getPlacementCellSize(placementGridSize, PLACEMENT_WIDTH_RATIO);
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
    setPlayerPlanesSunk(0);
    setCpuPlanesSunk(0);
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

  const startPlacementPhase = useCallback((overrides = {}) => {
    const numPlanes = overrides.numPlanes ?? difficultyConfig.numPlanes;
    const gridSize = overrides.gridSize ?? difficultyConfig.gridSize;
    setPlacedPlanes(Array(numPlanes).fill(null));
    setSelectedPlaneIndex(0);
    setPlacementRotation(0);
    setPreviewAt(null);
    setPlacementPhase(true);
    if (overrides.lanJoin) {
      setLanJoinInfo(overrides.lanJoin);
    }
  }, [difficultyConfig.numPlanes, difficultyConfig.gridSize]);

  const startHostLan = useCallback(() => {
    setLanMode("host");
    setShowLanHostSetup(true);
  }, []);

  const handleLanHostSetupContinue = useCallback((config) => {
    const c = config ?? { password: null, minPlayers: 2, maxPlayers: 2 };
    lanHostConfigRef.current = c;
    setLanHostConfig(c);
    setShowLanHostSetup(false);
    startPlacementPhase();
  }, [startPlacementPhase]);

  const handleJoinLanFound = useCallback((info) => {
    setLanJoinInfo(info);
    setLanJoinStatus("connecting");
    setLanMode("join");
    setGridSize(info.gridSize ?? 10);
    const numPlanes = info.numPlanes ?? 3;
    const diff =
      info.gridSize <= 8 ? "easy" : info.gridSize <= 10 ? "medium" : "hard";
    setDifficulty(diff);
    setPlacementPhase(false);
    setPlacedPlanes(Array(numPlanes).fill(null));
    setSelectedPlaneIndex(0);
    setPlacementRotation(0);
    setPreviewAt(null);
    const base = info.joinBaseUrl || baseUrl;
    if (info.gameId && base) {
      lanJoining(info.gameId, base, {
        playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
      })
        .then(() => setLanJoinStatus("connected"))
        .catch(() => setLanJoinStatus("failed"));
    } else {
      setLanJoinStatus("connected");
    }
  }, [playerName, baseUrl]);

  const handleJoinPlacePlanes = useCallback(() => {
    if (!lanJoinInfo) return;
    setPlacementPhase(true);
  }, [lanJoinInfo]);

  const handleJoinWithRandomPlanes = useCallback(
    async (info) => {
      const base = info.joinBaseUrl || baseUrl;
      if (!info.gameId || !base) return;
      setJoinLoading(true);
      try {
        await lanJoining(info.gameId, base, {
          playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
        });
        const gridSize = info.gridSize ?? 10;
        const numPlanes = info.numPlanes ?? 3;
        const planes = generateRandomPlanes(gridSize, numPlanes);
        if (planes.length !== numPlanes) throw new Error("Could not generate planes");
        const res = await lanJoin(info.gameId, planes, base, {
          password: info.joinPassword,
          playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
        });
        lanJoinerBaseUrlRef.current = base;
        setGameId(res.gameId);
        setGridSize(res.gridSize ?? info.gridSize);
        setHits([]);
        setMisses([]);
        setIsMatch(true);
        setIsPlayerTurn(false);
        setPlacementPhase(false);
        setPlacedPlanes([]);
        setPreviewAt(null);
        setLanJoinInfo(null);
        setLanJoinStatus(null);
        setLanPlayerSide(res.playerSide ?? "player2");
        setLanWaitingForHost(true);
      } catch (e) {
        Alert.alert("Error", e.message || "Could not join game");
      } finally {
        setJoinLoading(false);
      }
    },
    [baseUrl, playerName],
  );

  const handleFindLanGame = useCallback(async (serverBaseUrl, code) => {
    setJoinLoading(true);
    try {
      return await lanLookup(code, serverBaseUrl);
    } finally {
      setJoinLoading(false);
    }
  }, []);

  const handleServerUrlChange = useCallback((url) => {
    setServerUrlOverride?.(url);
  }, [setServerUrlOverride]);

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

  const handleClearAll = useCallback(() => {
    setPlacedPlanes((prev) => prev.map(() => null));
    setPreviewAt(null);
    setMovingPlaneIndex(null);
    setDockDragPosition(null);
  }, []);

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
    const numRequired = lanJoinInfo?.numPlanes ?? placementNumPlanes;
    if (planes.length !== numRequired) return;
    setLoading(true);
    setLastResult(null);
    setSunkPlaneId(null);
    setGameOver(false);
    setCooldownRemaining(0);
    setElapsed(0);
    setGaveUp(false);
    setRevealedCells([]);
    setExplodingCell(null);
    setPlayerPlanesSunk(0);
    setCpuPlanesSunk(0);
    setSmokeCell(null);
    setTurnSwitchDelay(false);
    setPlayerBoardHits([]);
    setPlayerBoardMisses([]);
    setPlayerWon(null);
    try {
      if (lanJoinInfo) {
        const joinBase = lanJoinInfo.joinBaseUrl || baseUrl;
        const res = await lanJoin(lanJoinInfo.gameId, planes, joinBase, {
          password: lanJoinInfo.joinPassword,
          playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
        });
        lanJoinerBaseUrlRef.current = joinBase;
        setGameId(res.gameId);
        setGridSize(res.gridSize ?? lanJoinInfo.gridSize);
        setHits([]);
        setMisses([]);
        setIsMatch(true);
        setIsPlayerTurn(false);
        setPlacementPhase(false);
        setPlacedPlanes([]);
        setPreviewAt(null);
        setLanJoinInfo(null);
        setLanJoinStatus(null);
        setLanPlayerSide(res.playerSide ?? "player2");
        setLanWaitingForHost(true);
      } else if (lanMode === "host") {
        const serverUrl = baseUrl.replace(/\/$/, "");
        const cfg = lanHostConfigRef.current ?? lanHostConfig;
        const res = await createGame(difficulty, planes, {
          isLanMultiplayer: true,
          baseUrl: serverUrl,
          password: cfg?.password,
          minPlayers: cfg?.minPlayers ?? 2,
          maxPlayers: cfg?.maxPlayers ?? 2,
          playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
        });
        lanServerUrlRef.current = serverUrl;
        setGameId(res.gameId);
        setLanLobbyCode(res.lobbyCode ?? "");
        setGridSize(res.gridSize ?? difficultyConfig.gridSize);
        setHits([]);
        setMisses([]);
        setIsMatch(true);
        setLanPlayerSide("player1");
        setIsPlayerTurn(true);
        setPlacementPhase(false);
        setPlacedPlanes([]);
        setPreviewAt(null);
        setLanWaitingForOpponent(true);
        try {
          const ipRes = await fetch(`${serverUrl}/lan/my-ip`);
          const ipData = await ipRes.json();
          setLanHostIp(ipData.ip ?? "");
        } catch {
          setLanHostIp("—");
        }
      } else {
        setIsMatch(true);
        setIsPlayerTurn(true);
        const res = await createGame(difficulty, planes);
        setGameId(res.gameId);
        setGridSize(res.gridSize ?? difficultyConfig.gridSize);
        setHits(res.hits ?? []);
        setMisses(res.misses ?? []);
        setPlacementPhase(false);
        setPlacedPlanes([]);
        setPreviewAt(null);
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Could not start game");
    } finally {
      setLoading(false);
    }
  }, [
    difficulty,
    placedPlanes,
    placementNumPlanes,
    lanJoinInfo,
    lanMode,
    lanHostConfig,
    difficultyConfig.gridSize,
    baseUrl,
    playerName,
  ]);

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
    setPlayerPlanesSunk(0);
    setCpuPlanesSunk(0);
    setLanMode(null);
    setLanPlayerSide(null);
    setLanLobbyCode("");
    setLanHostIp("");
    setLanWaitingForOpponent(false);
    setLanJoinInfo(null);
    setLanJoinStatus(null);
    setLanConnectionLost(false);
    setLanHostReadySent(false);
    setLanJoinerReadySent(false);
    setLanJoinerReadyFromServer(false);
    setLanWaitingForHost(false);
    setLanHostReadyFromServer(false);
    lanJoinerBaseUrlRef.current = null;
    setLanJoiningPlayer(null);
    setLanConnectedPlayerName(null);
    setLanOpponentName(null);
    setLanOpponents([]);
    setSelectedTargetId(null);
    setShowLanHostSetup(false);
    setLanHostConfig({ password: null, minPlayers: 2, maxPlayers: 2 });
    resetServerUrl?.();
    setPlayerPlanesSunk(0);
    setCpuPlanesSunk(0);
    setSmokeCell(null);
    setTurnSwitchDelay(false);
    setIsMatch(false);
    setIsPlayerTurn(true);
    setPlayerBoardHits([]);
    setPlayerBoardMisses([]);
    setPlayerWon(null);
    setShowVersusScreen(false);
    setVersusTurnName("");
    lastTurnSwitchAtShownRef.current = 0;
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
            const { planeCells } = await giveUpApi(gameId, {
              playerSide: lanPlayerSide || undefined,
              baseUrl: lanPlayerSide ? baseUrl : undefined,
            });
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
  }, [gameId, goToMainMenu, lanPlayerSide, baseUrl]);

  const handleCellPress = useCallback(
    async (row, col) => {
      if (!gameId || gameOver || loading || cooldownRemaining > 0) return;
      if (turnSwitchDelay) return;
      if (isMatch && !isPlayerTurn) return;
      if (lanPlayerSide && lanOpponents.length > 1 && !selectedTargetId) return;
      setLoading(true);
      setLastResult(null);
      setSunkPlaneId(null);
      try {
        const res = await shoot(gameId, row, col, {
          playerSide: lanPlayerSide || undefined,
          targetPlayer: lanOpponents.length ? (selectedTargetId || lanOpponents[0]?.id) : undefined,
          baseUrl: lanPlayerSide ? baseUrl : undefined,
        });
        setHits(res.hits ?? hits);
        setMisses(res.misses ?? misses);
        setLastResult(res.result);
        if (res.sunkPlaneId != null) setSunkPlaneId(res.sunkPlaneId);
        if (res.isPlayerTurn !== undefined) {
          if (res.result === "miss") {
            setTurnSwitchDelay(true);
            const nextTurn = res.nextTurnName ?? (lanPlayerSide ? (lanOpponentName || "Opponent") : "CPU");
            setVersusLeftName(nextTurn);
            setVersusRightName((playerName || "Player1").trim() || "Player1");
            setVersusTurnName(nextTurn);
            if (versusTimeoutRef.current)
              clearTimeout(versusTimeoutRef.current);
            if (turnSwitchTimeoutRef.current)
              clearTimeout(turnSwitchTimeoutRef.current);
            const delayMs = res.turnSwitchAt
              ? Math.max(0, res.turnSwitchAt + 2000 - Date.now())
              : 2000;
            versusTimeoutRef.current = setTimeout(() => {
              setShowVersusScreen(true);
              turnSwitchTimeoutRef.current = setTimeout(() => {
                setIsPlayerTurn(res.isPlayerTurn);
                setTurnSwitchDelay(false);
                setShowVersusScreen(false);
              }, 2000);
            }, delayMs);
          } else {
            setIsPlayerTurn(res.isPlayerTurn);
          }
        }
        if (res.result === "sunk")
          setPlayerPlanesSunk((n) => n + 1);
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
          const tid = lanOpponents.length ? (selectedTargetId || lanOpponents[0]?.id) : null;
          if (tid) {
            setLanOpponents((prev) =>
              prev.map((o) =>
                o.id === tid
                  ? { ...o, hits: [...(o.hits ?? []), { row, col }] }
                  : o
              )
            );
          }
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
          const tid = lanOpponents.length ? (selectedTargetId || lanOpponents[0]?.id) : null;
          if (tid) {
            setLanOpponents((prev) =>
              prev.map((o) =>
                o.id === tid
                  ? { ...o, misses: [...(o.misses ?? []), { row, col }] }
                  : o
              )
            );
          }
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
      lanPlayerSide,
      lanOpponentName,
      lanOpponents,
      selectedTargetId,
      baseUrl,
    ],
  );

  useEffect(() => {
    if (!gameId || !lanWaitingForOpponent || !lanPlayerSide || lanConnectionLost) return;
    const url = lanServerUrlRef.current || baseUrl;
    const poll = async () => {
      try {
        const s = await lanStatus(gameId, lanPlayerSide, url);
        setLanJoiningPlayer(s.joiningPlayer || null);
        setLanConnectedPlayerName(s.connectedPlayerName || null);
        setLanJoinerReadyFromServer(!!s.joinerReady);
        if (s.allPlayers) setLanAllPlayers(s.allPlayers);
        if (s.player2Ready && s.status === "playing" && lanHostReadySent && s.joinerReady) {
          setLanOpponentName(s.opponentName || s.connectedPlayerName || "Opponent");
          setLanOpponents(s.opponents ?? []);
          setSelectedTargetId((prev) => prev || s.opponents?.[0]?.id);
          setLanWaitingForOpponent(false);
        }
      } catch (e) {
        if (e?.status === 404) {
          setLanConnectionLost(true);
        }
      }
    };
    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [gameId, lanWaitingForOpponent, lanPlayerSide, lanConnectionLost, lanHostReadySent, baseUrl]);

  useEffect(() => {
    if (!gameId || !lanWaitingForHost || !lanPlayerSide || lanPlayerSide === "player1") return;
    const url = lanJoinerBaseUrlRef.current || baseUrl;
    const poll = async () => {
      try {
        const s = await lanStatus(gameId, lanPlayerSide, url);
        setLanHostReadyFromServer(!!s.hostReady);
        if (s.allPlayers) setLanAllPlayers(s.allPlayers);
        if (s.opponentName) setLanOpponentName(s.opponentName);
        if (s.status === "playing") {
          setLanWaitingForHost(false);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 800);
    return () => clearInterval(id);
  }, [gameId, lanWaitingForHost, lanPlayerSide, lanJoinerReadySent, baseUrl]);

  useEffect(() => {
    if (
      !gameId ||
      !lanPlayerSide ||
      isPlayerTurn ||
      gameOver ||
      gaveUp ||
      loading ||
      turnSwitchDelay ||
      lanWaitingForHost
    )
      return;
    const poll = async () => {
      try {
        const s = await lanStatus(gameId, lanPlayerSide, baseUrl);
        if (s.opponentName) setLanOpponentName(s.opponentName);
        if (s.opponents) {
          setLanOpponents(s.opponents);
          setSelectedTargetId((prev) => {
            const valid = s.opponents?.some((o) => o.id === prev);
            return valid ? prev : s.opponents?.[0]?.id ?? prev;
          });
        }
        if (s.currentTurnName) setLanCurrentTurnName(s.currentTurnName);
        if (s.currentTurn) setLanCurrentTurnId(s.currentTurn);
        setPlayerBoardHits(s.myBoardHits ?? []);
        setPlayerBoardMisses(s.myBoardMisses ?? []);
        if (s.turnSwitchAt && s.isMyTurn && lastTurnSwitchAtShownRef.current !== s.turnSwitchAt) {
          lastTurnSwitchAtShownRef.current = s.turnSwitchAt;
          setTurnSwitchDelay(true);
          setVersusLeftName(s.opponentName || "Opponent");
          setVersusRightName((playerName || "Player1").trim() || "Player1");
          setVersusTurnName((playerName || "Player1").trim() || "Player1");
          const delayMs = Math.max(0, s.turnSwitchAt + 2000 - Date.now());
          if (versusTimeoutRef.current) clearTimeout(versusTimeoutRef.current);
          if (turnSwitchTimeoutRef.current) clearTimeout(turnSwitchTimeoutRef.current);
          versusTimeoutRef.current = setTimeout(() => {
            setShowVersusScreen(true);
            turnSwitchTimeoutRef.current = setTimeout(() => {
              setIsPlayerTurn(true);
              setTurnSwitchDelay(false);
              setShowVersusScreen(false);
            }, 2000);
          }, delayMs);
        }
        if (!s.turnSwitchAt || !s.isMyTurn || lastTurnSwitchAtShownRef.current !== s.turnSwitchAt) {
          setIsPlayerTurn(s.isMyTurn);
        }
        if (s.gameOver) {
          setGameOver(true);
          setPlayerWon(s.winner === lanPlayerSide);
        }
      } catch {}
    };
    const id = setInterval(poll, 800);
    return () => clearInterval(id);
  }, [
    gameId,
    lanPlayerSide,
    isPlayerTurn,
    gameOver,
    gaveUp,
    loading,
    turnSwitchDelay,
    lanWaitingForHost,
    baseUrl,
    playerName,
  ]);

  useEffect(() => {
    if (
      !gameId ||
      !isMatch ||
      isPlayerTurn ||
      gameOver ||
      gaveUp ||
      loading ||
      turnSwitchDelay ||
      lanPlayerSide
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
        } else if (res.result === "sunk") {
          setCpuPlanesSunk((n) => n + 1);
        }
        if (res.result === "miss") {
          setTurnSwitchDelay(true);
          setVersusLeftName((playerName || "Player1").trim() || "Player1");
          setVersusRightName("CPU");
          setVersusTurnName((playerName || "Player1").trim() || "Player1");
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
  const selectedTarget = lanOpponents.find((o) => o.id === selectedTargetId) || lanOpponents[0];
  const targetHits = selectedTarget?.hits ?? hits;
  const targetMisses = selectedTarget?.misses ?? misses;
  const checkHits = lanOpponents.length ? targetHits : hits;
  const checkMisses = lanOpponents.length ? targetMisses : misses;
  const coordCellShot =
    checkHits.some((h) => h.row === effRow && h.col === effCol) ||
    checkMisses.some((m) => m.row === effRow && m.col === effCol) ||
    revealedCells?.some((c) => c.row === effRow && c.col === effCol);
  const highlightCell = !coordCellShot ? { row: effRow, col: effCol } : null;
  const gridHits = isMatch && !isPlayerTurn ? playerBoardHits : (lanOpponents.length ? targetHits : hits);
  const gridMisses = isMatch && !isPlayerTurn ? playerBoardMisses : (lanOpponents.length ? targetMisses : misses);
  const gridRevealed = isMatch && !isPlayerTurn ? revealedCells : [];
  const effectiveGridHits =
    explodingCell && !gridHits.some((h) => h.row === explodingCell.row && h.col === explodingCell.col)
      ? [...gridHits, { row: explodingCell.row, col: explodingCell.col }]
      : gridHits;
  const effectiveGridMisses =
    smokeCell && !gridMisses.some((m) => m.row === smokeCell.row && m.col === smokeCell.col)
      ? [...gridMisses, { row: smokeCell.row, col: smokeCell.col }]
      : gridMisses;
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
  const isVideoMap = !!mapOption?.video;
  const Wrapper =
    isMainMenu
      ? View
      : mapId === "default"
        ? View
        : isVideoMap
          ? VideoMapBackground
          : ImageBackground;
  const wrapperProps =
    isMainMenu || mapId === "default"
      ? {}
      : isVideoMap
        ? { source: mapOption.video, style: { flex: 1 } }
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
            {lanJoinInfo && lanJoinStatus && (
              <View
                style={[
                  styles.lanJoinBanner,
                  lanJoinStatus === "connected" && styles.lanJoinBannerConnected,
                  lanJoinStatus === "failed" && styles.lanJoinBannerFailed,
                ]}
              >
                <View
                  style={[
                    styles.lanJoinBannerDot,
                    lanJoinStatus === "connected" && styles.lanJoinBannerDotConnected,
                    lanJoinStatus === "failed" && styles.lanJoinBannerDotFailed,
                  ]}
                />
                <Text style={styles.lanJoinBannerText}>
                  {lanJoinStatus === "connecting"
                    ? "Connecting to game..."
                    : lanJoinStatus === "connected"
                      ? "Connected. Place your planes."
                      : "Failed to connect. Check network."}
                </Text>
                {lanJoinStatus === "failed" && (
                  <SoundPressable
                    style={({ pressed }) => [
                      styles.lanJoinRetryBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      setLanJoinStatus("connecting");
                      lanJoining(lanJoinInfo.gameId, lanJoinInfo.joinBaseUrl || baseUrl, {
                        playerName: (playerName || "Player").trim().slice(0, 20) || "Player",
                      })
                        .then(() => setLanJoinStatus("connected"))
                        .catch(() => setLanJoinStatus("failed"));
                    }}
                  >
                    <Text style={styles.lanJoinRetryText}>Retry</Text>
                  </SoundPressable>
                )}
              </View>
            )}
            <PlacementPhase
              selectedPlaneIndex={selectedPlaneIndex}
              onSelectPlane={handleSelectPlane}
              placedPlanes={placedPlanes}
              placementRotation={placementRotation}
              onRotate={() => setPlacementRotation((r) => (r + 1) % 4)}
              onClearPlane={handleClearPlane}
              onClearAll={handleClearAll}
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
              onBack={() => {
                setPlacementPhase(false);
                if (lanJoinInfo) {
                  setLanJoinInfo(null);
                  setLanJoinStatus(null);
                }
              }}
              onStartGame={startGameFromPlacement}
              onRandomPlace={() => {
                const numPlanes = lanJoinInfo?.numPlanes ?? placementNumPlanes;
                const planes = generateRandomPlanes(placementGridSize, numPlanes);
                if (planes.length === numPlanes) {
                  setPlacedPlanes(planes);
                  setPreviewAt(null);
                  setMovingPlaneIndex(null);
                  setDockDragPosition(null);
                }
              }}
              loading={loading}
              startButtonLabel={
                lanJoinInfo ? "Join game" : lanMode === "host" ? "Host game" : "Start game"
              }
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
      ) : showLanHostSetup ? (
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
          <LanHostSetup
            onContinue={handleLanHostSetupContinue}
            onBack={() => setShowLanHostSetup(false)}
            password={lanHostConfig?.password ?? ""}
            minPlayers={lanHostConfig?.minPlayers ?? 2}
            maxPlayers={lanHostConfig?.maxPlayers ?? 2}
            onConfigChange={setLanHostConfig}
          />
        </View>
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
            lanMode={lanMode}
            onLanModeChange={(mode) => {
              setLanMode(mode);
              if (mode === null) {
                setLanJoinInfo(null);
                setLanJoinStatus(null);
              }
            }}
            onHostLan={startHostLan}
            onJoinLanFound={handleJoinLanFound}
            onJoinPlacePlanes={handleJoinPlacePlanes}
            onJoinWithRandomPlanes={handleJoinWithRandomPlanes}
            onFindLanGame={handleFindLanGame}
            onServerUrlChange={handleServerUrlChange}
            joinLoading={joinLoading}
            lanJoinInfo={lanJoinInfo}
            baseUrl={baseUrl}
          />
        </View>
      ) : lanWaitingForOpponent ? (
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
          {lanConnectionLost ? (
            <View style={styles.lanErrorWrap}>
              <Text style={styles.lanErrorTitle}>Session lost</Text>
              <Text style={styles.lanErrorText}>
                The server may have restarted. Start the server first, then create a new game.
              </Text>
              <SoundPressable
                style={({ pressed }) => [
                  styles.lobbyCancelBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={goToMainMenu}
              >
                <Text style={styles.lobbyCancelBtnText}>Back to menu</Text>
              </SoundPressable>
            </View>
          ) : (
            <>
              <LanHostLobby
                lobbyCode={lanLobbyCode}
                hostIp={lanHostIp}
                hostName={(playerName || "You").trim() || "You"}
                maxPlayers={lanHostConfig?.maxPlayers ?? 2}
                joiningPlayer={lanJoiningPlayer}
                connectedPlayerName={lanConnectedPlayerName}
                allPlayers={lanAllPlayers}
                joinerReady={lanJoinerReadyFromServer}
                hostReady={lanHostReadySent}
                onHostReady={async () => {
                  setLanHostReadySent(true);
                  try {
                    const url = lanServerUrlRef.current || baseUrl;
                    await lanHostReady(gameId, url);
                    const s = await lanStatus(gameId, lanPlayerSide, url);
                    if (s.player2Ready && s.status === "playing" && s.joinerReady) {
                      setLanOpponentName(s.opponentName || s.connectedPlayerName || "Opponent");
                      setLanOpponents(s.opponents ?? []);
                      setSelectedTargetId((prev) => prev || s.opponents?.[0]?.id);
                      setLanWaitingForOpponent(false);
                    }
                  } catch (e) {
                    setLanHostReadySent(false);
                    const msg = e?.status === 404
                      ? "Game session lost. The server may have restarted. Create a new game."
                      : (e.message || "Could not set ready");
                    Alert.alert("Error", msg);
                  }
                }}
              />
              <SoundPressable
                style={({ pressed }) => [
                  styles.lobbyCancelBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={goToMainMenu}
              >
                <Text style={styles.lobbyCancelBtnText}>Cancel</Text>
              </SoundPressable>
            </>
          )}
        </View>
      ) : lanWaitingForHost ? (
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
          <LanHostLobby
            isJoiner
            hostName={(playerName || "You").trim() || "You"}
            maxPlayers={lanJoinInfo?.maxPlayers ?? 2}
            allPlayers={lanAllPlayers}
            hostReady={lanHostReadyFromServer}
            joinerReady={lanJoinerReadySent}
            onJoinerReady={async () => {
              setLanJoinerReadySent(true);
              try {
                const url = lanJoinerBaseUrlRef.current || baseUrl;
                await lanJoinerReady(gameId, url, { playerSide: lanPlayerSide });
                const s = await lanStatus(gameId, lanPlayerSide, url);
                if (s.status === "playing") {
                  if (s.opponents) {
                    setLanOpponents(s.opponents);
                    setSelectedTargetId((prev) => prev || s.opponents?.[0]?.id);
                  }
                  if (s.currentTurn) setLanCurrentTurnId(s.currentTurn);
                  if (s.currentTurnName) setLanCurrentTurnName(s.currentTurnName);
                  setIsPlayerTurn(s.isMyTurn ?? false);
                  setPlayerBoardHits(s.myBoardHits ?? []);
                  setPlayerBoardMisses(s.myBoardMisses ?? []);
                  setLanWaitingForHost(false);
                }
              } catch (e) {
                setLanJoinerReadySent(false);
                const msg = e?.status === 404
                  ? "Game session lost. The server may have restarted. Create a new game."
                  : (e.message || "Could not set ready");
                Alert.alert("Error", msg);
              }
            }}
          />
          <SoundPressable
            style={({ pressed }) => [
              styles.lobbyCancelBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={goToMainMenu}
          >
            <Text style={styles.lobbyCancelBtnText}>Cancel</Text>
          </SoundPressable>
        </View>
      ) : showVersusScreen ? (
        <View style={styles.gameView}>
          {mapId === "default" && <MathPaperBackground gridSize={gridSize} />}
          <VersusScreen
            turnName={versusTurnName}
            leftName={versusLeftName}
            rightName={versusRightName}
            mapImage={mapOption?.video ? null : mapOption?.image}
            mapVideo={mapOption?.video}
          />
        </View>
      ) : (
        <View style={styles.gameView}>
          <GamePhase
            gameMode={gameMode}
            numPlayers={lanOpponents?.length ? lanOpponents.length + 1 : numPlayers}
            playerName={playerName}
            isPlayerTurn={effectiveIsPlayerTurn}
            gaveUp={gaveUp}
            gameOver={gameOver}
            playerWon={playerWon}
            elapsed={elapsed}
            shots={shots}
            hits={effectiveGridHits}
            accuracy={accuracy}
            lastResult={lastResult}
            sunkPlaneId={sunkPlaneId}
            cooldownRemaining={cooldownRemaining}
            onGiveUp={handleGiveUp}
            onMainMenu={goToMainMenu}
            gridSize={gridSize}
            misses={effectiveGridMisses}
            revealedCells={gridRevealed}
            carouselHits={
              isMatch
                ? isPlayerTurn
                  ? playerBoardHits
                  : (lanOpponents.find((o) => o.id === lanCurrentTurnId)?.hits ?? [])
                : undefined
            }
            carouselMisses={
              isMatch
                ? isPlayerTurn
                  ? playerBoardMisses
                  : (lanOpponents.find((o) => o.id === lanCurrentTurnId)?.misses ?? [])
                : undefined
            }
            carouselRevealed={
              isMatch ? (isPlayerTurn ? [] : []) : undefined
            }
            carouselLabel={
              isMatch
                ? isPlayerTurn
                  ? (playerName || "Player1").trim() || "Player1"
                  : (lanCurrentTurnName || lanOpponents.find((o) => o.id === lanCurrentTurnId)?.name || "Opponent")
                : undefined
            }
            carouselItems={
              isMatch && isPlayerTurn && lanOpponents?.length > 1
                ? lanOpponents.map((o) => ({
                    id: o.id,
                    name: o.name,
                    label: o.name,
                    hits: o.hits ?? [],
                    misses: o.misses ?? [],
                  }))
                : undefined
            }
            selectedTargetId={isMatch && isPlayerTurn ? selectedTargetId : undefined}
            onSelectTarget={isMatch && isPlayerTurn ? setSelectedTargetId : undefined}
            attackShots={
              isMatch
                ? lanOpponents.length
                  ? (selectedTarget?.hits?.length ?? 0) + (selectedTarget?.misses?.length ?? 0)
                  : hits.length + misses.length
                : undefined
            }
            attackHits={
              isMatch
                ? lanOpponents.length
                  ? (selectedTarget?.hits?.length ?? 0)
                  : hits.length
                : undefined
            }
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
            opponentShots={playerBoardHits.length + playerBoardMisses.length}
            opponentHits={playerBoardHits.length}
            opponentName={
              lanPlayerSide
                ? (lanCurrentTurnName || lanOpponentName || "Opponent")
                : "CPU"
            }
            numPlanes={difficultyConfig.numPlanes}
            playerPlanesSunk={playerPlanesSunk}
            cpuPlanesSunk={cpuPlanesSunk}
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
  lanJoinBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  lanJoinBannerConnected: {
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    borderColor: "rgba(74, 222, 128, 0.4)",
  },
  lanJoinBannerFailed: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
    borderColor: "rgba(248, 113, 113, 0.4)",
  },
  lanJoinBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fbbf24",
  },
  lanJoinBannerDotConnected: {
    backgroundColor: "#4ade80",
  },
  lanJoinBannerDotFailed: {
    backgroundColor: "#f87171",
  },
  lanJoinBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: UI_WHITE,
    flex: 1,
  },
  lanJoinRetryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  lanJoinRetryText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI_WHITE,
  },
  lanErrorWrap: {
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    alignItems: "center",
    maxWidth: 340,
    borderWidth: 2,
    borderColor: "rgba(198, 40, 40, 0.5)",
  },
  lanErrorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f87171",
    marginBottom: 8,
  },
  lanErrorText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 20,
  },
  lobbyCancelBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: UI_PAGE_BG,
    alignItems: "center",
  },
  lobbyCancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: UI_PRIMARY,
  },
});
