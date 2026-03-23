import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useAppTheme } from '@/theme';

export function AtmosphereBackdrop() {
  const theme = useAppTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={theme.backdrop}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: theme.accent,
            top: -48,
            right: -72,
            opacity: 0.28,
            width: 220,
            height: 220,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: theme.accentMuted,
            bottom: 84,
            left: -60,
            opacity: 0.18,
            width: 180,
            height: 180,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: theme.glow,
            top: '38%',
            right: 32,
            opacity: 0.4,
            width: 120,
            height: 120,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
});
