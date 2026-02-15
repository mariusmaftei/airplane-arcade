# Plane Placement Flow

How the user places planes on the game board before starting a match.

---

## Overview

1. Pick a plane from the dock  
2. Drop it on the game board  
3. Adjust position (optional)  
4. Confirm to lock it  
5. Repeat for all planes  

---

## Step-by-Step

### 1. Select plane

- Use the numbered tabs to choose which plane to place (1, 2, 3, …)
- The selected plane appears in the **Plane dock** above the board

### 2. Rotate (optional)

- Press **Rotate** to change direction (0°, 90°, 180°, 270°)
- Rotation only affects the dock before you drop the plane

### 3. Drop plane on board

- **Press and hold** on the plane in the dock
- **Drag** it down to the game board
- **Release** when over the desired area
- The plane appears as a **preview** (green = valid, red = invalid)

### 4. Adjust position

- Drag the preview on the board to another cell
- Or for a **placed** plane: hold on it and drag to move it
- Release and press **Confirm** to lock the new position

### 5. Confirm

- Press **Confirm** when the preview is valid (green)
- The plane is locked; the next plane is selected
- Repeat steps 1–4 for each plane

### 6. Clear (optional)

- Press **Clear** to:
  - Cancel the current preview, or
  - Remove a placed plane and return it to the dock

---

## Rules

| Situation                 | Result                                                |
|--------------------------|-------------------------------------------------------|
| Plane dropped on board   | Appears as preview; dock locked until Clear/Confirm  |
| Preview on invalid spot  | Red preview; Confirm disabled                        |
| Preview on valid spot    | Green preview; Confirm enabled                        |
| Placed plane selected    | Hold and drag to reposition; then press Confirm       |
| All planes placed        | **Start game** becomes enabled                        |

---

## Visual states

- **Plane dock** – Shows the current plane; drag to board
- **Green preview** – Valid placement (no overlap)
- **Red preview** – Invalid placement (overlaps another plane)
- **Colored cells** – Locked planes (purple, green, orange)
