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
