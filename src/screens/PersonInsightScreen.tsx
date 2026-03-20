import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ContactAvatar } from '@/components/ContactAvatar';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { getContactPlacementDescription } from '@/services/insightService';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonInsight'>;

export function PersonInsightScreen({ route }: Props) {
  const theme = useAppTheme();
  const contact = useAppStore(state =>
    state.contacts.find(item => item.id === route.params.contactId),
  );
  const evaluation = useAppStore(state =>
    Object.values(state.evaluations).find(
      item => item.contactId === route.params.contactId,
    ),
  );

  if (!contact) {
    return (
      <Screen contentStyle={styles.empty}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Contact not found.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <GlassCard style={styles.header}>
        <ContactAvatar contact={contact} size={84} />
        <Text style={[styles.name, { color: theme.text }]}>
          {contact.displayName}
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {getContactPlacementDescription(contact, evaluation)}
        </Text>
      </GlassCard>
      {evaluation ? (
        <GlassCard style={styles.metrics}>
          <MetricBar label="Importance" value={evaluation.scores.importance} />
          <MetricBar label="Comfort" value={evaluation.scores.comfort} />
          <MetricBar label="Activity" value={evaluation.scores.activity} />
          <MetricBar
            label="Future attention"
            value={evaluation.scores.futureAttention}
          />
        </GlassCard>
      ) : null}
    </Screen>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View style={styles.metricBar}>
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {Math.round(value)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.accent,
              width: `${value}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  metrics: {
    gap: 14,
  },
  metricBar: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 999,
  },
  fill: {
    height: 10,
    borderRadius: 999,
  },
});
