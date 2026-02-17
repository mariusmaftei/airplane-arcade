import express from "express";
import cors from "cors";
import {
  createGame,
  shoot,
  getPlaneCells,
  pickRandomUnshotCell,
} from "./game.js";
import * as store from "./store.js";

const SERVER_PID = process.pid;
import os from "os";

function cooldownRemainingSeconds(gameId) {
  return Math.ceil(store.getCooldownRemainingMs(gameId) / 1000);
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.use((req, res, next) => {
  const ids = store.getAllIds();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | store: ${ids.length} games ${ids.slice(-3).join(",")}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/debug/games", (req, res) => {
  const ids = store.getAllIds();
  res.json({ serverPid: SERVER_PID, gameCount: ids.length, gameIds: ids });
});

function getPlayerCount(state) {
  if (!state.players) return state.player2Board ? 2 : 1;
  return state.players.filter((p) => p.board != null).length;
}

function hasOpenSlot(state) {
  if (!state.players) return !state.player2Board;
  return state.players.some((p) => p.board == null);
}

app.get("/lan/lookup", (req, res) => {
  const code = (req.query.code || "").toUpperCase();
  if (!code) return res.status(400).json({ error: "code required" });
  const gameId = store.findByLobbyCode(code);
  if (!gameId) return res.status(404).json({ error: "Game not found" });
  const state = store.get(gameId);
  const usePlayers = !!state.players;
  const full = usePlayers ? !hasOpenSlot(state) : !!state.player2Ready;
  if (!full) {
    return res.json({
      gameId,
      gridSize: state.gridSize,
      numPlanes: state.numPlanes,
      passwordRequired: !!state.password,
      maxPlayers: state.maxPlayers ?? 2,
      playerCount: usePlayers ? getPlayerCount(state) : (state.player2Board ? 2 : 1),
    });
  }
  return res.status(400).json({ error: "Game already full" });
});

app.get("/lan/my-ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.json({ ip: "localhost" });
});

function makeLobbyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

app.post("/game", (req, res) => {
  const difficulty = req.body?.difficulty || "medium";
  const customPlanes = req.body?.planes ?? null;
  const vsCpu = req.body?.vsCpu === true;
  const isLanMultiplayer = req.body?.isLanMultiplayer === true;
  const useMatch =
    (customPlanes && Array.isArray(customPlanes) && customPlanes.length > 0) ||
    (vsCpu && !customPlanes) ||
    isLanMultiplayer;
  if (isLanMultiplayer) {
    if (!customPlanes?.length) {
      return res
        .status(400)
        .json({ error: "LAN host must place planes" });
    }
    const password = req.body?.password?.trim() || null;
    const minPlayers = Math.max(2, Math.min(10, Number(req.body?.minPlayers) || 2));
    const maxPlayers = Math.max(2, Math.min(10, Number(req.body?.maxPlayers) || 2));
    const player1Name = (req.body?.playerName || "").trim().slice(0, 20) || "Player";
    const player1Board = createGame(difficulty, customPlanes);
    const gameId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    const lobbyCode = makeLobbyCode();
    const players = [
      { id: "player1", name: player1Name, board: player1Board, ready: true },
    ];
    for (let i = 2; i <= maxPlayers; i++) {
      players.push({ id: `player${i}`, name: null, board: null, ready: false });
    }
    const turnOrder = players.slice(0, 1).map((p) => p.id);
    const match = {
      isLanMatch: true,
      lobbyCode,
      password,
      minPlayers,
      maxPlayers,
      players,
      gridSize: player1Board.gridSize,
      numPlanes: player1Board.numPlanes,
      currentTurn: "player1",
      turnOrder,
      status: "waiting",
      hostReady: false,
      readyCount: 1,
    };
    store.create(gameId, match);
    console.log(`[LAN] Game created: ${gameId} (${lobbyCode}) maxPlayers=${maxPlayers}`);
    res.setHeader("X-Server-Pid", String(SERVER_PID));
    return res.json({
      gameId,
      lobbyCode,
      gridSize: match.gridSize,
      numPlanes: match.numPlanes,
      isLanMatch: true,
      playerSide: "player1",
    });
  }
  if (useMatch) {
    const cpuBoard = createGame(difficulty);
    const playerBoard =
      customPlanes?.length > 0
        ? createGame(difficulty, customPlanes)
        : createGame(difficulty);
    const gameId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    const match = {
      isMatch: true,
      gridSize: cpuBoard.gridSize,
      numPlanes: cpuBoard.numPlanes,
      cpuBoard,
      playerBoard,
      currentTurn: "player",
    };
    store.create(gameId, match);
    return res.json({
      gameId,
      gridSize: match.gridSize,
      numPlanes: match.numPlanes,
      isMatch: true,
    });
  }
  const gameState = createGame(difficulty, customPlanes);
  const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  store.create(gameId, gameState);
  res.json({
    gameId,
    gridSize: gameState.gridSize,
    numPlanes: gameState.numPlanes,
  });
});

