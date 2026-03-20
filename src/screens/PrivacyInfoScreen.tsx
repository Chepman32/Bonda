import React from 'react';
import { HardDriveDownload, Lock, Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DismissButton } from '@/components/DismissButton';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useAppTheme } from '@/theme';

const cards = [
  {
    title: 'On-device scoring',
    body: 'Every rating, tag, and insight stays in app-private local storage.',
    icon: Shield,
  },
  {
    title: 'No cloud profile',
    body: 'Bonda does not require an account and does not sync your relationships remotely.',
    icon: Lock,
  },
  {
    title: 'Local exports only',
    body: 'Snapshots are generated on-device and shared only when you choose.',
    icon: HardDriveDownload,
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyInfo'>;

export function PrivacyInfoScreen({ navigation }: Props) {
  const theme = useAppTheme();

  return (
    <Screen scroll>
      <DismissButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: theme.text }]}>
        Privacy at the center
      </Text>
      <Text style={[styles.body, { color: theme.textMuted }]}>
        Bonda is designed as a private reflection tool, not a social graph
        service.
      </Text>
      <View style={styles.cards}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.title} style={styles.card}>
              <Icon color={theme.accent} size={24} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {card.title}
              </Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>
                {card.body}
              </Text>
            </GlassCard>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  cards: {
    gap: 12,
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
