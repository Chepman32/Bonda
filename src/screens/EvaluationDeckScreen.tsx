import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  ChevronLeft,
  Heart,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EvaluationDotMatrix } from '@/components/EvaluationDotMatrix';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { useHotReloadContactAvatars } from '@/hooks/useHotReloadContactAvatars';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import {
  deriveColumnSelectionsFromScores,
  type MatrixCommit,
} from '@/services/scoringService';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EvaluationDeck'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;
const STAMP_OPACITY_DISTANCE = 80;
const MATRIX_COLUMN_COUNT: MatrixCommit['columnCount'] = 5;
const MATRIX_ROW_COUNT: MatrixCommit['rowCount'] = 9;

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

function isMatrixComplete(selections: Record<number, number>): boolean {
  return Object.keys(selections).length >= MATRIX_COLUMN_COUNT;
}

function buildMatrixSelections(
  scores?: Parameters<typeof deriveColumnSelectionsFromScores>[0],
): Record<number, number> {
  return scores
    ? deriveColumnSelectionsFromScores(scores, MATRIX_ROW_COUNT)
    : {};
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
  const commitMatrixEvaluation = useAppStore(
    state => state.commitMatrixEvaluation,
  );
  const skipCurrentContact = useAppStore(state => state.skipCurrentContact);
  const undoLastEvaluation = useAppStore(state => state.undoLastEvaluation);
  const completeSession = useAppStore(state => state.completeSession);

  useHotReloadContactAvatars();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [matrixSelections, setMatrixSelections] = useState<
    Record<number, number>
  >({});
  const [matrixTouched, setMatrixTouched] = useState(false);
  const [matrixLocked, setMatrixLocked] = useState(false);
  const [advanceAnimationToken, setAdvanceAnimationToken] = useState(0);

  const currentContact = contacts.find(
    contact => contact.id === selectedContactId,
  );
  const currentEvaluation = useMemo(() => {
    if (!session || !selectedContactId) {
      return undefined;
    }

    return Object.values(evaluations).find(
      evaluation =>
        evaluation.sessionId === session.id &&
        evaluation.contactId === selectedContactId,
    );
  }, [evaluations, selectedContactId, session]);
  const processedCount = Object.values(evaluations).filter(
    evaluation => evaluation.sessionId === session?.id,
  ).length;
  const isDeepMode = session?.mode === 'deep';
  const isSessionComplete =
    Boolean(session) &&
    contacts.length > 0 &&
    processedCount >= contacts.length;

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

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    setMatrixSelections(buildMatrixSelections(currentEvaluation?.scores));
    setMatrixTouched(false);
    setMatrixLocked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id, currentEvaluation?.updatedAt]);

  useEffect(() => {
    if (
      !isDeepMode ||
      !currentContact ||
      matrixLocked ||
      !matrixTouched ||
      !isMatrixComplete(matrixSelections)
    ) {
      return;
    }

    setMatrixLocked(true);
    setAdvanceAnimationToken(token => token + 1);

    void commitMatrixEvaluation({
      selections: matrixSelections,
      columnCount: MATRIX_COLUMN_COUNT,
      rowCount: MATRIX_ROW_COUNT,
    }).catch(() => {
      setMatrixLocked(false);
      setMatrixTouched(false);
    });
  }, [
    commitMatrixEvaluation,
    currentContact,
    isDeepMode,
    matrixLocked,
    matrixSelections,
    matrixTouched,
  ]);

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

  const handleMatrixSelection = useCallback(
    (colIndex: number, rowIndex: number) => {
      if (matrixLocked) {
        return;
      }

      setMatrixSelections(current => {
        if (current[colIndex] === rowIndex) {
          return current;
        }

        return {
          ...current,
          [colIndex]: rowIndex,
        };
      });
      setMatrixTouched(true);
    },
    [matrixLocked],
  );

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
    const showSummaryAction =
      session?.status === 'completed' || isSessionComplete;

    return (
      <Screen contentStyle={styles.empty}>
        <GlassCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {showSummaryAction
              ? 'Your deck is ready for summary.'
              : 'Preparing your next contact.'}
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            {showSummaryAction
              ? 'Go to summary when you are ready.'
              : 'The deck is still active, so summary stays locked until the session is actually complete.'}
          </Text>
          {showSummaryAction ? (
            <Text
              accessibilityRole="button"
              onPress={() => navigation.replace(ROUTES.Summary)}
              style={styles.emptyAction}
            >
              Go to summary
            </Text>
          ) : null}
        </GlassCard>
      </Screen>
    );
  }

  const avatarUri = currentContact.avatarUri
    ? normalizeAvatarUri(currentContact.avatarUri)
    : undefined;
  const gradientColors = paletteForSeed(currentContact.avatarSeed);
  const totalBars = contacts.length;
  const filledBars = processedCount;

  const tags: string[] = [];
  if (currentContact.company) tags.push(currentContact.company);
  if (currentContact.jobTitle) tags.push(currentContact.jobTitle);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        hitSlop={8}
      >
        <ChevronLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
      </Pressable>

      <View style={styles.progressBars}>
        {Array.from({ length: totalBars }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  index < filledBars
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.3)',
              },
            ]}
          />
        ))}
      </View>

      {isDeepMode ? (
        <View style={styles.card}>
          <ContactBackdrop
            avatarUri={avatarUri}
            gradientColors={gradientColors}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.9)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.deepOverlay}>
            <View style={styles.deepIntro}>
              <Text style={styles.deepEyebrow}>Deep pass</Text>
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
              {tags.length > 0 ? (
                <View style={styles.tagRow}>
                  {tags.map(tag => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={styles.deepHint}>
                Drag or tap through the matrix to score the relationship without
                swiping the card away.
              </Text>
            </View>
            <View style={styles.deepMatrixShell}>
              <EvaluationDotMatrix
                advanceAnimationToken={advanceAnimationToken}
                interactionDisabled={matrixLocked}
                onColumnPanUpdate={handleMatrixSelection}
                onColumnSelect={handleMatrixSelection}
                selections={matrixSelections}
              />
            </View>
          </View>
        </View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            <ContactBackdrop
              avatarUri={avatarUri}
              gradientColors={gradientColors}
            />
            <Animated.View style={[styles.likeStamp, likeStampStyle]}>
              <Text style={styles.likeStampText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.nopeStamp, nopeStampStyle]}>
              <Text style={styles.nopeStampText}>NOPE</Text>
            </Animated.View>
            <View style={styles.bottomOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
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
      )}

      <View style={styles.actionRow}>
        {processedCount > 0 ? (
          <ActionButton
            color="#F97316"
            label="Undo"
            onPress={() => void undoLastEvaluation()}
            size={54}
          >
            <RotateCcw color="#F97316" size={22} />
          </ActionButton>
        ) : null}

        <ActionButton
          color="#EF4444"
          label="Skip"
          onPress={() =>
            isDeepMode ? commitNope() : animateOffLeft(commitNope)
          }
          size={62}
        >
          <X color="#EF4444" size={28} />
        </ActionButton>

        {!isDeepMode ? (
          <ActionButton
            color="#22C55E"
            label="Like"
            onPress={() => animateOffRight(commitLike)}
            size={62}
          >
            <Heart color="#22C55E" size={28} />
          </ActionButton>
        ) : null}

        <ActionButton
          color="#A855F7"
          label="Detail"
          onPress={() =>
            navigation.navigate(ROUTES.ContactDetail, {
              contactId: currentContact.id,
            })
          }
          size={54}
        >
          <Zap color="#A855F7" size={22} />
        </ActionButton>
      </View>
    </View>
  );
}

