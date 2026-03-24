import React from 'react';
import { ShieldCheck, CloudOff, LockKeyhole } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'PermissionIntro'>;

export function PermissionIntroScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const cards = [
    {
      key: 'local',
      label: t('permissionIntro.cards.local'),
      icon: ShieldCheck,
    },
    {
      key: 'cloud',
      label: t('permissionIntro.cards.cloud'),
      icon: CloudOff,
    },
    {
      key: 'control',
      label: t('permissionIntro.cards.control'),
      icon: LockKeyhole,
    },
  ];

  return (
    <Screen scroll>
      <GlassCard style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('permissionIntro.title')}
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {t('permissionIntro.body')}
        </Text>
      </GlassCard>

      <View style={styles.cards}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.key} style={styles.card}>
              <Icon color={theme.accent} size={22} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {card.label}
              </Text>
            </GlassCard>
          );
        })}
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={t('permissionIntro.primary')}
          onPress={() => navigation.navigate(ROUTES.ContactsPermission)}
        />
        <PrimaryButton
          label={t('permissionIntro.secondary')}
          onPress={() =>
            navigation.navigate(ROUTES.ImportNormalize, {
              usePreview: true,
            })
          }
          variant="secondary"
        />
      </View>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        Bonda never uploads your contacts. Everything stays local to your
        device.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 14,
    paddingVertical: 28,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    letterSpacing: -1,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamilies.semibold,
  },
  actions: {
    gap: 12,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
  },
});
