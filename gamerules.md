# Game rules

## Layout

- **Main board**: The primary grid the current actor shoots at (or watches when it's the opponent's turn).
- **Carousel**: A row of mini boards below the main board.
  - **vs CPU**: The carousel shows one board — either **Your board** (during your turn) or **CPU** (during CPU turn).
  - **Multiplayer**: The carousel shows the other players' boards.

## Vs CPU

- When it says **Player1's turn** (or the player's name):
  - **Main board** = CPU's board (planes are secret and randomized by the CPU). You shoot at this board.
  - **Carousel** = Your board (your defense). It appears in the carousel like a queue until the CPU's turn ends.

- When it's **CPU turn**:
  - **Main board** = Your board (you see the CPU shooting at your planes).
  - **Carousel** = CPU's board.

## Turn end

- A turn ends when the current actor **misses** (shoots a cell that is not part of a plane).
- **Hit** or **sunk** (part of a plane or whole plane destroyed) → same actor keeps the turn.
- **Miss** → turn ends; the other side (player or CPU) takes the turn.

## Versus Await

- **Purpose**: So the player clearly sees that the turn ended (e.g. "CPU vs Player") instead of the board changing in a blink.
- **Placement**: The versus screen is **not** full screen. It appears **where the game board is** (same area as the grid), so the turn bar and bottom bar stay visible.
- **Timing**:
  1. User or CPU shoots → **effects first**: hit/explosion sound + explosion image, or miss sound + smoke image (about 2 seconds).
  2. **After** effects finish → the game board (grid + carousel) disappears for **2 seconds** and is replaced by the versus text (e.g. "CPU vs Player" or "Player vs CPU" depending on whose turn is next).
  3. After 2 seconds → versus disappears and the game board appears again with the new turn.
- **Flow (example)**: User shoots and misses → miss sound + smoke play (~2 sec) → game board area shows "CPU vs Player" for 2 sec → game board returns with CPU turn.
