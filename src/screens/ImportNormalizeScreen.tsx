import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { OrbitalProgress } from '@/components/OrbitalProgress';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { normalizeProgress } from '@/utils/math';
import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportNormalize'>;

export function ImportNormalizeScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const importProgress = useAppStore(state => state.importProgress);
  const importContactsIntoState = useAppStore(
    state => state.importContactsIntoState,
  );
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    void importContactsIntoState(route.params?.usePreview);
  }, [importContactsIntoState, route.params?.usePreview]);

  useEffect(() => {
    if (importProgress.stage !== 'complete') {
      return;
    }

    const timeout = setTimeout(() => {
      navigation.replace(ROUTES.Main, { screen: ROUTES.ModeSelection });
    }, 900);

    return () => clearTimeout(timeout);
  }, [importProgress.stage, navigation]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.center}>
        <OrbitalProgress
          progress={
            normalizeProgress(
              importProgress.ready,
              Math.max(importProgress.total, 1),
            ) * 100
          }
        />
      </View>
      <GlassCard style={styles.metrics}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('import.title')}
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {importProgress.stage === 'readingContacts'
            ? t('import.reading')
            : importProgress.stage === 'normalizing'
            ? t('import.normalizing')
            : importProgress.stage === 'persisting'
            ? t('import.persisting')
            : t('import.completed')}
        </Text>
        <MetricRow
          label={t('import.imported')}
          value={importProgress.imported}
        />
        <MetricRow
          label={t('import.deduplicated')}
          value={importProgress.deduplicated}
        />
        <MetricRow label={t('import.hidden')} value={importProgress.hidden} />
        <MetricRow label={t('import.ready')} value={importProgress.ready} />
      </GlassCard>
    </Screen>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: 28,
  },
  center: {
    alignItems: 'center',
  },
  metrics: {
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