function getBoardHits(board) {
  if (!board?.hits) return [];
  return Array.from(board.hits).map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { row: r, col: c };
  });
}

function getBoardMisses(board) {
  if (!board?.shotCells) return [];
  return Array.from(board.shotCells)
    .filter((k) => !board.hits.has(k))
    .map((k) => {
      const [r, c] = k.split(",").map(Number);
      return { row: r, col: c };
    });
}

app.get("/game/:id/lan-status", (req, res) => {
  const gameId = req.params.id;
  const state = store.get(gameId);
  const allIds = store.getAllIds();
  if (!state) {
    console.log(`[LAN] 404 lan-status: game "${gameId}" not in store. Has: [${allIds.join(", ")}]`);
    return res.status(404).json({ error: "Game not found" });
  }
  if (!state.isLanMatch)
    return res.status(400).json({ error: "Not a LAN game" });
  const playerSide = req.query.playerSide;
  const validSides = state.players ? state.players.map((p) => p.id) : ["player1", "player2"];
  if (!playerSide || !validSides.includes(playerSide))
    return res.status(400).json({ error: `playerSide required` });

  if (state.players) {
    const myPlayer = state.players.find((p) => p.id === playerSide);
    const myBoard = myPlayer?.board;
    const isMyTurn = state.currentTurn === playerSide;
    const playersWithBoards = state.players.filter((p) => p.board != null);
    const gameOver =
      state.status === "gameover" ||
      playersWithBoards.filter((p) => {
        const b = p.board;
        return b.planes?.every((plane) =>
          plane.cells.every((c) => b.hits.has(`${c.row},${c.col}`)),
        );
      }).length >= Math.max(1, playersWithBoards.length - 1);
    let winner = null;
    if (gameOver) {
      const lastAlive = playersWithBoards.find((p) => {
        const b = p.board;
        return !b.planes?.every((plane) =>
          plane.cells.every((c) => b.hits.has(`${c.row},${c.col}`)),
        );
      });
      winner = lastAlive ? lastAlive.id : null;
    }
    const opponents = state.players
      .filter((p) => p.id !== playerSide && p.board != null)
      .map((p) => ({
        id: p.id,
        name: p.name || p.id,
        hits: getBoardHits(p.board),
        misses: getBoardMisses(p.board),
      }));
    const hostReady = state.players.find((p) => p.id === "player1")?.ready ?? false;
    const allReady = playersWithBoards.length >= state.minPlayers && playersWithBoards.every((p) => p.ready);
    const hasJoiners = state.players.some((p) => p.id !== "player1" && p.board != null);
    const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurn);
    const allPlayers = state.players.map((p) => ({
      id: p.id,
      name: p.name || (p.board ? p.id : null),
      ready: p.ready,
      connected: !!p.board,
    }));
    return res.json({
      status: state.status,
      currentTurn: state.currentTurn,
      currentTurnName: currentTurnPlayer?.name ?? state.currentTurn,
      allPlayers,
      isMyTurn,
      gameOver,
      winner,
      opponents,
      myBoardHits: getBoardHits(myBoard),
      myBoardMisses: getBoardMisses(myBoard),
      hostReady,
      allReady,
      player2Ready: hasJoiners,
      joinerReady: allReady,
      joiningPlayer: state.joiningPlayer || null,
      turnOrder: state.turnOrder,
      turnSwitchAt: state.turnSwitchAt || null,
      player1Ready: hostReady,
      opponentName: opponents[0]?.name ?? null,
      oppBoardHits: opponents[0]?.hits ?? [],
      oppBoardMisses: opponents[0]?.misses ?? [],
    });
  }

  const isMyTurn = state.currentTurn === playerSide;
  if (!["player1", "player2"].includes(playerSide)) {
    return res.status(400).json({ error: "playerSide required: player1 or player2" });
  }
  const gameOver =
    state.status === "gameover" ||
    (state.player1Board &&
      state.player2Board &&
      (state.player1Board.planes?.every((p) =>
        p.cells.every(
          (c) => state.player1Board.hits.has(`${c.row},${c.col}`),
        ),
      ) ||
        state.player2Board.planes?.every((p) =>
          p.cells.every(
            (c) => state.player2Board.hits.has(`${c.row},${c.col}`),
          ),
        )));
  let winner = null;
  if (gameOver && state.player1Board && state.player2Board) {
    const p1AllSunk = state.player1Board.planes.every((p) =>
      p.cells.every((c) => state.player1Board.hits.has(`${c.row},${c.col}`)),
    );
    const p2AllSunk = state.player2Board.planes.every((p) =>
      p.cells.every((c) => state.player2Board.hits.has(`${c.row},${c.col}`)),
    );
    if (p1AllSunk) winner = "player2";
    else if (p2AllSunk) winner = "player1";
  }
  const myBoard =
    playerSide === "player1" ? state.player1Board : state.player2Board;
  const oppBoard =
    playerSide === "player1" ? state.player2Board : state.player1Board;
  const myHits = myBoard
    ? Array.from(myBoard.hits).map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      })
    : [];
  const myMisses = myBoard
    ? Array.from(myBoard.shotCells)
        .filter((k) => !myBoard.hits.has(k))
        .map((k) => {
          const [r, c] = k.split(",").map(Number);
          return { row: r, col: c };
        })
    : [];
  const oppHits = oppBoard
    ? Array.from(oppBoard.hits).map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      })
    : [];
  const oppMisses = oppBoard
    ? Array.from(oppBoard.shotCells)
        .filter((k) => !oppBoard.hits.has(k))
        .map((k) => {
          const [r, c] = k.split(",").map(Number);
          return { row: r, col: c };
        })
    : [];
  const oppId = playerSide === "player1" ? "player2" : "player1";
  const oppName = playerSide === "player1" ? (state.player2Name || "Opponent") : (state.player1Name || "Opponent");
  const currentTurnName = state.currentTurn === "player1" ? state.player1Name : state.player2Name;
  const allPlayersLegacy = [{ id: "player1", name: state.player1Name || "Player 1", ready: state.hostReady }];
  if (state.player2Board) {
    allPlayersLegacy.push({ id: "player2", name: state.player2Name || "Player 2", ready: state.joinerReady });
  }
  const lanResp = {
    status: state.status,
    currentTurn: state.currentTurn,
    currentTurnName: currentTurnName || state.currentTurn,
    allPlayers: allPlayersLegacy,
    isMyTurn,
    gameOver,
    winner,
    player1Ready: state.player1Ready,
    player2Ready: state.player2Ready,
    hostReady: state.hostReady || false,
    joinerReady: state.joinerReady || false,
    joiningPlayer: state.joiningPlayer || null,
    connectedPlayerName: state.player2Name || null,
    opponentName: oppName,
    opponents: [{ id: oppId, name: oppName, hits: oppHits, misses: oppMisses }],
    myBoardHits: myHits,
    myBoardMisses: myMisses,
    oppBoardHits: oppHits,
    oppBoardMisses: oppMisses,
  };
  if (state.turnSwitchAt) lanResp.turnSwitchAt = state.turnSwitchAt;
  res.json(lanResp);
});

