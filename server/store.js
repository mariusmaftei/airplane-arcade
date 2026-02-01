const games = new Map();
const lastShotAt = new Map();

const SHOOT_COOLDOWN_MS = 1000;

function create(gameId, gameState) {
  games.set(gameId, gameState);
  return gameState;
}

function get(gameId) {
  return games.get(gameId);
}

function has(gameId) {
  return games.has(gameId);
}

function canShoot(gameId) {
  const t = lastShotAt.get(gameId);
  if (!t) return true;
  return Date.now() - t >= SHOOT_COOLDOWN_MS;
}

function getCooldownRemainingMs(gameId) {
  const t = lastShotAt.get(gameId);
  if (!t) return 0;
  const elapsed = Date.now() - t;
  if (elapsed >= SHOOT_COOLDOWN_MS) return 0;
  return SHOOT_COOLDOWN_MS - elapsed;
}

function recordShot(gameId) {
  lastShotAt.set(gameId, Date.now());
}

export {
  create,
  get,
  has,
  canShoot,
  getCooldownRemainingMs,
  recordShot,
  SHOOT_COOLDOWN_MS,
};
