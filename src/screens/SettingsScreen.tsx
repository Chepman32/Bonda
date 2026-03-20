import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DismissButton } from '@/components/DismissButton';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const settings = useAppStore(state => state.settings);
  const diagnostics = useAppStore(state => state.diagnostics);
  const updateSettings = useAppStore(state => state.updateSettings);
  const refreshDiagnostics = useAppStore(state => state.refreshDiagnostics);
  const shareDiagnostics = useAppStore(state => state.shareDiagnostics);
  const resetAllLocalData = useAppStore(state => state.resetAllLocalData);

  React.useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics]);

  return (
    <Screen scroll>
      <DismissButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: theme.text }]}>
        Settings and privacy
      </Text>
      <GlassCard style={styles.card}>
        <ToggleRow
          label="Reduce motion"
          value={settings.reducedMotion}
          onValueChange={value => void updateSettings({ reducedMotion: value })}
        />
        <ToggleRow
          label="Hide names in exports"
          value={settings.exportHideNames}
          onValueChange={value =>
            void updateSettings({ exportHideNames: value })
          }
        />
        <ToggleRow
          label="Diagnostics enabled"
          value={settings.diagnosticsEnabled}
          onValueChange={value =>
            void updateSettings({ diagnosticsEnabled: value })
          }
        />
      </GlassCard>
      <GlassCard style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Local diagnostics
        </Text>
        <Text style={[styles.sectionBody, { color: theme.textMuted }]}>
          {diagnostics.length} recent events stored on-device only.
        </Text>
        <PrimaryButton
          label="Share diagnostics"
          onPress={() => void shareDiagnostics()}
        />
      </GlassCard>
      <View style={styles.actions}>
        <PrimaryButton
          label="Privacy details"
          onPress={() => navigation.navigate(ROUTES.PrivacyInfo)}
          variant="secondary"
        />
        <PrimaryButton
          label="Reset all ratings"
          onPress={() => void resetAllLocalData()}
        />
      </View>
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  card: {
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
