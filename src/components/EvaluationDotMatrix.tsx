import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

interface EvaluationDotMatrixProps {
  rowCount?: number;
  selections: Record<number, number>; // colIndex → rowIndex, may be partial
  onColumnSelect: (colIndex: number, rowIndex: number) => void;
}

const GREEN = '#059669';

const COLUMN_SPECS = [
  { label: 'Importance' },
  { label: 'Comfort' },
  { label: 'Activity' },
  { label: 'Future' },
  { label: 'Warmth' },
];

export function EvaluationDotMatrix({
  rowCount = 9,
  selections,
  onColumnSelect,
}: EvaluationDotMatrixProps) {
  const theme = useAppTheme();
  const rows = Array.from({ length: rowCount }, (_, index) => index);

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
        {COLUMN_SPECS.map((_, colIndex) => {
          const selectedRow = selections[colIndex];
          return (
            <View key={`col-${colIndex}`} style={styles.column}>
              {rows.map(rowIndex => {
                const isSelected = selectedRow === rowIndex;
                const isBelow =
                  selectedRow !== undefined && rowIndex > selectedRow;
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
                  <Pressable
                    accessibilityLabel={`${
                      COLUMN_SPECS[colIndex].label
                    } level ${rowIndex + 1}`}
                    accessibilityRole="button"
                    key={`dot-${colIndex}-${rowIndex}`}
                    onPress={() => onColumnSelect(colIndex, rowIndex)}
                    style={styles.touch}
                  >
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
                  </Pressable>
                );
              })}
            </View>
          );
        })}
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
