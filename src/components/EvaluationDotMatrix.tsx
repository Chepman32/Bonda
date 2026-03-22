import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { useAppTheme } from '@/theme';

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
  onTap,
  onPanUpdate,
  onPanEnd,
  theme,
}: {
  colIndex: number;
  rowCount: number;
  selectedRow: number | undefined;
  onTap: (colIndex: number, rowIndex: number) => void;
  onPanUpdate?: (colIndex: number, rowIndex: number) => void;
  onPanEnd?: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const columnHeight = useRef(0);
  const lastEmittedRow = useSharedValue(-1);
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  const yToRow = useCallback(
    (y: number): number => {
      'worklet';
      const h = columnHeight.current;
      if (h <= 0) return 0;
      const clamped = Math.max(0, Math.min(y, h));
      // space-between: first dot center at rowHeight/2, last at h - rowHeight/2
      const rowHeight = h / rowCount;
      const row = Math.floor(clamped / rowHeight);
      return Math.max(0, Math.min(row, rowCount - 1));
    },
    [rowCount],
  );

  const handlePanUpdate = useCallback(
    (row: number) => {
      onPanUpdate?.(colIndex, row);
    },
    [colIndex, onPanUpdate],
  );

  const handlePanEnd = useCallback(() => {
    onPanEnd?.();
  }, [onPanEnd]);

  const handleTap = useCallback(
    (row: number) => {
      onTap(colIndex, row);
    },
    [colIndex, onTap],
  );

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(e => {
      const row = yToRow(e.y);
      lastEmittedRow.value = row;
      runOnJS(handlePanUpdate)(row);
    })
    .onUpdate(e => {
      const row = yToRow(e.y);
      if (row !== lastEmittedRow.value) {
        lastEmittedRow.value = row;
        runOnJS(handlePanUpdate)(row);
      }
    })
    .onEnd(() => {
      lastEmittedRow.value = -1;
      runOnJS(handlePanEnd)();
    });

  const tapGesture = Gesture.Tap().onEnd(e => {
    const row = yToRow(e.y);
    runOnJS(handleTap)(row);
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composed}>
      <View
        style={styles.column}
        onLayout={e => {
          columnHeight.current = e.nativeEvent.layout.height;
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
    </GestureDetector>
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
      <View style={styles.gridRow}>
        {COLUMN_SPECS.map((_, colIndex) => (
          <DotColumn
            key={`col-${colIndex}`}
            colIndex={colIndex}
            rowCount={rowCount}
            selectedRow={selections[colIndex]}
            onTap={onColumnSelect}
            onPanUpdate={onColumnPanUpdate}
            onPanEnd={onColumnPanEnd}
            theme={theme}
          />
        ))}
      </View>
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
