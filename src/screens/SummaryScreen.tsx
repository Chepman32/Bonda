import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BubbleMap } from '@/components/BubbleMap';
import { GlassCard } from '@/components/GlassCard';
import { InsightCard } from '@/components/InsightCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { buildBubbleNodes } from '@/services/insightService';
import { computeSummaryMetrics } from '@/services/scoringService';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

const modes = [
  'importance',
  'warmth',
  'recency',
  'support',
  'complexity',
  'cluster',
] as const;

export function SummaryScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const clusters = useAppStore(state => state.clusters);
  const insights = useAppStore(state => state.insights);
  const analysisMode = useAppStore(state => state.analysisMode);
  const setAnalysisMode = useAppStore(state => state.setAnalysisMode);

  const [detailsVisible, setDetailsVisible] = useState(false);

  const evaluationList = Object.values(evaluations);
  const metrics = useMemo(
    () => computeSummaryMetrics(evaluationList),
    [evaluationList],
  );
  const nodes = useMemo(
    () => buildBubbleNodes(contacts, evaluationList, clusters, analysisMode),
    [analysisMode, clusters, contacts, evaluationList],
  );

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>
        Your social bubble
      </Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        A living summary of connection, warmth, and attention.
      </Text>
      <BubbleMap
        nodes={nodes}
        onSelect={contactId =>
          navigation.navigate(ROUTES.PersonInsight, {
            contactId,
          })
        }
      />
      <PrimaryButton
        label="View Details"
        onPress={() => setDetailsVisible(true)}
      />
      <View style={styles.actions}>
        <PrimaryButton
          label="Export"
          onPress={() => navigation.navigate(ROUTES.ExportSnapshot)}
        />
        <PrimaryButton
          label="Go Home"
          onPress={() => navigation.navigate(ROUTES.ModeSelection)}
          variant="secondary"
        />
      </View>

      <Modal
        visible={detailsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Details
            </Text>
            <Pressable
              onPress={() => setDetailsVisible(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X color={theme.textMuted} size={22} />
            </Pressable>
          </View>

          {/* Metrics */}
          <GlassCard style={styles.metricRow}>
            <SummaryMetric label="Core" value={Math.round(metrics.coreScore)} />
            <SummaryMetric label="Warmth" value={Math.round(metrics.warmth)} />
            <SummaryMetric
              label="Support"
              value={Math.round(metrics.supportDensity)}
            />
          </GlassCard>

          {/* Mode filter pills */}
          <View style={styles.modeRow}>
            {modes.map(mode => (
              <Text
                key={mode}
                onPress={() => setAnalysisMode(mode)}
                style={[
                  styles.modePill,
                  {
                    color: analysisMode === mode ? theme.text : theme.textMuted,
                    borderColor:
                      analysisMode === mode ? theme.accent : theme.border,
                  },
                ]}
              >
                {mode}
              </Text>
            ))}
          </View>

          {/* Insights list */}
          <FlatList
            data={insights}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <InsightCard insight={item} />}
            contentContainerStyle={styles.insightList}
          />
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
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
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  insightList: {
    gap: 12,
    paddingBottom: 32,
  },
});
