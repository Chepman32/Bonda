import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { ThemeMode } from '@/models/entities';
import type { RootStackParamList } from '@/navigation/types';
import { themes, useAppTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  swatch: string;
  textColor: string;
}> = [
  {
    mode: 'system',
    label: 'Auto',
    swatch: 'transparent',
    textColor: '#FFFFFF',
  },
  {
    mode: 'light',
    label: 'Light',
    swatch: themes.light.background,
    textColor: themes.light.text,
  },
  {
    mode: 'dark',
    label: 'Dark',
    swatch: themes.dark.background,
    textColor: themes.dark.text,
  },
  {
    mode: 'solar',
    label: 'Solar',
    swatch: themes.solar.background,
    textColor: themes.solar.text,
  },
  {
    mode: 'mono',
    label: 'Mono',
    swatch: themes.mono.background,
    textColor: themes.mono.text,
  },
];

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
      <Text style={[styles.title, { color: theme.text }]}>
        Settings and privacy
      </Text>

      <GlassCard style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Appearance
        </Text>
        <View style={styles.themeGrid}>
          {THEME_OPTIONS.map(option => {
            const isSelected = settings.themeMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} theme`}
                onPress={() => void updateSettings({ themeMode: option.mode })}
                style={[
                  styles.themeSwatch,
                  option.mode !== 'system' && {
                    backgroundColor: option.swatch,
                  },
                  isSelected
                    ? { borderColor: theme.accent, borderWidth: 2.5 }
                    : { borderColor: theme.border, borderWidth: 1 },
                ]}
              >
                {option.mode === 'system' ? (
                  <>
                    <LinearGradient
                      colors={['#FFFFFF', '#FFFFFF', '#111111', '#111111']}
                      locations={[0, 0.5, 0.5, 1]}
                      start={{ x: 0.305, y: 0 }}
                      end={{ x: 0.695, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* Black text on white half */}
                    <MaskedView
                      style={StyleSheet.absoluteFill}
                      maskElement={
                        <LinearGradient
                          colors={[
                            'black',
                            'black',
                            'transparent',
                            'transparent',
                          ]}
                          locations={[0, 0.5, 0.5, 1]}
                          start={{ x: 0.305, y: 0 }}
                          end={{ x: 0.695, y: 1 }}
                          style={{ flex: 1 }}
                        />
                      }
                    >
                      <View style={styles.labelMask}>
                        <Text style={[styles.themeLabel, { color: '#111111' }]}>
                          {option.label}
                        </Text>
                      </View>
                    </MaskedView>
                    {/* White text on black half */}
                    <MaskedView
                      style={StyleSheet.absoluteFill}
                      maskElement={
                        <LinearGradient
                          colors={[
                            'transparent',
                            'transparent',
                            'black',
                            'black',
                          ]}
                          locations={[0, 0.5, 0.5, 1]}
                          start={{ x: 0.305, y: 0 }}
                          end={{ x: 0.695, y: 1 }}
                          style={{ flex: 1 }}
                        />
                      }
                    >
                      <View style={styles.labelMask}>
                        <Text style={[styles.themeLabel, { color: '#FFFFFF' }]}>
                          {option.label}
                        </Text>
                      </View>
                    </MaskedView>
                  </>
                ) : (
                  <Text
                    style={[styles.themeLabel, { color: option.textColor }]}
                  >
                    {option.label}
                  </Text>
                )}
                {isSelected && (
                  <View
                    style={[
                      styles.themeCheck,
                      { backgroundColor: theme.accent },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeSwatch: {
    flexBasis: '47%',
    flexGrow: 1,
    aspectRatio: 1.6,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  labelMask: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  themeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  actions: {
    gap: 12,
  },
});
