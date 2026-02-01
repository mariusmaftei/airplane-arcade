import express from "express";
import cors from "cors";
import { createGame, shoot, getPlaneCells } from "./game.js";
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
  const game = store.get(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  if (!store.canShoot(req.params.id)) {
    const waitSec = Math.ceil(
      store.getCooldownRemainingMs(req.params.id) / 1000,
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
  const result = shoot(game, row, col);
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

function handleGiveUp(req, res) {
  const game = store.get(req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  const planeCells = getPlaneCells(game);
  res.json({ planeCells });
}

app.get("/game/:id/give-up", handleGiveUp);
app.post("/game/:id/give-up", handleGiveUp);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
