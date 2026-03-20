import React from 'react';
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

  async function continueToDeck() {
    if (selectedMode === 'resume' && session) {
      navigation.navigate(ROUTES.EvaluationDeck);
      return;
    }

    await startSession();
    navigation.navigate(ROUTES.EvaluationDeck);
  }

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text }]}>
        Choose your rhythm
      </Text>
      <Text style={[styles.body, { color: theme.textMuted }]}>
        Bonda can move quickly, go deeper, or let you pick through your circle
        by cluster.
      </Text>

      <View style={styles.grid}>
        {EVALUATION_MODES.map(mode => {
          const selected = selectedMode === mode.id;
          const disabled = mode.id === 'resume' && !session;

          return (
            <GlassCard
              key={mode.id}
              style={[
                styles.card,
                {
                  borderColor: selected ? theme.accent : theme.border,
                  opacity: disabled ? 0.45 : 1,
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
                disabled={disabled}
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
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
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
