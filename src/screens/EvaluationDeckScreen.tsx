import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ContactAvatar } from '@/components/ContactAvatar';
import { FloatingDock } from '@/components/FloatingDock';
import { GlassCard } from '@/components/GlassCard';
import { ProgressStrip } from '@/components/ProgressStrip';
import { Screen } from '@/components/Screen';
import { TagRing } from '@/components/TagRing';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { computeSummaryMetrics } from '@/services/scoringService';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EvaluationDeck'>;

const THRESHOLD = 84;

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
  const [tagRingVisible, setTagRingVisible] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentContact = contacts.find(
    contact => contact.id === selectedContactId,
  );
  const queuedContacts = contacts.filter(
    contact => contact.id !== currentContact?.id,
  );
  const processedCount = Object.keys(evaluations).length;
  const skippedCount = Object.values(evaluations).filter(
    item => item.skipped,
  ).length;

  useEffect(() => {
    if (!session || processedCount === 0 || processedCount < contacts.length) {
      return;
    }

    void completeSession().then(() => {
      navigation.replace(ROUTES.Summary);
    });
  }, [completeSession, contacts.length, navigation, processedCount, session]);

  const gesture = Gesture.Simultaneous(
    Gesture.Pan()
      .onUpdate(event => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd(event => {
        const shouldCommit =
          Math.abs(event.translationX) > THRESHOLD ||
          Math.abs(event.translationY) > THRESHOLD;

        if (shouldCommit) {
          runOnJS(commitGestureEvaluation)({
            translationX: event.translationX,
            translationY: event.translationY,
            velocityX: event.velocityX,
            velocityY: event.velocityY,
          });
        }

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }),
    Gesture.LongPress()
      .minDuration(320)
      .onStart(() => {
        runOnJS(setTagRingVisible)(true);
      }),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotateZ: `${interpolate(translateX.value, [-180, 180], [-10, 10])}deg`,
      },
    ],
  }));

  const summaryMetrics = useMemo(
    () => computeSummaryMetrics(Object.values(evaluations)),
    [evaluations],
  );

  if (!currentContact) {
    return (
      <Screen contentStyle={styles.empty}>
        <GlassCard style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Your deck is ready for summary.
          </Text>
          <PrimaryDockAction
            label="Go to summary"
            onPress={() => navigation.replace(ROUTES.Summary)}
          />
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.deckScreen}>
      <ProgressStrip
        processed={processedCount}
        skipped={skippedCount}
        streak={Math.max(processedCount - skippedCount, 0)}
      />
      <View style={styles.cardArea}>
        {queuedContacts.slice(0, 2).map((contact, index) => (
          <GlassCard
            key={contact.id}
            style={[
              styles.backCard,
              {
                top: index * 14 + 24,
                transform: [{ scale: 0.96 - index * 0.04 }],
              },
            ]}
          >
            <Text style={[styles.backCardText, { color: theme.textMuted }]}>
              {contact.displayName}
            </Text>
          </GlassCard>
        ))}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[animatedStyle]}>
            <GlassCard style={styles.activeCard}>
              <View style={styles.cardHeader}>
                <ContactAvatar contact={currentContact} size={84} />
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.contactName, { color: theme.text }]}>
                    {currentContact.displayName}
                  </Text>
                  <Text
                    style={[styles.contactMeta, { color: theme.textMuted }]}
                  >
                    {currentContact.company ||
                      currentContact.inferredGroup ||
                      'Personal contact'}
                  </Text>
                </View>
              </View>
              <View style={styles.metrics}>
                <Text style={[styles.metricPill, { color: theme.textMuted }]}>
                  {currentContact.phoneNumbers.length} phone
                </Text>
                <Text style={[styles.metricPill, { color: theme.textMuted }]}>
                  {currentContact.emailAddresses.length} email
                </Text>
                <Text style={[styles.metricPill, { color: theme.textMuted }]}>
                  Confidence{' '}
                  {Math.round(currentContact.relationConfidence * 100)}%
                </Text>
              </View>
              <View style={styles.instructions}>
                <Text style={[styles.instruction, { color: theme.textMuted }]}>
                  Swipe right for stronger importance, left for weaker
                  relevance.
                </Text>
                <Text style={[styles.instruction, { color: theme.textMuted }]}>
                  Drag up for more future attention, down for less.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        </GestureDetector>
        <TagRing
          visible={tagRingVisible}
          onPick={tag => {
            void saveContactDetail({
              contactId: currentContact.id,
              tags: [
                ...new Set([
                  ...(Object.values(evaluations).find(
                    item => item.contactId === currentContact.id,
                  )?.tags ?? []),
                  tag,
                ]),
              ],
            });
            setTagRingVisible(false);
          }}
        />
      </View>
      <GlassCard style={styles.summaryBand}>
        <Text style={[styles.summaryMetric, { color: theme.text }]}>
          Core {Math.round(summaryMetrics.coreScore)}
        </Text>
        <Text style={[styles.summaryMetric, { color: theme.text }]}>
          Warmth {Math.round(summaryMetrics.warmth)}
        </Text>
        <Text style={[styles.summaryMetric, { color: theme.text }]}>
          Neglect {Math.round(summaryMetrics.neglect)}
        </Text>
      </GlassCard>
      <FloatingDock
        onUndo={() => void undoLastEvaluation()}
        onSkip={() => void skipCurrentContact()}
        onDetail={() =>
          navigation.navigate(ROUTES.ContactDetail, {
            contactId: currentContact.id,
          })
        }
        onClusters={() => navigation.navigate(ROUTES.ClusterEditor)}
        onPause={() => navigation.navigate(ROUTES.ReviewQueue)}
      />
    </Screen>
  );
}

function PrimaryDockAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      style={styles.emptyAction}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  deckScreen: {
    paddingBottom: 24,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 420,
  },
  backCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 320,
    justifyContent: 'flex-end',
  },
  backCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeCard: {
    minHeight: 360,
    justifyContent: 'space-between',
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  contactName: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  contactMeta: {
    fontSize: 14,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricPill: {
    fontSize: 12,
    fontWeight: '600',
  },
  instructions: {
    gap: 10,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 22,
  },
  summaryBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetric: {
    fontSize: 13,
    fontWeight: '700',
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
