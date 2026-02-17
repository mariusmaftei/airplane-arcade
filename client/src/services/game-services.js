import { API_BASE_URL } from "./api";

const REQUEST_TIMEOUT_MS = 15000;

async function request(path, options = {}) {
  const base = options.baseUrl ?? API_BASE_URL;
  const url = `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[API] Requesting: ${url}`);
  const { body, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...rest.headers },
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    clearTimeout(timeoutId);
    console.error(`[API] Request failed: ${url}`, e);
    if (e.name === "AbortError")
      throw new Error(
        `Server not responding at ${url}. Check that the server is running and the URL is correct.`,
      );
    throw new Error(e.message || "Network error");
  }
  clearTimeout(timeoutId);
  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    console.error(`[API] HTTP ${res.status} from ${url}:`, data);
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  console.log(`[API] Success: ${url}`);
  return data;
}

export async function createGame(
  difficulty = "medium",
  planes = null,
  options = {},
) {
  const body = options.isLanMultiplayer
    ? {
        difficulty,
        planes,
        isLanMultiplayer: true,
        ...(options.password != null && { password: options.password }),
        minPlayers: options.minPlayers ?? 2,
        maxPlayers: options.maxPlayers ?? 2,
        ...(options.playerName != null && { playerName: options.playerName }),
      }
    : planes?.length > 0
      ? { difficulty, planes }
      : options.vsCpu
        ? { difficulty, vsCpu: true }
        : { difficulty };
  return request("/game", { method: "POST", body, baseUrl: options.baseUrl });
}

export async function shoot(gameId, row, col, options = {}) {
  const body = { row: Number(row), col: Number(col) };
  if (options.playerSide) body.playerSide = options.playerSide;
  if (options.targetPlayer) body.targetPlayer = options.targetPlayer;
  return request(`/game/${gameId}/shoot`, {
    method: "POST",
    body,
    baseUrl: options.baseUrl,
  });
}

export async function giveUp(gameId, options = {}) {
  const body = {};
  if (options.playerSide) body.playerSide = options.playerSide;
  return request(`/game/${encodeURIComponent(gameId)}/give-up`, {
    method: "POST",
    body,
    baseUrl: options.baseUrl ?? API_BASE_URL,
  });
}

export async function lanLookup(code, baseUrl) {
  const b = baseUrl ?? API_BASE_URL;
  return request(`/lan/lookup?code=${encodeURIComponent(String(code).toUpperCase())}`, {
    baseUrl: b,
  });
}

export async function lanJoining(gameId, baseUrl, options = {}) {
  const body = {};
  if (options.playerName) body.playerName = options.playerName;
  return request(`/game/${encodeURIComponent(gameId)}/lan-joining`, {
    method: "POST",
    body,
    baseUrl: baseUrl ?? API_BASE_URL,
  });
}

export async function lanJoin(gameId, planes, baseUrl, options = {}) {
  const body = { planes };
  if (options.password != null) body.password = options.password;
  if (options.playerName) body.playerName = options.playerName;
  return request(`/game/${encodeURIComponent(gameId)}/lan-join`, {
    method: "POST",
    body,
    baseUrl: baseUrl ?? API_BASE_URL,
  });
}

export async function lanHostReady(gameId, baseUrl) {
  return request(`/game/${encodeURIComponent(gameId)}/lan-host-ready`, {
    method: "POST",
    body: {},
    baseUrl: baseUrl ?? API_BASE_URL,
  });
}

export async function lanJoinerReady(gameId, baseUrl, options = {}) {
  const body = {};
  if (options.playerSide) body.playerSide = options.playerSide;
  return request(`/game/${encodeURIComponent(gameId)}/lan-joiner-ready`, {
    method: "POST",
    body,
    baseUrl: baseUrl ?? API_BASE_URL,
  });
}

export async function lanStatus(gameId, playerSide, baseUrl) {
  return request(
    `/game/${encodeURIComponent(gameId)}/lan-status?playerSide=${encodeURIComponent(playerSide)}`,
    { baseUrl: baseUrl ?? API_BASE_URL },
  );
}

export async function cpuShoot(gameId) {
  return request(`/game/${encodeURIComponent(gameId)}/cpu-shoot`, {
    method: "POST",
    body: {},
  });
}
