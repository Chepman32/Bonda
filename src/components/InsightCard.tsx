import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import type { InsightCard as InsightCardModel } from '@/models/entities';
import { useAppTheme } from '@/theme';

interface InsightCardProps {
  insight: InsightCardModel;
}

export function InsightCard({ insight }: InsightCardProps) {
  const theme = useAppTheme();

  return (
    <GlassCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {insight.title}
        </Text>
        <Text style={[styles.metric, { color: theme.accent }]}>
          {insight.metric}
        </Text>
      </View>
      <Text style={[styles.body, { color: theme.textMuted }]}>
        {insight.description}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  metric: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
});
