import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DismissButton } from '@/components/DismissButton';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { formatSessionDate } from '@/utils/formatting';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionHistory'>;

export function SessionHistoryScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const history = useAppStore(state => state.history);
  const loadHistory = useAppStore(state => state.loadHistory);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <Screen>
      <DismissButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: theme.text }]}>Session history</Text>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {item.mode} session
            </Text>
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>
              {formatSessionDate(item.updatedAt)}
            </Text>
            <View style={styles.row}>
              <Metric label="Processed" value={item.processedCount} />
              <Metric label="Skipped" value={item.skippedCount} />
              <Metric label="Ready" value={item.readyCount} />
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          <GlassCard>
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>
              Your completed sessions will appear here.
            </Text>
          </GlassCard>
        }
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
