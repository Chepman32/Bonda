import React from 'react';
import {
  AppState,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AtmosphereBackdrop } from '@/components/AtmosphereBackdrop';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  authenticateBiometricLock,
  getBiometricCapability,
} from '@/services/device/biometricService';
import { getDiagnosticsRepository } from '@/services/repositories/diagnosticsRepository';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

export function BiometricLockGate() {
  const theme = useAppTheme();
  const bootState = useAppStore(state => state.bootState);
  const preferBiometricUnlock = useAppStore(
    state => state.settings.preferBiometricUnlock,
  );
  const updateSettings = useAppStore(state => state.updateSettings);
  const [biometricLabel, setBiometricLabel] = React.useState('Face ID');
  const [isLocked, setIsLocked] = React.useState(true);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const hasHandledBootReadyRef = React.useRef(false);
  const isAuthenticatingRef = React.useRef(false);
  const suppressNextActiveRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    void getBiometricCapability().then(capability => {
      if (!cancelled && capability) {
        setBiometricLabel(capability.label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const unlock = React.useCallback(async () => {
    if (!preferBiometricUnlock || isAuthenticatingRef.current) {
      return;
    }

    isAuthenticatingRef.current = true;
    suppressNextActiveRef.current = false;
    setIsLocked(true);
    setIsAuthenticating(true);
    setErrorMessage(undefined);

    try {
      const hasStoredLock = await authenticateBiometricLock(
        `Unlock Bonda with ${biometricLabel}`,
      );

      if (!hasStoredLock) {
        await updateSettings({ preferBiometricUnlock: false });
        await getDiagnosticsRepository().log(
          'warn',
          'Biometric lock was missing and has been disabled',
        );
        setIsLocked(false);
        return;
      }

      setIsLocked(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Couldn't verify ${biometricLabel}.`;

      setErrorMessage(message);
      setIsLocked(true);
      await getDiagnosticsRepository().log('warn', 'Biometric unlock failed', {
        message,
      });
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, [biometricLabel, preferBiometricUnlock, updateSettings]);

  React.useEffect(() => {
    if (!preferBiometricUnlock) {
      setIsLocked(false);
      setErrorMessage(undefined);
    }
  }, [preferBiometricUnlock]);

  React.useEffect(() => {
    if (bootState !== 'ready' || hasHandledBootReadyRef.current) {
      return;
    }

    hasHandledBootReadyRef.current = true;

    if (!preferBiometricUnlock) {
      setIsLocked(false);
      return;
    }

    setTimeout(() => void unlock(), 0);
  }, [bootState, preferBiometricUnlock, unlock]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (!preferBiometricUnlock || bootState !== 'ready') {
        return;
      }

      if (previousState === nextState) {
        return;
      }

      if (previousState === 'active' && nextState !== 'active') {
        setIsLocked(true);
        setErrorMessage(undefined);

        if (isAuthenticatingRef.current) {
          suppressNextActiveRef.current = true;
        }

        return;
      }

      if (previousState !== 'active' && nextState === 'active') {
        if (suppressNextActiveRef.current) {
          suppressNextActiveRef.current = false;
          return;
        }

        setIsLocked(true);
        setTimeout(() => void unlock(), 0);
      }
    });

    return () => subscription.remove();
  }, [bootState, preferBiometricUnlock, unlock]);

  if (!preferBiometricUnlock || bootState !== 'ready' || !isLocked) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        style={styles.safeArea}
      >
        <AtmosphereBackdrop />
        <View style={styles.content}>
          <GlassCard style={styles.card}>
            <Text style={[styles.title, { color: theme.text }]}>
              Bonda is locked
            </Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              Use {biometricLabel} to open Bonda and unlock your relationship
              map.
            </Text>
            {errorMessage ? (
              <Text style={[styles.error, { color: theme.danger }]}>
                {errorMessage}
              </Text>
            ) : null}
            <PrimaryButton
              disabled={isAuthenticating}
              label={
                isAuthenticating
                  ? `Checking ${biometricLabel}...`
                  : `Unlock with ${biometricLabel}`
              }
              onPress={() => void unlock()}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: fontFamilies.semibold,
  },
});
