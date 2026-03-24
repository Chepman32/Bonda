import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { fontFamilies } from '@/theme/fonts';
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
  advanceAnimationToken?: number;
  interactionDisabled?: boolean;
}

const GREEN = '#059669';
const AnimatedView = Animated.createAnimatedComponent(View);

const COLUMN_SPECS = [
  { label: 'Importance' },
  { label: 'Comfort' },
  { label: 'Activity' },
  { label: 'Future' },
  { label: 'Warmth' },
];

function DotNode({
  colIndex,
  rowIndex,
  selectedRow,
  theme,
  resetProgress,
}: {
  colIndex: number;
  rowIndex: number;
  selectedRow: number | undefined;
  theme: ReturnType<typeof useAppTheme>;
  resetProgress: SharedValue<number>;
}) {
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

  const outerAnimatedStyle = useAnimatedStyle(() => {
    const phase = interpolate(
      resetProgress.value,
      [colIndex * 0.12, 0.9 + colIndex * 0.04],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const lift = interpolate(phase, [0, 0.45, 1], [0, -8, 40]);
    const scale = interpolate(
      phase,
      [0, 0.5, 1],
      [isSelected ? 1.08 : 1, 1.12, 0.72],
    );
    const opacityMultiplier = interpolate(phase, [0, 0.45, 1], [1, 0.94, 0]);

    return {
      opacity: outerOpacity * opacityMultiplier,
      transform: [{ translateY: lift }, { scale }],
    };
  }, [colIndex, isSelected, outerOpacity]);

  const innerAnimatedStyle = useAnimatedStyle(() => {
    const phase = interpolate(
      resetProgress.value,
      [colIndex * 0.12, 0.92 + colIndex * 0.04],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity:
        innerOpacity *
        interpolate(phase, [0, 0.55, 1], [1, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(
            phase,
            [0, 0.45, 1],
            [1, 1.08, 0.78],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [colIndex, innerOpacity]);

  return (
    <View style={styles.touch}>
      <AnimatedView
        style={[
          styles.outerDot,
          outerAnimatedStyle,
          {
            backgroundColor: dotColor,
          },
        ]}
      >
        <AnimatedView
          style={[
            styles.innerDot,
            innerAnimatedStyle,
            {
              backgroundColor: dotColor,
            },
          ]}
        />
      </AnimatedView>
    </View>
  );
}

function DotColumn({
  colIndex,
  rowCount,
  selectedRow,
  theme,
  onLayout,
  resetProgress,
}: {
  colIndex: number;
  rowCount: number;
  selectedRow: number | undefined;
  theme: ReturnType<typeof useAppTheme>;
  onLayout?: (colIndex: number, x: number, width: number) => void;
  resetProgress: SharedValue<number>;
}) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);
  const columnAnimatedStyle = useAnimatedStyle(() => {
    const phase = interpolate(
      resetProgress.value,
      [colIndex * 0.1, 0.95 + colIndex * 0.04],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        {
          translateY: interpolate(
            phase,
            [0, 0.3, 1],
            [0, -4, 14],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            phase,
            [0, 0.35, 1],
            [1, 1.015, 0.985],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, [colIndex]);

  return (
    <AnimatedView
      style={[styles.column, columnAnimatedStyle]}
      onLayout={e => {
        onLayout?.(
          colIndex,
          e.nativeEvent.layout.x,
          e.nativeEvent.layout.width,
        );
      }}
    >
      {rows.map(rowIndex => {
        return (
          <DotNode
            key={`dot-${colIndex}-${rowIndex}`}
            colIndex={colIndex}
            rowIndex={rowIndex}
            selectedRow={selectedRow}
            theme={theme}
            resetProgress={resetProgress}
          />
        );
      })}
    </AnimatedView>
  );
}

export function EvaluationDotMatrix({
  rowCount = 9,
  selections,
  onColumnSelect,
  onColumnPanUpdate,
  onColumnPanEnd,
  advanceAnimationToken = 0,
  interactionDisabled = false,
}: EvaluationDotMatrixProps) {
  const theme = useAppTheme();
  const gridHeight = useRef(0);
  const columnFrames = useRef<MatrixColumnFrame[]>([]);
  const lastDragCell = useRef<MatrixCell | null>(null);
  const latestSelections = useRef(selections);
  const advanceSelectionsSnapshot = useRef<Record<number, number>>({});
  const previousAdvanceToken = useRef(advanceAnimationToken);
  const resetProgress = useSharedValue(0);
  const shellProgress = useSharedValue(0);
  const displaySelections =
    interactionDisabled &&
    Object.keys(advanceSelectionsSnapshot.current).length > 0
      ? advanceSelectionsSnapshot.current
      : selections;

  useEffect(() => {
    latestSelections.current = selections;
  }, [selections]);

  useEffect(() => {
    if (advanceAnimationToken === previousAdvanceToken.current) {
      return;
    }

    previousAdvanceToken.current = advanceAnimationToken;
    advanceSelectionsSnapshot.current = selections;
    resetProgress.value = 0;
    shellProgress.value = 0;
    resetProgress.value = withSpring(1, {
      damping: 18,
      stiffness: 150,
      mass: 0.8,
      velocity: 2.8,
    });
    shellProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 185,
      mass: 0.72,
      velocity: 2.2,
    });
  }, [advanceAnimationToken, resetProgress, selections, shellProgress]);

  useEffect(() => {
    if (!interactionDisabled) {
      advanceSelectionsSnapshot.current = {};
      resetProgress.value = 0;
      shellProgress.value = 0;
    }
  }, [interactionDisabled, resetProgress, shellProgress]);

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
    .enabled(!interactionDisabled)
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

  const tapGesture = Gesture.Tap()
    .enabled(!interactionDisabled)
    .onEnd(e => {
      runOnJS(handleTap)(e.x, e.y);
    });

  const composed = Gesture.Exclusive(panGesture, tapGesture);
  const shellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          shellProgress.value,
          [0, 0.3, 1],
          [1, 1.012, 0.992],
          Extrapolation.CLAMP,
        ),
      },
      {
        translateY: interpolate(
          shellProgress.value,
          [0, 0.32, 1],
          [0, -6, 10],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      shellProgress.value,
      [0, 0.8, 1],
      [1, 1, 0.94],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <AnimatedView
      style={[
        styles.shell,
        shellAnimatedStyle,
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
              selectedRow={displaySelections[colIndex]}
              onLayout={handleColumnLayout}
              resetProgress={resetProgress}
              theme={theme}
            />
          ))}
        </View>
      </GestureDetector>
    </AnimatedView>
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
    fontFamily: fontFamilies.semibold,
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
    fontFamily: fontFamilies.semibold,
    textAlign: 'center',
  },
});
