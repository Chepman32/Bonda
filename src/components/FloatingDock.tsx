import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Binoculars, RotateCcw, SkipForward } from 'lucide-react-native';

import { GlassCard } from '@/components/GlassCard';
import { useAppTheme } from '@/theme';

interface FloatingDockProps {
  onUndo: () => void;
  onSkip: () => void;
  onViewAll: () => void;
}

export function FloatingDock(props: FloatingDockProps) {
  const theme = useAppTheme();

  const actions = [
    { label: 'Undo', icon: RotateCcw, onPress: props.onUndo, disabled: false },
    {
      label: 'Skip',
      icon: SkipForward,
      onPress: props.onSkip,
      disabled: false,
    },
    {
      label: 'View All',
      icon: Binoculars,
      onPress: props.onViewAll,
      disabled: false,
    },
  ];

  return (
    <GlassCard style={styles.container}>
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            disabled={action.disabled}
            key={action.label}
            onPress={action.onPress}
            style={[styles.button, action.disabled && styles.buttonDisabled]}
          >
            <Icon
              color={action.disabled ? theme.textMuted : theme.text}
              size={18}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.label,
                { color: action.disabled ? theme.textMuted : theme.textMuted },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
