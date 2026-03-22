import {
  buildDragColumnUpdates,
  resolveMatrixCell,
  resolveMatrixColumn,
  resolveMatrixRow,
} from '@/components/evaluationDotMatrixHelpers';

describe('evaluationDotMatrixHelpers', () => {
  const frames = [
    { x: 0, width: 40 },
    { x: 50, width: 40 },
    { x: 100, width: 40 },
    { x: 150, width: 40 },
    { x: 200, width: 40 },
  ];

  it('maps touch coordinates to matrix cells at boundaries', () => {
    expect(resolveMatrixCell(0, 0, frames, 180, 9)).toEqual({
      colIndex: 0,
      rowIndex: 0,
    });
    expect(resolveMatrixCell(240, 180, frames, 180, 9)).toEqual({
      colIndex: 4,
      rowIndex: 8,
    });
  });

  it('maps gaps between columns to the nearest column', () => {
    expect(resolveMatrixColumn(45, frames)).toBe(0);
    expect(resolveMatrixColumn(46, frames)).toBe(1);
  });

  it('clamps row resolution above and below the grid', () => {
    expect(resolveMatrixRow(-20, 180, 9)).toBe(0);
    expect(resolveMatrixRow(400, 180, 9)).toBe(8);
  });

  it('updates only the touched adjacent column during a diagonal drag', () => {
    expect(
      buildDragColumnUpdates(
        { colIndex: 0, rowIndex: 4 },
        { colIndex: 1, rowIndex: 3 },
        { 0: 4 },
      ),
    ).toEqual([{ colIndex: 1, rowIndex: 3 }]);
  });

  it('fills skipped columns when a drag jumps across the matrix', () => {
    expect(
      buildDragColumnUpdates(
        { colIndex: 0, rowIndex: 4 },
        { colIndex: 3, rowIndex: 2 },
        { 0: 4, 1: 4 },
      ),
    ).toEqual([
      { colIndex: 1, rowIndex: 2 },
      { colIndex: 2, rowIndex: 2 },
      { colIndex: 3, rowIndex: 2 },
    ]);
  });

  it('deduplicates updates when columns already have the target row', () => {
    expect(
      buildDragColumnUpdates(
        { colIndex: 1, rowIndex: 5 },
        { colIndex: 3, rowIndex: 5 },
        { 2: 5, 3: 5 },
      ),
    ).toEqual([]);

    expect(
      buildDragColumnUpdates(null, { colIndex: 2, rowIndex: 4 }, { 2: 4 }),
    ).toEqual([]);
  });
});
