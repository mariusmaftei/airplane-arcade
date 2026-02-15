export const PLANE_SHAPE = [
  { r: 1, c: 0 },
  { r: 1, c: 1 },
  { r: 1, c: 2 },
  { r: 1, c: 3 },
  { r: 0, c: 1 },
  { r: 2, c: 1 },
  { r: 0, c: 3 },
  { r: 2, c: 3 },
];
export const HEAD_INDEX = 0;

const HEAD_OFFSET_BY_ROTATION = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export function getShapeCells(shape, pivotRow, pivotCol, rotation, gridSize) {
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

export function getShapeCellsFromHead(shape, headRow, headCol, rotation, gridSize) {
  const [dr, dc] = HEAD_OFFSET_BY_ROTATION[rotation % 4] ?? [1, 0];
  const pivotRow = headRow - dr;
  const pivotCol = headCol - dc;
  return getShapeCells(shape, pivotRow, pivotCol, rotation, gridSize);
}
