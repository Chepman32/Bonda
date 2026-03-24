import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import type { NormalizedContact } from '@/models/entities';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

interface ContactAvatarProps {
  contact: NormalizedContact;
  size?: number;
  variant?: 'circle' | 'portraitCard';
}

const PORTRAIT_GRADIENTS = [
  ['#7C3AED', '#312E81'],
  ['#2563EB', '#0F172A'],
  ['#0F766E', '#164E63'],
  ['#BE185D', '#4C1D95'],
  ['#9A3412', '#1F2937'],
  ['#047857', '#1E3A8A'],
] as const;

function paletteForSeed(seed: string) {
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PORTRAIT_GRADIENTS[index % PORTRAIT_GRADIENTS.length];
}

function normalizeAvatarUri(uri: string): string {
  if (/^(file|content|https?|ph|assets-library|data):\/\//.test(uri)) {
    return uri;
  }

  return `file://${uri}`;
}

export function ContactAvatar({
  contact,
  size = 72,
  variant = 'circle',
}: ContactAvatarProps) {
  const theme = useAppTheme();
  const width = size;
  const height = variant === 'portraitCard' ? Math.round(size * 1.34) : size;
  const borderRadius = variant === 'portraitCard' ? 22 : 999;
  const initialsFontSize =
    variant === 'portraitCard'
      ? Math.round(size * 0.4)
      : Math.round(size * 0.43);
  const gradientColors = paletteForSeed(contact.avatarSeed);
  const avatarUri = contact.avatarUri
    ? normalizeAvatarUri(contact.avatarUri)
    : undefined;

  if (avatarUri && variant === 'portraitCard') {
    return (
      <View
        style={[
          styles.imageFrame,
          {
            width,
            height,
            borderRadius,
            borderColor: theme.border,
          },
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: avatarUri }}
          style={[styles.mediaFill, { borderRadius }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (avatarUri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: avatarUri }}
        style={[
          styles.image,
          {
            width,
            height,
            borderRadius,
            borderColor: theme.border,
          },
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={
        variant === 'portraitCard'
          ? [...gradientColors]
          : [theme.panelStrong, theme.panelStrong]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.fallback,
        {
          width,
          height,
          borderRadius,
          borderColor: theme.border,
        },
      ]}
    >
      {variant === 'portraitCard' ? (
        <>
          <View style={styles.portraitGlow} />
          <View style={styles.portraitShade} />
        </>
      ) : null}
      <Text
        style={[
          styles.initials,
          {
            color: '#F8FAFC',
            fontSize: initialsFontSize,
          },
        ]}
      >
        {contact.initials}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 999,
    borderWidth: 1,
  },
  imageFrame: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  fallback: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    letterSpacing: -1,
  },
  portraitGlow: {
    position: 'absolute',
    top: -10,
    left: -12,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  portraitShade: {
    position: 'absolute',
    right: -18,
    bottom: -22,
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  mediaFill: {
    flex: 1,
  },
});