app.post("/game/:id/lan-host-ready", (req, res) => {
  const gameId = req.params.id;
  const state = store.get(gameId);
  if (!state) {
    const allIds = store.getAllIds();
    console.log(`[LAN] 404 lan-host-ready: game "${gameId}" not in store. Has: [${allIds.join(", ")}]`);
    return res.status(404).json({ error: "Game not found", hint: "Server may have restarted. Create a new game." });
  }
  if (!state.isLanMatch) return res.status(400).json({ error: "Not a LAN game" });
  if (state.players) {
    const p1 = state.players.find((p) => p.id === "player1");
    if (p1) p1.ready = true;
    state.readyCount = state.players.filter((p) => p.ready).length;
  } else {
    state.hostReady = true;
  }
  res.json({ ok: true });
});

app.post("/game/:id/lan-joiner-ready", (req, res) => {
  const gameId = req.params.id;
  const state = store.get(gameId);
  if (!state) {
    const allIds = store.getAllIds();
    console.log(`[LAN] 404 lan-joiner-ready: game "${gameId}" not in store. Has: [${allIds.join(", ")}]`);
    return res.status(404).json({ error: "Game not found", hint: "Server may have restarted. Create a new game." });
  }
  if (!state.isLanMatch) return res.status(400).json({ error: "Not a LAN game" });
  const playerSide = req.body?.playerSide;
  if (state.players) {
    if (!playerSide || !state.players.some((p) => p.id === playerSide))
      return res.status(400).json({ error: "playerSide required" });
    const p = state.players.find((p) => p.id === playerSide);
    if (!p?.board) return res.status(400).json({ error: "Join first" });
    p.ready = true;
    state.readyCount = state.players.filter((x) => x.ready).length;
    const withBoards = state.players.filter((x) => x.board != null).length;
    if (withBoards >= state.maxPlayers && state.readyCount === withBoards) {
      state.status = "playing";
    }
  } else {
    if (!state.player2Ready) return res.status(400).json({ error: "Join first" });
    state.joinerReady = true;
  }
  res.json({ ok: true });
});

