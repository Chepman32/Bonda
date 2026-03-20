import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useAppTheme } from '@/theme';

interface ProgressStripProps {
  processed: number;
  skipped: number;
  streak: number;
}

export function ProgressStrip({
  processed,
  skipped,
  streak,
}: ProgressStripProps) {
  const theme = useAppTheme();

  return (
    <GlassCard style={styles.container}>
      <Metric label="Processed" value={processed} />
      <Metric label="Skipped" value={skipped} />
      <Metric label="Streak" value={streak} />
      <View
        style={[
          styles.glow,
          {
            backgroundColor: theme.glow,
          },
        ]}
      />
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View style={styles.metric}>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  metric: {
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 120,
    right: -20,
    top: -30,
  },
});
