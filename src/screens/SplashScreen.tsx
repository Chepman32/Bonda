import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const bootState = useAppStore(state => state.bootState);
  const contacts = useAppStore(state => state.contacts);
  const haloScale = useSharedValue(0.8);
  const haloOpacity = useSharedValue(0.2);

  useEffect(() => {
    haloScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.22, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [haloOpacity, haloScale]);

  useEffect(() => {
    if (bootState !== 'ready' && bootState !== 'error') {
      return;
    }

    const timeout = setTimeout(() => {
      if (contacts.length > 0) {
        navigation.replace(ROUTES.Main, { screen: ROUTES.ModeSelection });
      } else {
        navigation.replace(ROUTES.PermissionIntro);
      }
    }, 1800);

    return () => clearTimeout(timeout);
  }, [bootState, contacts.length, navigation]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.halo,
            {
              backgroundColor: theme.accent,
            },
            haloStyle,
          ]}
        />
        <GlassCard style={styles.wordmarkCard}>
          <Text style={[styles.wordmark, { color: theme.text }]}>Bonda</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Quietly mapping the shape of your social world.
          </Text>
        </GlassCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
  },
  wordmarkCard: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  wordmark: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    letterSpacing: -1.6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 240,
  },
});
