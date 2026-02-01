const DIFFICULTIES = {
  easy: { gridSize: 8, numPlanes: 2 },
  medium: { gridSize: 10, numPlanes: 3 },
  hard: { gridSize: 12, numPlanes: 5 },
};

const PLANE_SHAPE = [
  { r: 1, c: 0 },
  { r: 1, c: 1 },
  { r: 1, c: 2 },
  { r: 1, c: 3 },
  { r: 0, c: 1 },
  { r: 2, c: 1 },
  { r: 0, c: 3 },
  { r: 2, c: 3 },
];
const HEAD_INDEX = 0;

function getShapeCells(shape, pivotRow, pivotCol, rotation, gridSize) {
  const cells = [];
  for (const { r, c } of shape) {
    let nr = r,
      nc = c;
    for (let i = 0; i < rotation; i++) [nr, nc] = [-nc, nr];
    const row = pivotRow + nr;
    const col = pivotCol + nc;
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
    cells.push({ row, col });
  }
  return cells;
}

function placePlanes(gridSize, numPlanes) {
  const occupied = new Set();
  const planes = [];
  let attempts = 0;
  const maxAttempts = 300;

  while (planes.length < numPlanes && attempts < maxAttempts) {
    attempts++;
    const rotation = Math.floor(Math.random() * 4);
    const pivotRow = Math.floor(Math.random() * gridSize);
    const pivotCol = Math.floor(Math.random() * gridSize);
    const cells = getShapeCells(
      PLANE_SHAPE,
      pivotRow,
      pivotCol,
      rotation,
      gridSize,
    );
    if (!cells) continue;
    const keys = cells.map((c) => `${c.row},${c.col}`);
    if (keys.some((k) => occupied.has(k))) continue;
    cells.forEach((c) => occupied.add(`${c.row},${c.col}`));
    const head = cells[HEAD_INDEX];
    planes.push({
      id: planes.length + 1,
      cells,
      head: { row: head.row, col: head.col },
    });
  }

  return planes;
}

function validateCustomPlanes(customPlanes, gridSize, numPlanes) {
  if (!Array.isArray(customPlanes) || customPlanes.length !== numPlanes)
    return false;
  const occupied = new Set();
  for (const plane of customPlanes) {
    if (!plane?.cells?.length || !plane?.head) return false;
    const head = plane.head;
    if (
      typeof head.row !== "number" ||
      typeof head.col !== "number" ||
      head.row < 0 ||
      head.row >= gridSize ||
      head.col < 0 ||
      head.col >= gridSize
    )
      return false;
    for (const { row, col } of plane.cells) {
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize)
        return false;
      const key = `${row},${col}`;
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }
  return true;
}

function createGame(difficulty = "medium", customPlanes = null) {
  const config = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;
  const { gridSize, numPlanes } = config;
  let planes;
  if (validateCustomPlanes(customPlanes, gridSize, numPlanes)) {
    planes = customPlanes.map((p, i) => ({
      id: i + 1,
      cells: p.cells.map((c) => ({ row: c.row, col: c.col })),
      head: { row: p.head.row, col: p.head.col },
    }));
  } else {
    planes = placePlanes(gridSize, numPlanes);
  }
  const hits = new Set();
  const shotCells = new Set();

  return {
    gridSize,
    numPlanes,
    planes,
    hits,
    shotCells,
  };
}

function shoot(game, row, col) {
  const key = `${row},${col}`;
  if (game.shotCells.has(key)) return { error: "already_shot" };
  if (row < 0 || row >= game.gridSize || col < 0 || col >= game.gridSize) {
    return { error: "out_of_bounds" };
  }
  game.shotCells.add(key);

  let hitPlaneId = null;
  const isHeadHit = game.planes.some(
    (p) => p.head.row === row && p.head.col === col,
  );
  if (isHeadHit) {
    const plane = game.planes.find(
      (p) => p.head.row === row && p.head.col === col,
    );
    if (plane) {
      plane.cells.forEach((c) => game.hits.add(`${c.row},${c.col}`));
      hitPlaneId = plane.id;
    }
  } else {
    for (const plane of game.planes) {
      const inPlane = plane.cells.some((c) => c.row === row && c.col === col);
      if (inPlane) {
        game.hits.add(key);
        const allHit = plane.cells.every((c) =>
          game.hits.has(`${c.row},${c.col}`),
        );
        if (allHit) hitPlaneId = plane.id;
        break;
      }
    }
  }

  const sunkPlanes = game.planes
    .filter((p) => p.cells.every((c) => game.hits.has(`${c.row},${c.col}`)))
    .map((p) => p.id);
  const gameOver = sunkPlanes.length === game.planes.length;

  const result = game.hits.has(key) ? (hitPlaneId ? "sunk" : "hit") : "miss";

  return {
    result,
    cell: { row, col },
    sunkPlaneId: hitPlaneId || undefined,
    sunkPlaneIds: [...new Set(sunkPlanes)],
    gameOver,
    hits: Array.from(game.hits).map((k) => {
      const [r, c] = k.split(",").map(Number);
      return { row: r, col: c };
    }),
    misses: Array.from(game.shotCells)
      .filter((k) => !game.hits.has(k))
      .map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      }),
  };
}

function getPlaneCells(game) {
  const cells = [];
  for (const plane of game.planes) {
    for (const { row, col } of plane.cells) {
      cells.push({ row, col });
    }
  }
  return cells;
}

export { DIFFICULTIES, createGame, shoot, getPlaneCells };
