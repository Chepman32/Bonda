import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

import type { BubbleNode } from '@/models/entities';
import { useAppTheme } from '@/theme';

interface BubbleMapProps {
  nodes: BubbleNode[];
  onSelect?: (contactId: string) => void;
}

export function BubbleMap({ nodes, onSelect }: BubbleMapProps) {
  const theme = useAppTheme();
  const size = 320;
  const center = size / 2;

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
          const x = center + Math.cos(node.angle) * node.orbit;
          const y = center + Math.sin(node.angle) * node.orbit;

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
        const x = center + Math.cos(node.angle) * node.orbit - node.radius;
        const y = center + Math.sin(node.angle) * node.orbit - node.radius;

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
                width: node.radius * 2,
                height: node.radius * 2,
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
    width: 320,
    height: 320,
    alignSelf: 'center',
  },
  canvas: {
    width: 320,
    height: 320,
  },
  hotspot: {
    position: 'absolute',
    borderRadius: 999,
  },
});
