import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

import type { BubbleNode } from '@/models/entities';
import { useAppTheme } from '@/theme';

interface BubbleMapProps {
  nodes: BubbleNode[];
  onSelect?: (contactId: string) => void;
}

export function BubbleMap({ nodes, onSelect }: BubbleMapProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 40, 360);
  const center = size / 2;
  const availableRadius = center - 14;
  const orbitScale = nodes.reduce((currentScale, node) => {
    if (node.orbit <= 0) {
      return currentScale;
    }

    const haloRadius = node.radius + 10;
    const nextScale = (availableRadius - haloRadius) / node.orbit;
    return Math.min(currentScale, nextScale);
  }, 1);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Circle
          color={theme.panelStrong}
          cx={center}
          cy={center}
          r={40}
          opacity={0.55}
        />
        {nodes.map(node => {
          const scaledOrbit = node.orbit * Math.max(orbitScale, 0.2);
          const x = center + Math.cos(node.angle) * scaledOrbit;
          const y = center + Math.sin(node.angle) * scaledOrbit;

          return (
            <Group key={node.id}>
              <Circle
                color={node.color}
                cx={x}
                cy={y}
                opacity={0.22 + node.glow * 0.38}
                r={node.radius + 10}
              />
              <Circle
                color={node.color}
                cx={x}
                cy={y}
                opacity={0.86}
                r={node.radius}
              />
            </Group>
          );
        })}
      </Canvas>
      {nodes.map(node => {
        const scaledOrbit = node.orbit * Math.max(orbitScale, 0.2);
        const hotspotSize = Math.max(node.radius * 2, 44);
        const x = center + Math.cos(node.angle) * scaledOrbit - hotspotSize / 2;
        const y = center + Math.sin(node.angle) * scaledOrbit - hotspotSize / 2;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={node.label}
            key={node.id}
            onPress={() => onSelect?.(node.id)}
            style={[
              styles.hotspot,
              {
                left: x,
                top: y,
                width: hotspotSize,
                height: hotspotSize,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    aspectRatio: 1,
    width: '100%',
    maxWidth: 360,
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  hotspot: {
    position: 'absolute',
    borderRadius: 999,
  },
});
