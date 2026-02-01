import { API_BASE_URL } from "./config";

const REQUEST_TIMEOUT_MS = 15000;

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
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
    if (e.name === "AbortError")
      throw new Error(
        "Server not responding. Check that the server is running and the URL is correct.",
      );
    throw new Error(e.message || "Network error");
  }
  clearTimeout(timeoutId);
  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function createGame(difficulty = "medium", planes = null) {
  return request("/game", {
    method: "POST",
    body: planes ? { difficulty, planes } : { difficulty },
  });
}

export async function shoot(gameId, row, col) {
  return request(`/game/${gameId}/shoot`, {
    method: "POST",
    body: { row, col },
  });
}

export async function giveUp(gameId) {
  return request(`/game/${encodeURIComponent(gameId)}/give-up`, {
    method: "POST",
    body: {},
  });
}
