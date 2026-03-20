import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  CirclePause,
  Eye,
  Layers3,
  RotateCcw,
  SkipForward,
} from 'lucide-react-native';

import { GlassCard } from '@/components/GlassCard';
import { useAppTheme } from '@/theme';

interface FloatingDockProps {
  onUndo: () => void;
  onSkip: () => void;
  onDetail: () => void;
  onClusters: () => void;
  onPause: () => void;
}

export function FloatingDock(props: FloatingDockProps) {
  const theme = useAppTheme();

  const actions = [
    { label: 'Undo', icon: RotateCcw, onPress: props.onUndo },
    { label: 'Skip', icon: SkipForward, onPress: props.onSkip },
    { label: 'Detail', icon: Eye, onPress: props.onDetail },
    { label: 'Groups', icon: Layers3, onPress: props.onClusters },
    { label: 'Pause', icon: CirclePause, onPress: props.onPause },
  ];

  return (
    <GlassCard style={styles.container}>
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            key={action.label}
            onPress={action.onPress}
            style={styles.button}
          >
            <Icon color={theme.text} size={18} strokeWidth={2.2} />
            <Text style={[styles.label, { color: theme.textMuted }]}>
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
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
