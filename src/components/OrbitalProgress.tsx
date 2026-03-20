import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';

import { normalizeProgress } from '@/utils/math';
import { useAppTheme } from '@/theme';

interface OrbitalProgressProps {
  progress: number;
  size?: number;
}

export function OrbitalProgress({
  progress,
  size = 220,
}: OrbitalProgressProps) {
  const theme = useAppTheme();
  const radius = size / 2;
  const dots = 24;
  const normalized = normalizeProgress(progress, 100);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {Array.from({ length: dots }).map((_, index) => {
          const angle = (Math.PI * 2 * index) / dots;
          const orbit = radius - 18;
          const x = radius + Math.cos(angle) * orbit;
          const y = radius + Math.sin(angle) * orbit;
          const active = index / dots <= normalized;

          return (
            <Circle
              color={active ? theme.accent : theme.border}
              cx={x}
              cy={y}
              key={index}
              opacity={active ? 1 : 0.35}
              r={active ? 5 : 3.5}
            />
          );
        })}
        <Circle
          color={theme.panelStrong}
          cx={radius}
          cy={radius}
          r={radius - 44}
        />
      </Canvas>
    </View>
  );
}