app.post("/game/:id/lan-joining", (req, res) => {
  const gameId = req.params.id;
  const state = store.get(gameId);
  if (!state) {
    const ids = store.getAllIds();
    console.log(`[LAN] 404 lan-joining: game "${gameId}" not in store. Has: [${ids.join(", ")}]`);
    return res.status(404).json({ error: "Game not found" });
  }
  if (!state.isLanMatch)
    return res.status(400).json({ error: "Not a LAN game" });
  const full = state.players ? !hasOpenSlot(state) : !!state.player2Ready;
  if (full) return res.status(400).json({ error: "Game already full" });
  const name = (req.body?.playerName || "").trim().slice(0, 20) || "Player";
  state.joiningPlayer = { name, at: Date.now() };
  res.json({ ok: true });
});

app.post("/game/:id/lan-join", (req, res) => {
  const gameId = req.params.id;
  const state = store.get(gameId);
  if (!state) return res.status(404).json({ error: "Game not found" });
  if (!state.isLanMatch)
    return res.status(400).json({ error: "Not a LAN game" });
  if (state.players) {
    const slot = state.players.find((p) => p.board == null);
    if (!slot) return res.status(400).json({ error: "Game already full" });
    if (state.password) {
      const supplied = (req.body?.password || "").trim();
      if (supplied !== state.password)
        return res.status(401).json({ error: "Invalid password" });
    }
    const planes = req.body?.planes;
    if (!planes?.length) return res.status(400).json({ error: "planes required" });
    const diff = state.gridSize <= 8 ? "easy" : state.gridSize <= 10 ? "medium" : "hard";
    const board = createGame(diff, planes);
    if (board.gridSize !== state.gridSize || board.numPlanes !== state.numPlanes) {
      return res.status(400).json({
        error: `Board must match: ${state.gridSize}x${state.gridSize}, ${state.numPlanes} planes`,
      });
    }
    const playerName = (req.body?.playerName || "").trim().slice(0, 20) || "Player";
    slot.board = board;
    slot.name = playerName;
    slot.ready = false;
    state.turnOrder.push(slot.id);
    delete state.joiningPlayer;
    const readyCount = state.players.filter((p) => p.ready).length;
    const withBoards = state.players.filter((p) => p.board != null).length;
    if (withBoards >= state.maxPlayers && readyCount === withBoards) {
      state.status = "playing";
    }
    return res.json({
      gameId,
      gridSize: state.gridSize,
      numPlanes: state.numPlanes,
      isLanMatch: true,
      playerSide: slot.id,
    });
  }
  if (state.player2Ready) return res.status(400).json({ error: "Game already full" });
  if (state.password) {
    const supplied = (req.body?.password || "").trim();
    if (supplied !== state.password)
      return res.status(401).json({ error: "Invalid password" });
  }
  const planes = req.body?.planes;
  if (!planes?.length) return res.status(400).json({ error: "planes required" });
  const diff = state.gridSize <= 8 ? "easy" : state.gridSize <= 10 ? "medium" : "hard";
  const player2Board = createGame(diff, planes);
  if (player2Board.gridSize !== state.gridSize || player2Board.numPlanes !== state.numPlanes) {
    return res.status(400).json({
      error: `Board must match: ${state.gridSize}x${state.gridSize}, ${state.numPlanes} planes`,
    });
  }
  state.player2Board = player2Board;
  state.player2Ready = true;
  state.player2Name = (req.body?.playerName || "").trim().slice(0, 20) || "Player";
  delete state.joiningPlayer;
  state.status = "playing";
  state.joinerReady = false;
  return res.json({
    gameId,
    gridSize: state.gridSize,
    numPlanes: state.numPlanes,
    isLanMatch: true,
    playerSide: "player2",
  });
});

