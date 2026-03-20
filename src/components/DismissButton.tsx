import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';

import { useAppTheme } from '@/theme';

interface DismissButtonProps {
  onPress: () => void;
}

export function DismissButton({ onPress }: DismissButtonProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Close screen"
        accessibilityRole="button"
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: theme.panelStrong,
            borderColor: theme.border,
          },
        ]}
      >
        <X color={theme.text} size={18} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