function ContactBackdrop({
  avatarUri,
  gradientColors,
}: {
  avatarUri?: string;
  gradientColors: readonly [string, string];
}) {
  if (avatarUri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: avatarUri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={[...gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

function ActionButton({
  label,
  onPress,
  color,
  size,
  children,
}: {
  label: string;
  onPress: () => void;
  color: string;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
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
  backButton: {
    position: 'absolute',
    top: 68,
    left: 8,
    zIndex: 20,
    padding: 4,
  },
  progressBars: {
    position: 'absolute',
    top: 56,
    left: 44,
    right: 12,
    flexDirection: 'row',
    gap: 2,
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
    fontFamily: fontFamilies.heavy,
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
    fontFamily: fontFamilies.heavy,
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
  deepOverlay: {
    flex: 1,
    paddingTop: 96,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 24,
  },
  deepIntro: {
    gap: 12,
  },
  deepEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  deepHint: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  deepMatrixShell: {
    flex: 1,
    minHeight: 340,
    padding: 12,
    borderRadius: 32,
    backgroundColor: 'rgba(3, 8, 19, 0.28)',
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
    fontFamily: fontFamilies.bold,
    letterSpacing: -0.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    fontFamily: fontFamilies.medium,
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
    fontFamily: fontFamilies.bold,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyAction: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    color: '#FFFFFF',
  },
});
