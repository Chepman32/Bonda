import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { EVALUATION_MODES } from '@/constants/app';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelection'>;

export function ModeSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const selectedMode = useAppStore(state => state.selectedMode);
  const setSelectedMode = useAppStore(state => state.setSelectedMode);
  const startSession = useAppStore(state => state.startSession);
  const session = useAppStore(state => state.session);
  const hasUnfinishedSession =
    session?.status === 'active' || session?.status === 'paused';
  const availableModes = useMemo(
    () =>
      hasUnfinishedSession
        ? EVALUATION_MODES
        : EVALUATION_MODES.filter(mode => mode.id !== 'resume'),
    [hasUnfinishedSession],
  );

  useEffect(() => {
    if (!hasUnfinishedSession && selectedMode === 'resume') {
      setSelectedMode('quick');
    }
  }, [hasUnfinishedSession, selectedMode, setSelectedMode]);

  async function continueToDeck() {
    if (selectedMode === 'resume') {
      if (hasUnfinishedSession) {
        navigation.navigate(ROUTES.EvaluationDeck);
        return;
      }

      setSelectedMode('quick');
    }

    await startSession();
    navigation.navigate(ROUTES.EvaluationDeck);
  }

  return (
    <Screen scroll>
      <View style={styles.grid}>
        {availableModes.map(mode => {
          const selected = selectedMode === mode.id;

          return (
            <GlassCard
              key={mode.id}
              style={[
                styles.card,
                {
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {t(mode.titleKey)}
              </Text>
              <Text style={[styles.cardBody, { color: theme.textMuted }]}>
                {t(mode.bodyKey)}
              </Text>
              <PrimaryButton
                label={selected ? 'Selected' : 'Select'}
                onPress={() => setSelectedMode(mode.id)}
                variant={selected ? 'primary' : 'secondary'}
              />
            </GlassCard>
          );
        })}
      </View>

      <PrimaryButton
        label={t('common.continue')}
        onPress={() => void continueToDeck()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 14,
  },
  card: {
    gap: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