app.post("/game/:id/shoot", (req, res) => {
  const state = store.get(req.params.id);
  if (!state) return res.status(404).json({ error: "Game not found" });
  if (!store.canShoot(req.params.id)) {
    const waitSec = Math.ceil(
      store.getCooldownRemainingMs(req.params.id) / 1000
    );
    res.set("Retry-After", String(waitSec));
    return res.status(429).json({
      error: "Wait before next shot",
      retryAfterMs: store.getCooldownRemainingMs(req.params.id),
      cooldownRemaining: waitSec,
    });
  }
  const { row, col, playerSide, targetPlayer } = req.body;
  if (typeof row !== "number" || typeof col !== "number") {
    return res.status(400).json({ error: "row and col must be numbers" });
  }
  if (state.isLanMatch) {
    delete state.turnSwitchAt;
    if (state.status !== "playing")
      return res.status(400).json({ error: "Game not started" });
    if (state.players) {
      const playersWithBoards = state.players.filter((p) => p.board != null);
      if (playersWithBoards.length < 2)
        return res.status(400).json({ error: "Waiting for opponents" });
      if (state.currentTurn !== playerSide)
        return res.status(400).json({ error: "Not your turn" });
      const targetId = targetPlayer || (playerSide === "player1" ? "player2" : "player1");
      const target = state.players.find((p) => p.id === targetId);
      if (!target?.board || target.id === playerSide)
        return res.status(400).json({ error: "Invalid target" });
      const result = shoot(target.board, row, col);
      if (result.error === "out_of_bounds")
        return res.status(400).json({ error: "Out of bounds" });
      if (result.error === "already_shot")
        return res.status(400).json({ error: "Cell already shot" });
      if (result.result === "miss") {
        let idx = state.turnOrder.indexOf(playerSide);
        let next;
        do {
          idx = (idx + 1) % state.turnOrder.length;
          next = state.turnOrder[idx];
          const p = state.players.find((x) => x.id === next);
          if (p?.board && !p.board.planes?.every((plane) =>
            plane.cells.every((c) => p.board.hits.has(`${c.row},${c.col}`))))
            break;
        } while (next !== playerSide);
        state.currentTurn = next;
        state.turnSwitchAt = Date.now();
      }
      const aliveCount = playersWithBoards.filter((p) => {
        const b = p.board;
        return !b.planes?.every((plane) =>
          plane.cells.every((c) => b.hits.has(`${c.row},${c.col}`)),
        );
      }).length;
      if (aliveCount <= 1) state.status = "gameover";
      store.recordShot(req.params.id);
      const nextPlayer = state.players.find((p) => p.id === state.currentTurn);
      return res.json({
        ...result,
        isPlayerTurn: state.currentTurn === playerSide,
        cooldownRemaining: cooldownRemainingSeconds(req.params.id),
        turnSwitchAt: result.result === "miss" ? state.turnSwitchAt : undefined,
        nextTurnName: result.result === "miss" ? (nextPlayer?.name ?? state.currentTurn) : undefined,
      });
    }
    if (!state.player2Board)
      return res.status(400).json({ error: "Waiting for opponent" });
    if (state.currentTurn !== playerSide)
      return res.status(400).json({ error: "Not your turn" });
    const targetBoard =
      playerSide === "player1" ? state.player2Board : state.player1Board;
    const result = shoot(targetBoard, row, col);
    if (result.error === "out_of_bounds") {
      return res.status(400).json({ error: "Out of bounds" });
    }
    if (result.error === "already_shot") {
      return res.status(400).json({ error: "Cell already shot" });
    }
    if (result.result === "miss") {
      state.currentTurn =
        playerSide === "player1" ? "player2" : "player1";
      state.turnSwitchAt = Date.now();
    }
    if (result.gameOver) state.status = "gameover";
    store.recordShot(req.params.id);
    const nextName = state.currentTurn === "player1" ? state.player1Name : state.player2Name;
    const resp = {
      ...result,
      isPlayerTurn: state.currentTurn === playerSide,
      cooldownRemaining: cooldownRemainingSeconds(req.params.id),
      nextTurnName: result.result === "miss" ? (nextName || state.currentTurn) : undefined,
    };
    if (result.result === "miss" && state.turnSwitchAt)
      resp.turnSwitchAt = state.turnSwitchAt;
    return res.json(resp);
  }
  if (state.isMatch) {
    if (state.currentTurn !== "player") {
      return res.status(400).json({ error: "Not your turn" });
    }
    const result = shoot(state.cpuBoard, row, col);
    if (result.error === "out_of_bounds") {
      return res.status(400).json({ error: "Out of bounds" });
    }
    if (result.error === "already_shot") {
      return res.status(400).json({ error: "Cell already shot" });
    }
    if (result.result === "miss") state.currentTurn = "cpu";
    store.recordShot(req.params.id);
    return res.json({
      ...result,
      isPlayerTurn: state.currentTurn === "player",
      cooldownRemaining: cooldownRemainingSeconds(req.params.id),
    });
  }
  const result = shoot(state, row, col);
  if (result.error === "out_of_bounds") {
    return res.status(400).json({ error: "Out of bounds" });
  }
  if (result.error === "already_shot") {
    return res.status(400).json({ error: "Cell already shot" });
  }
  store.recordShot(req.params.id);
  res.json({
    ...result,
    cooldownRemaining: cooldownRemainingSeconds(req.params.id),
  });
});

