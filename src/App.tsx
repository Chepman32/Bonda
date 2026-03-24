import React from 'react';
import { StatusBar } from 'react-native';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { BiometricLockGate } from '@/components/BiometricLockGate';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProviders } from '@/providers/AppProviders';
import { useAppTheme } from '@/theme';

function AppStatusBar() {
  const theme = useAppTheme();

  return (
    <StatusBar
      backgroundColor="transparent"
      barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      translucent
    />
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppStatusBar />
        <AppNavigator />
        <BiometricLockGate />
      </AppProviders>
    </AppErrorBoundary>
  );
}
