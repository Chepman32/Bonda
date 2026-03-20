import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BriefcaseBusiness,
  CircleDot,
  Compass,
  GraduationCap,
  HeartHandshake,
  LifeBuoy,
  MoonStar,
  Orbit,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { GlassCard } from '@/components/GlassCard';
import { CONTACT_TAGS } from '@/constants/app';
import type { ContactTag } from '@/models/entities';
import { useAppTheme } from '@/theme';

const tagIcons = {
  HeartHandshake,
  Sparkles,
  Users,
  BriefcaseBusiness,
  Palette,
  ShieldCheck,
  MoonStar,
  Orbit,
  LifeBuoy,
  Compass,
  GraduationCap,
  CircleDot,
};

interface TagRingProps {
  visible: boolean;
  onPick: (tag: ContactTag) => void;
}

export function TagRing({ visible, onPick }: TagRingProps) {
  const theme = useAppTheme();
  if (!visible) {
    return null;
  }

  return (
    <GlassCard style={styles.container}>
      <View style={styles.grid}>
        {CONTACT_TAGS.map(tag => {
          const Icon = tagIcons[tag.icon as keyof typeof tagIcons];

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tag.value}
              key={tag.value}
              onPress={() => onPick(tag.value)}
              style={[
                styles.chip,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.panelStrong,
                },
              ]}
            >
              <Icon color={theme.text} size={16} />
              <Text style={[styles.text, { color: theme.text }]}>
                {tag.value.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