app.post("/game/:id/cpu-shoot", (req, res) => {
  const state = store.get(req.params.id);
  if (!state) return res.status(404).json({ error: "Game not found" });
  if (!state.isMatch) {
    return res.status(400).json({ error: "Not a vs CPU match" });
  }
  if (state.currentTurn !== "cpu") {
    return res.status(400).json({ error: "Not CPU turn" });
  }
  const cell = pickRandomUnshotCell(state.playerBoard);
  if (!cell) {
    return res.json({
      gameOver: true,
      isPlayerTurn: false,
      result: "miss",
      playerHits: [],
      playerMisses: [],
    });
  }
  const result = shoot(state.playerBoard, cell.row, cell.col);
  if (result.result === "miss") state.currentTurn = "player";
  res.json({
    ...result,
    isPlayerTurn: state.currentTurn === "player",
    playerHits: result.hits || [],
    playerMisses: result.misses || [],
  });
});

function handleGiveUp(req, res) {
  const state = store.get(req.params.id);
  if (!state) return res.status(404).json({ error: "Game not found" });
  let board;
  if (state.players) {
    const playerSide = req.body?.playerSide || req.query?.playerSide;
    if (!playerSide)
      return res.status(400).json({ error: "playerSide required for LAN games" });
    const player = state.players.find((p) => p.id === playerSide);
    if (!player?.board)
      return res.status(400).json({ error: "Player not found or has no board" });
    board = player.board;
  } else {
    board = state.isMatch ? state.playerBoard : state;
  }
  const planeCells = getPlaneCells(board);
  res.json({ planeCells });
}

app.get("/game/:id/give-up", handleGiveUp);
app.post("/game/:id/give-up", handleGiveUp);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Accessible at http://localhost:${PORT} or http://10.0.2.2:${PORT} (Android emulator)`
  );
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n❌ Port ${PORT} is already in use!\n` +
        `Please kill the process using port ${PORT} or use a different port.\n` +
        `To find the process: netstat -ano | findstr :${PORT}\n` +
        `To kill it: taskkill /PID <PID> /F (may need admin)\n` +
        `Or set PORT environment variable to use a different port.\n`
    );
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});
