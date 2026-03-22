import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

interface EvaluationDotMatrixProps {
  rowCount?: number;
  selections: Record<number, number>; // colIndex → rowIndex, may be partial
  onColumnSelect: (colIndex: number, rowIndex: number) => void;
}

const COLUMN_SPECS = [
  { label: 'Importance' },
  { label: 'Comfort' },
  { label: 'Activity' },
  { label: 'Future' },
];

export function EvaluationDotMatrix({
  rowCount = 6,
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
        <View style={styles.rowLabelSpacer} />
        {COLUMN_SPECS.map((spec, colIndex) => (
          <Text
            key={`header-${colIndex}`}
            style={[styles.columnHeader, { color: theme.textMuted }]}
          >
            {spec.label}
          </Text>
        ))}
      </View>
      <View style={styles.gridRow}>
        <View style={styles.rowLabels}>
          <Text style={[styles.rowLabel, { color: theme.textMuted }]}>
            High
          </Text>
          <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Low</Text>
        </View>
        {COLUMN_SPECS.map((_, colIndex) => {
          const selectedRow = selections[colIndex];
          return (
            <View key={`col-${colIndex}`} style={styles.column}>
              {rows.map(rowIndex => {
                const isSelected = selectedRow === rowIndex;
                const distance =
                  selectedRow !== undefined
                    ? Math.abs(rowIndex - selectedRow)
                    : rowCount;
                const outerOpacity = isSelected
                  ? 0.28
                  : Math.max(0.08, 0.2 - distance * 0.03);
                const innerOpacity = isSelected
                  ? 1
                  : Math.max(0.22, 0.72 - distance * 0.12);

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
                          backgroundColor: theme.accent,
                          opacity: outerOpacity,
                          transform: [{ scale: isSelected ? 1.08 : 1 }],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.innerDot,
                          {
                            backgroundColor: theme.accent,
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
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Score each dimension — tap to select a level
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
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
  rowLabelSpacer: {
    width: 28,
  },
  columnHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rowLabels: {
    width: 28,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  column: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  touch: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerDot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
