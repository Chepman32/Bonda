import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { useAppTheme } from '@/theme';
import {
  buildDragColumnUpdates,
  resolveMatrixCell,
  type MatrixCell,
  type MatrixColumnFrame,
} from '@/components/evaluationDotMatrixHelpers';

interface EvaluationDotMatrixProps {
  rowCount?: number;
  selections: Record<number, number>; // colIndex → rowIndex, may be partial
  onColumnSelect: (colIndex: number, rowIndex: number) => void;
  onColumnPanUpdate?: (colIndex: number, rowIndex: number) => void;
  onColumnPanEnd?: () => void;
}

const GREEN = '#059669';

const COLUMN_SPECS = [
  { label: 'Importance' },
  { label: 'Comfort' },
  { label: 'Activity' },
  { label: 'Future' },
  { label: 'Warmth' },
];

function DotColumn({
  colIndex,
  rowCount,
  selectedRow,
  theme,
  onLayout,
}: {
  colIndex: number;
  rowCount: number;
  selectedRow: number | undefined;
  theme: ReturnType<typeof useAppTheme>;
  onLayout?: (colIndex: number, x: number, width: number) => void;
}) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <View
      style={styles.column}
      onLayout={e => {
        onLayout?.(
          colIndex,
          e.nativeEvent.layout.x,
          e.nativeEvent.layout.width,
        );
      }}
    >
      {rows.map(rowIndex => {
        const isSelected = selectedRow === rowIndex;
        const isBelow = selectedRow !== undefined && rowIndex > selectedRow;
        const isGreen = isSelected || isBelow;
        const dotColor = isGreen ? GREEN : theme.accent;
        const outerOpacity = isSelected
          ? 0.35
          : isBelow
          ? 0.22
          : selectedRow !== undefined
          ? 0.08
          : 0.15;
        const innerOpacity = isSelected
          ? 1
          : isBelow
          ? 0.7
          : selectedRow !== undefined
          ? 0.22
          : 0.4;

        return (
          <View key={`dot-${colIndex}-${rowIndex}`} style={styles.touch}>
            <View
              style={[
                styles.outerDot,
                {
                  backgroundColor: dotColor,
                  opacity: outerOpacity,
                  transform: [{ scale: isSelected ? 1.08 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.innerDot,
                  {
                    backgroundColor: dotColor,
                    opacity: innerOpacity,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function EvaluationDotMatrix({
  rowCount = 9,
  selections,
  onColumnSelect,
  onColumnPanUpdate,
  onColumnPanEnd,
}: EvaluationDotMatrixProps) {
  const theme = useAppTheme();
  const gridHeight = useRef(0);
  const columnFrames = useRef<MatrixColumnFrame[]>([]);
  const lastDragCell = useRef<MatrixCell | null>(null);
  const latestSelections = useRef(selections);

  useEffect(() => {
    latestSelections.current = selections;
  }, [selections]);

  const handleColumnLayout = useCallback(
    (colIndex: number, x: number, width: number) => {
      columnFrames.current[colIndex] = { x, width };
    },
    [],
  );

  const emitDragAtPoint = useCallback(
    (x: number, y: number) => {
      const cell = resolveMatrixCell(
        x,
        y,
        columnFrames.current,
        gridHeight.current,
        rowCount,
      );
      if (!cell) {
        return;
      }

      const updates = buildDragColumnUpdates(
        lastDragCell.current,
        cell,
        latestSelections.current,
      );

      updates.forEach(({ colIndex, rowIndex }) => {
        latestSelections.current = {
          ...latestSelections.current,
          [colIndex]: rowIndex,
        };
        onColumnPanUpdate?.(colIndex, rowIndex);
      });

      lastDragCell.current = cell;
    },
    [onColumnPanUpdate, rowCount],
  );

  const handleTap = useCallback(
    (x: number, y: number) => {
      const cell = resolveMatrixCell(
        x,
        y,
        columnFrames.current,
        gridHeight.current,
        rowCount,
      );
      if (!cell) {
        return;
      }

      onColumnSelect(cell.colIndex, cell.rowIndex);
    },
    [onColumnSelect, rowCount],
  );

  const handlePanEnd = useCallback(() => {
    if (lastDragCell.current !== null) {
      lastDragCell.current = null;
      onColumnPanEnd?.();
    }
  }, [onColumnPanEnd]);

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(e => {
      runOnJS(emitDragAtPoint)(e.x, e.y);
    })
    .onUpdate(e => {
      runOnJS(emitDragAtPoint)(e.x, e.y);
    })
    .onFinalize(() => {
      runOnJS(handlePanEnd)();
    });

  const tapGesture = Gesture.Tap().onEnd(e => {
    runOnJS(handleTap)(e.x, e.y);
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {COLUMN_SPECS.map((spec, colIndex) => (
          <Text
            key={`header-${colIndex}`}
            numberOfLines={1}
            style={[styles.columnHeader, { color: theme.textMuted }]}
          >
            {spec.label}
          </Text>
        ))}
      </View>
      <GestureDetector gesture={composed}>
        <View
          style={styles.gridRow}
          onLayout={e => {
            gridHeight.current = e.nativeEvent.layout.height;
          }}
        >
          {COLUMN_SPECS.map((_, colIndex) => (
            <DotColumn
              key={`col-${colIndex}`}
              colIndex={colIndex}
              rowCount={rowCount}
              selectedRow={selections[colIndex]}
              onLayout={handleColumnLayout}
              theme={theme}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  touch: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerDot: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
