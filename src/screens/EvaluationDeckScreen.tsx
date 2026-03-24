import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  CheckCircle,
  Heart,
  RotateCcw,
  Star,
  X,
  Zap,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { useHotReloadContactAvatars } from '@/hooks/useHotReloadContactAvatars';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EvaluationDeck'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;
const STAMP_OPACITY_DISTANCE = 80;

const PORTRAIT_GRADIENTS = [
  ['#7C3AED', '#312E81'],
  ['#2563EB', '#0F172A'],
  ['#0F766E', '#164E63'],
  ['#BE185D', '#4C1D95'],
  ['#9A3412', '#1F2937'],
  ['#047857', '#1E3A8A'],
] as const;

function paletteForSeed(seed: string): readonly [string, string] {
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PORTRAIT_GRADIENTS[index % PORTRAIT_GRADIENTS.length];
}

function normalizeAvatarUri(uri: string): string {
  if (/^(file|content|https?|ph|assets-library|data):\/\//.test(uri)) {
    return uri;
  }
  return `file://${uri}`;
}

export function EvaluationDeckScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const session = useAppStore(state => state.session);
  const selectedContactId = useAppStore(state => state.selectedContactId);
  const commitGestureEvaluation = useAppStore(
    state => state.commitGestureEvaluation,
  );
  const skipCurrentContact = useAppStore(state => state.skipCurrentContact);
  const undoLastEvaluation = useAppStore(state => state.undoLastEvaluation);
  const saveContactDetail = useAppStore(state => state.saveContactDetail);
  const completeSession = useAppStore(state => state.completeSession);

  useHotReloadContactAvatars();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentContact = contacts.find(
    contact => contact.id === selectedContactId,
  );
  const processedCount = Object.keys(evaluations).length;

  useEffect(() => {
    if (
      !session ||
      session.status === 'completed' ||
      processedCount === 0 ||
      processedCount < contacts.length
    ) {
      return;
    }
    void completeSession().then(() => {
      navigation.replace(ROUTES.Summary);
    });
  }, [completeSession, contacts.length, navigation, processedCount, session]);

  // Reset card position when contact changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id]);

  const commitLike = useCallback(() => {
    void commitGestureEvaluation({
      translationX: 200,
      translationY: -50,
      velocityX: 1000,
      velocityY: 0,
    });
  }, [commitGestureEvaluation]);

  const commitNope = useCallback(() => {
    void skipCurrentContact();
  }, [skipCurrentContact]);

  const commitStar = useCallback(() => {
    if (!currentContact) return;
    void commitGestureEvaluation({
      translationX: 200,
      translationY: -50,
      velocityX: 1000,
      velocityY: 0,
    }).then(() => {
      void saveContactDetail({
        contactId: currentContact.id,
        pinnedToCore: true,
      });
    });
  }, [commitGestureEvaluation, currentContact, saveContactDetail]);

  const animateOffRight = useCallback(
    (onDone: () => void) => {
      translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 300 }, () =>
        runOnJS(onDone)(),
      );
    },
    [translateX],
  );

  const animateOffLeft = useCallback(
    (onDone: () => void) => {
      translateX.value = withTiming(
        -(SCREEN_WIDTH + 100),
        { duration: 300 },
        () => runOnJS(onDone)(),
      );
    },
    [translateX],
  );

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(event => {
      const shouldDismissRight =
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD;
      const shouldDismissLeft =
        event.translationX < -SWIPE_THRESHOLD ||
        event.velocityX < -VELOCITY_THRESHOLD;

      if (shouldDismissRight) {
        translateX.value = withTiming(
          SCREEN_WIDTH + 100,
          { duration: 300 },
          () => runOnJS(commitLike)(),
        );
      } else if (shouldDismissLeft) {
        translateX.value = withTiming(
          -(SCREEN_WIDTH + 100),
          { duration: 300 },
          () => runOnJS(commitNope)(),
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 15}deg` },
    ],
  }));

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: clamp(translateX.value / STAMP_OPACITY_DISTANCE, 0, 1),
  }));

  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: clamp(-translateX.value / STAMP_OPACITY_DISTANCE, 0, 1),
  }));

  if (!currentContact) {
    return (
      <Screen contentStyle={styles.empty}>
        <GlassCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Your deck is ready for summary.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => navigation.replace(ROUTES.Summary)}
            style={styles.emptyAction}
          >
            Go to summary
          </Text>
        </GlassCard>
      </Screen>
    );
  }

  const avatarUri = currentContact.avatarUri
    ? normalizeAvatarUri(currentContact.avatarUri)
    : undefined;
  const gradientColors = paletteForSeed(currentContact.avatarSeed);

  const totalBars = Math.min(contacts.length, 20);
  const filledBars = Math.min(processedCount, totalBars);

  const tags: string[] = [];
  if (currentContact.company) tags.push(currentContact.company);
  if (currentContact.jobTitle) tags.push(currentContact.jobTitle);

  return (
    <View style={styles.container}>
      {/* Progress bars */}
      <View style={styles.progressBars}>
        {Array.from({ length: totalBars }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  i < filledBars
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.3)',
              },
            ]}
          />
        ))}
      </View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Full-screen avatar background */}
          {avatarUri ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: avatarUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[...gradientColors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* LIKE stamp */}
          <Animated.View style={[styles.likeStamp, likeStampStyle]}>
            <Text style={styles.likeStampText}>LIKE</Text>
          </Animated.View>

          {/* NOPE stamp */}
          <Animated.View style={[styles.nopeStamp, nopeStampStyle]}>
            <Text style={styles.nopeStampText}>NOPE</Text>
          </Animated.View>

          {/* Bottom gradient overlay + info */}
          <View style={styles.bottomOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Name row */}
            <View style={styles.nameRow}>
              <Text style={styles.contactName}>
                {currentContact.displayName}
              </Text>
              {avatarUri ? (
                <CheckCircle
                  size={20}
                  color="#3B82F6"
                  fill="#3B82F6"
                  strokeWidth={0}
                />
              ) : null}
            </View>

            {/* Tag pills */}
            {tags.length > 0 ? (
              <View style={styles.tagRow}>
                {tags.map(tag => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {/* Undo */}
        <ActionButton
          onPress={() => void undoLastEvaluation()}
          color="#F97316"
          size={54}
        >
          <RotateCcw color="#F97316" size={22} />
        </ActionButton>

        {/* Nope */}
        <ActionButton
          onPress={() => animateOffLeft(commitNope)}
          color="#EF4444"
          size={62}
        >
          <X color="#EF4444" size={28} />
        </ActionButton>

        {/* Star */}
        <ActionButton
          onPress={() => animateOffRight(commitStar)}
          color="#3B82F6"
          size={54}
        >
          <Star color="#3B82F6" size={22} />
        </ActionButton>

        {/* Like */}
        <ActionButton
          onPress={() => animateOffRight(commitLike)}
          color="#22C55E"
          size={62}
        >
          <Heart color="#22C55E" size={28} />
        </ActionButton>

        {/* Bolt / Deep dive */}
        <ActionButton
          onPress={() =>
            navigation.navigate(ROUTES.ContactDetail, {
              contactId: currentContact.id,
            })
          }
          color="#A855F7"
          size={54}
        >
          <Zap color="#A855F7" size={22} />
        </ActionButton>
      </View>
    </View>
  );
}

function ActionButton({
  onPress,
  color,
  size,
  children,
}: {
  onPress: () => void;
  color: string;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressBars: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    overflow: 'hidden',
    borderRadius: 0,
  },
  likeStamp: {
    position: 'absolute',
    top: 80,
    left: 24,
    borderWidth: 4,
    borderColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-15deg' }],
  },
  likeStampText: {
    color: '#22C55E',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  nopeStamp: {
    position: 'absolute',
    top: 80,
    right: 24,
    borderWidth: 4,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '15deg' }],
  },
  nopeStampText: {
    color: '#EF4444',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  actionRow: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  empty: {
    justifyContent: 'center',
  },
  emptyCard: {
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyAction: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
