import express from "express";
import cors from "cors";
import {
  createGame,
  shoot,
  getPlaneCells,
  pickRandomUnshotCell,
} from "./game.js";
import * as store from "./store.js";

function cooldownRemainingSeconds(gameId) {
  return Math.ceil(store.getCooldownRemainingMs(gameId) / 1000);
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/game", (req, res) => {
  const difficulty = req.body?.difficulty || "medium";
  const customPlanes = req.body?.planes ?? null;
  const vsCpu = req.body?.vsCpu === true;
  const useMatch =
    (customPlanes && Array.isArray(customPlanes) && customPlanes.length > 0) ||
    (vsCpu && !customPlanes);
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
  const { row, col } = req.body;
  if (typeof row !== "number" || typeof col !== "number") {
    return res.status(400).json({ error: "row and col must be numbers" });
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
  const game = state.isMatch ? state.playerBoard : state;
  const planeCells = getPlaneCells(game);
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
