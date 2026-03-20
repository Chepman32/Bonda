import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { NormalizedContact } from '@/models/entities';
import { useAppTheme } from '@/theme';

interface ContactAvatarProps {
  contact: NormalizedContact;
  size?: number;
}

export function ContactAvatar({ contact, size = 72 }: ContactAvatarProps) {
  const theme = useAppTheme();

  if (contact.avatarUri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: contact.avatarUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderColor: theme.border,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderColor: theme.border,
          backgroundColor: theme.panelStrong,
        },
      ]}
    >
      <Text style={[styles.initials, { color: theme.text }]}>
        {contact.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 999,
    borderWidth: 1,
  },
  fallback: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 24,
    fontWeight: '700',
  },
});
