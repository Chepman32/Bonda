import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BubbleMap } from '@/components/BubbleMap';
import { DismissButton } from '@/components/DismissButton';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { exportFromRef, shareExport } from '@/services/export/exportService';
import { buildBubbleNodes } from '@/services/insightService';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { computeSummaryMetrics } from '@/services/scoringService';
import type { ExportPreset } from '@/models/entities';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExportSnapshot'>;

const exportTypes: ExportPreset['type'][] = ['poster', 'stats', 'loop', 'pdf'];

export function ExportSnapshotScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const exportHideNames = useAppStore(state => state.settings.exportHideNames);
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const clusters = useAppStore(state => state.clusters);
  const exportCardRef = useRef<View>(null);
  const [selectedType, setSelectedType] =
    useState<ExportPreset['type']>('poster');
  const evaluationList = Object.values(evaluations);
  const metrics = useMemo(
    () => computeSummaryMetrics(evaluationList),
    [evaluationList],
  );
  const nodes = useMemo(
    () => buildBubbleNodes(contacts, evaluationList, clusters, 'cluster'),
    [clusters, contacts, evaluationList],
  );

  async function handleExport() {
    const preset = await exportFromRef({
      ref: exportCardRef,
      title: `bonda-${selectedType}`,
      type: selectedType,
      hideNames: exportHideNames,
      summaryPayload: metrics,
    });

    await getDataRepository().saveExport(preset);
    await shareExport(preset);
  }

  return (
    <Screen scroll>
      <DismissButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: theme.text }]}>Export snapshot</Text>
      <View ref={exportCardRef} collapsable={false}>
        <GlassCard style={styles.preview}>
          <Text style={[styles.previewTitle, { color: theme.text }]}>
            Bonda
          </Text>
          <Text style={[styles.previewBody, { color: theme.textMuted }]}>
            {selectedType === 'poster'
              ? 'Poster image'
              : selectedType === 'stats'
              ? 'Minimal statistics card'
              : selectedType === 'loop'
              ? 'Animated loop'
              : 'Insight PDF'}
          </Text>
          <BubbleMap nodes={nodes.slice(0, 14)} />
          <View style={styles.metrics}>
            <Text style={[styles.metric, { color: theme.text }]}>
              Core {Math.round(metrics.coreScore)}
            </Text>
            <Text style={[styles.metric, { color: theme.text }]}>
              Warmth {Math.round(metrics.warmth)}
            </Text>
            <Text style={[styles.metric, { color: theme.text }]}>
              Support {Math.round(metrics.supportDensity)}
            </Text>
          </View>
        </GlassCard>
      </View>
      <View style={styles.types}>
        {exportTypes.map(type => (
          <PrimaryButton
            key={type}
            label={type}
            onPress={() => setSelectedType(type)}
            variant={selectedType === type ? 'primary' : 'secondary'}
          />
        ))}
      </View>
      <PrimaryButton
        label="Generate and share"
        onPress={() => void handleExport()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  preview: {
    gap: 14,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  previewBody: {
    fontSize: 14,
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metric: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  types: {
    gap: 12,
  },
});
