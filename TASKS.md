# Airplane Game – Tasks & Recommendations

A grid-based game (Battleship-style) where the player selects cells to destroy hidden airplanes. **Current mode: Player vs Computer** (computer’s planes are hidden on the server; multiplayer PvP planned for later). Built with **React Native** (client) and **Node.js** (Express) (server).

---

## Progress

| Phase   | Status   | Done                                             |
| ------- | -------- | ------------------------------------------------ |
| Phase 1 | Complete | 1.1–1.16 (backend + client foundation)           |
| Phase 2 | Complete | 2.1–2.5 (new game, win, loading/errors, haptics) |
| Phase 3 | Partial  | 3.1–3.4 done; 3.5 multiplayer pending            |

---

## Game Concept

- **Mode**: Player vs Computer. You shoot at the computer’s hidden grid; multiplayer (PvP) will be added later.
- **Grid**: 8×8 to 12×12 depending on difficulty (configurable).
- **Planes**: 2–5 planes (computer’s), each occupying 3–4 connected cells (L/T/line shapes).
- **Turn**: Player taps a cell → server checks hit/miss → UI updates. Sink a plane when all its cells are hit.
- **Win**: Destroy all of the computer’s planes.

---

## Phase 1: Foundation

### Backend (Node.js) — Express

- [x] **1.1** Rename `servier.js` → `server.js` and set up Express (or Fastify) with CORS for the React Native client.
- [x] **1.2** Add a simple health/ping route (e.g. `GET /health`) for connectivity checks.
- [x] **1.3** Define game constants: grid size (e.g. 10), number of planes, plane shapes (cell offsets).
- [x] **1.4** Implement **grid generator**: create an empty grid (2D array or flat array with row/col).
- [x] **1.5** Implement **plane placement**: randomly place N planes on the grid without overlapping. Validate that planes fit and don’t cross boundaries.
- [x] **1.6** Implement **game state**: structure that holds grid, plane positions, and which cells have been hit.
- [x] **1.7** Implement **hit logic**: given (row, col), return `miss` | `hit` | `sunk` (and which plane if sunk). Update state so the same cell can’t be hit twice.
- [x] **1.8** Add **game session**: create a new game (e.g. `POST /game`), return game id and initial state (without revealing plane positions to client).
- [x] **1.9** Add **shoot endpoint**: e.g. `POST /game/:id/shoot` with `{ row, col }`, return hit/miss/sunk and updated state (only what client needs: hits, misses, sunk planes).
- [x] **1.10** Add simple in-memory store for games (e.g. `Map` by game id). Optional: persist to JSON file or DB later.

### Client (React Native)

- [x] **1.11** Configure API base URL (e.g. env or config) pointing to your Node server (use your machine IP for device/emulator, not `localhost`).
- [x] **1.12** Create an API service (e.g. `api.js`): `createGame()`, `shoot(gameId, row, col)`.
- [x] **1.13** Create a **Grid component**: render N×N cells (e.g. `TouchableOpacity` or `Pressable`), each cell shows empty / miss / hit (and optionally “sunk” styling).
- [x] **1.14** Fetch game on mount (or “New game” tap), store game id and state in component state (or Context).
- [x] **1.15** On cell tap: call `shoot(gameId, row, col)`, then update local state with server response (hits/misses) and re-render grid.
- [x] **1.16** Show feedback: “Miss”, “Hit”, “Plane sunk!” (and optionally which plane). Disable already-hit cells.

---

## Phase 2: Game Flow & UX

- [x] **2.1** **New game screen**: button “New game” that calls `createGame()` and navigates to game screen (or resets state).
- [x] **2.2** **Win/lose screen**: when all planes are sunk, show “You win!” and option to start a new game.
- [x] **2.3** **Loading & errors**: show spinner/disabled grid while request is in flight; show toast or message on network/API errors.
- [x] **2.4** **Turn/cooldown (optional)**: if you add multiplayer later, enforce “your turn” and disable grid when it’s not the player’s turn.
- [x] **2.5** **Sound/haptics (optional)**: short vibration or sound on hit/miss/sunk for better feedback.

---

## Phase 3: Polish & Optional Features

- [x] **3.1** **Difficulty**: different grid sizes or number of planes (easy/medium/hard).
- [x] **3.2** **Plane shapes**: support 2–3 distinct shapes (e.g. straight line, L, T) and show “Plane 1 sunk”, “Plane 2 sunk”.
- [x] **3.3** **Stats**: total shots, hits, accuracy (hits/shots). Store in game state or compute on client from hit/miss list.
- [x] **3.4** **Timer**: optional game timer (e.g. count-up from start).
- [ ] **3.5** **Multiplayer (later)**: PvP — two players, each with own grid; server validates turns and notifies opponent (WebSockets or polling). Not in scope for current Player vs Computer version.

---

## Recommendations

### Architecture

- **Server**: Keep game logic (grid, placement, hit detection) only on the server. Client only sends (row, col) and displays what the server returns. This avoids cheating and keeps a single source of truth.
- **State**: On client, keep “game id + list of hits/misses/sunk” from server; derive cell state from that so UI stays in sync with server.
- **API shape**: e.g. `POST /game` → `{ gameId, gridSize }`. `POST /game/:id/shoot` → `{ result: 'miss'|'hit'|'sunk', cell: { row, col }, sunkPlaneId?: number, gameOver?: boolean }`.

### Plane placement

- Represent each plane as an array of `{ row, col }` relative to a pivot, then place pivot randomly and check bounds + no overlap with existing planes.
- Prefer deterministic shapes (e.g. “L” = 4 cells, “line” = 3 cells) so “sunk” is easy to detect (all cells of that plane hit).

### React Native

- Use a **FlatList** or **ScrollView** with a grid of **Pressable** for the board; avoid thousands of views by reusing cells.
- [x] Cell size scales with **Dimensions.get('window')**: grid fits screen width (padding 32), cell size clamped 24–40 px; font scales with cell size.
- Test on both Android and iOS; use your machine’s IP in the API URL when running on a physical device.

### Node.js

- Use **environment variables** for port and optional CORS origins.
- Validate `row`/`col` in the shoot endpoint (range 0..gridSize-1) and reject invalid or already-hit cells with 400.
- Keep the in-memory game store simple at first; add Redis or a DB if you need persistence or multiple server instances.

### Security & robustness

- [x] Rate-limit shoot endpoint (1 request per second per game); returns 429; client shows “Wait 1 second between shots.”
- Don’t send plane positions to the client—only hit/miss/sunk per cell and game-over flag.

---

## Suggested File Structure

```
airplanes-game/
├── server/
│   ├── server.js          # Entry, Express, routes
│   ├── game.js            # Grid gen, plane placement, hit logic
│   ├── store.js           # In-memory game store
│   └── package.json
├── client/
│   ├── App.js
│   ├── src/
│   │   ├── api.js
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   └── GameScreen.js
│   │   └── components/
│   │       └── Grid.js
│   └── package.json
└── TASKS.md               # This file
```

---

## Quick Start Order

1. Implement server: grid + plane placement + hit logic (no HTTP first).
2. Add Express + `/game` + `/game/:id/shoot`.
3. Implement client Grid + API calls + game screen.
4. Wire “New game” and win condition.
5. Add styling, loading, and error handling.

Use this file as a checklist; tick tasks as you complete them and expand sub-tasks in code or in separate docs if needed.
