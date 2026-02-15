# Plane Placement Rules

## Plane Dock

The Plane dock is where planes stand until the user decides to place them on the game board.

- In the Plane dock the user can **rotate** the plane before grabbing it and moving it to the game board
- **A single plane** should be shown in the plane dock at a time

## Game Board

The game board is where the user creates their strategy.

- Planes are grabbed from the Plane Dock and dropped onto the game board
- The user can **pick a placed plane** and **reposition** it to different grids to refine their strategy
- Once satisfied, the user presses **Confirm** and moves to the next plane placement

---

## Implementation

| Rule | Component | Status |
|------|-----------|--------|
| Single plane in dock | `PlaneDock` + tabs (`selectedPlaneIndex`) | ✅ |
| Rotate before grab | `onRotate` button, disabled when plane on board | ✅ |
| Grab & drag to board | `PlaneDock` PanResponder, no ScrollView blocking | ✅ |
| Drop preview (head at drop cell) | `getShapeCellsFromHead` for correct placement | ✅ |
| Pick placed plane | `Pressable` on each plane cell → `onStartMovePlane` | ✅ |
| Reposition (drag preview) | `PlacementGrid` PanResponder → `onDragMove` | ✅ |
| Confirm & next plane | `handleConfirmPlace` → `selectedPlaneIndex++` | ✅ |
| Clear / remove plane | `handleClearPlane` | ✅ |
