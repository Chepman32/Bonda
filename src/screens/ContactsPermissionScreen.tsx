import React, { useEffect } from 'react';
import { Settings2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { openDeviceSettings } from '@/services/device/permissionsService';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactsPermission'>;

export function ContactsPermissionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const permissionState = useAppStore(state => state.permissionState);
  const requestPermission = useAppStore(state => state.requestPermission);

  useEffect(() => {
    if (permissionState === 'granted') {
      navigation.replace(ROUTES.ImportNormalize);
    }
  }, [navigation, permissionState]);

  return (
    <Screen scroll>
      <GlassCard style={styles.card}>
        <Settings2 color={theme.accent} size={28} />
        <Text style={[styles.title, { color: theme.text }]}>
          {t('permission.title')}
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {t('permission.body')}
        </Text>
      </GlassCard>

      <View style={styles.actions}>
        <PrimaryButton
          label={t('permission.request')}
          onPress={() => void requestPermission()}
        />
        <PrimaryButton
          label={t('permission.explain')}
          onPress={() => navigation.navigate(ROUTES.PrivacyInfo)}
          variant="secondary"
        />
      </View>

      {permissionState === 'denied' || permissionState === 'restricted' ? (
        <GlassCard>
          <Text style={[styles.deniedTitle, { color: theme.text }]}>
            {t(`permission.${permissionState}`)}
          </Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            {t('permission.troubleshooting')}
          </Text>
          <View style={styles.actions}>
            <PrimaryButton
              label="Open Settings"
              onPress={() => void openDeviceSettings()}
            />
            <PrimaryButton
              label={t('common.usePreview')}
              onPress={() =>
                navigation.replace(ROUTES.ImportNormalize, {
                  usePreview: true,
                })
              }
              variant="secondary"
            />
          </View>
        </GlassCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    paddingVertical: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    marginTop: 12,
  },
});
