import { clamp } from '@/utils/math';

export interface MatrixColumnFrame {
  x: number;
  width: number;
}

export interface MatrixCell {
  colIndex: number;
  rowIndex: number;
}

export interface MatrixColumnUpdate {
  colIndex: number;
  rowIndex: number;
}

export function resolveMatrixRow(
  y: number,
  height: number,
  rowCount: number,
): number {
  if (height <= 0 || rowCount <= 0) {
    return 0;
  }

  const clampedY = clamp(y, 0, height);
  const rowHeight = height / rowCount;
  const row = Math.floor(clampedY / rowHeight);

  return clamp(row, 0, rowCount - 1);
}

export function resolveMatrixColumn(
  x: number,
  columnFrames: MatrixColumnFrame[],
): number | null {
  if (columnFrames.length === 0) {
    return null;
  }

  const leftEdge = columnFrames[0].x;
  const rightEdge =
    columnFrames[columnFrames.length - 1].x +
    columnFrames[columnFrames.length - 1].width;
  const clampedX = clamp(x, leftEdge, rightEdge);

  const directMatch = columnFrames.findIndex(frame => {
    const frameEnd = frame.x + frame.width;
    return clampedX >= frame.x && clampedX <= frameEnd;
  });

  if (directMatch >= 0) {
    return directMatch;
  }

  return columnFrames.reduce((closestIndex, frame, index) => {
    const closestFrame = columnFrames[closestIndex];
    const closestDistance = Math.abs(
      clampedX - (closestFrame.x + closestFrame.width / 2),
    );
    const nextDistance = Math.abs(clampedX - (frame.x + frame.width / 2));

    return nextDistance < closestDistance ? index : closestIndex;
  }, 0);
}

export function resolveMatrixCell(
  x: number,
  y: number,
  columnFrames: MatrixColumnFrame[],
  height: number,
  rowCount: number,
): MatrixCell | null {
  const colIndex = resolveMatrixColumn(x, columnFrames);
  if (colIndex === null) {
    return null;
  }

  return {
    colIndex,
    rowIndex: resolveMatrixRow(y, height, rowCount),
  };
}

export function buildDragColumnUpdates(
  previousCell: MatrixCell | null,
  nextCell: MatrixCell,
  selections: Record<number, number>,
): MatrixColumnUpdate[] {
  if (previousCell === null) {
    return selections[nextCell.colIndex] === nextCell.rowIndex
      ? []
      : [nextCell];
  }

  if (previousCell.colIndex === nextCell.colIndex) {
    return selections[nextCell.colIndex] === nextCell.rowIndex
      ? []
      : [nextCell];
  }

  const step = nextCell.colIndex > previousCell.colIndex ? 1 : -1;
  const updates: MatrixColumnUpdate[] = [];

  for (
    let colIndex = previousCell.colIndex + step;
    step > 0 ? colIndex <= nextCell.colIndex : colIndex >= nextCell.colIndex;
    colIndex += step
  ) {
    if (selections[colIndex] !== nextCell.rowIndex) {
      updates.push({ colIndex, rowIndex: nextCell.rowIndex });
    }
  }

  return updates;
}
