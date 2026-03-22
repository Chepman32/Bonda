import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ContactAvatar } from '@/components/ContactAvatar';
import { EvaluationDotMatrix } from '@/components/EvaluationDotMatrix';
import { FloatingDock } from '@/components/FloatingDock';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { deriveColumnSelectionsFromScores } from '@/services/scoringService';
import { fireThresholdHaptic } from '@/services/device/hapticsService';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EvaluationDeck'>;

export function EvaluationDeckScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const session = useAppStore(state => state.session);
  const selectedContactId = useAppStore(state => state.selectedContactId);
  const settings = useAppStore(state => state.settings);
  const commitMatrixEvaluation = useAppStore(
    state => state.commitMatrixEvaluation,
  );
  const skipCurrentContact = useAppStore(state => state.skipCurrentContact);
  const undoLastEvaluation = useAppStore(state => state.undoLastEvaluation);
  const completeSession = useAppStore(state => state.completeSession);
  const [pendingSelections, setPendingSelections] = useState<
    Record<number, number>
  >({});
  const [isMatrixAdvancing, setIsMatrixAdvancing] = useState(false);
  const [advanceAnimationToken, setAdvanceAnimationToken] = useState(0);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentContact = contacts.find(
    contact => contact.id === selectedContactId,
  );
  const currentEvaluation = Object.values(evaluations).find(
    item => item.contactId === currentContact?.id,
  );
  const processedCount = Object.keys(evaluations).length;

  useEffect(() => {
    if (!session || processedCount === 0 || processedCount < contacts.length) {
      return;
    }

    void completeSession().then(() => {
      navigation.replace(ROUTES.Summary);
    });
  }, [completeSession, contacts.length, navigation, processedCount, session]);

  useEffect(() => {
    if (currentEvaluation?.scores) {
      setPendingSelections(
        deriveColumnSelectionsFromScores(currentEvaluation.scores, 9),
      );
    } else {
      setPendingSelections({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id]);

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    },
    [],
  );

  const startAdvanceTransition = useCallback(
    (nextSelections: Record<number, number>) => {
      if (isMatrixAdvancing) {
        return;
      }

      setIsMatrixAdvancing(true);
      setAdvanceAnimationToken(token => token + 1);

      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }

      advanceTimeoutRef.current = setTimeout(() => {
        void commitMatrixEvaluation({
          columnCount: 5,
          rowCount: 9,
          selections: nextSelections,
        });
        setPendingSelections({});
        setIsMatrixAdvancing(false);
        advanceTimeoutRef.current = null;
      }, 430);
    },
    [commitMatrixEvaluation, isMatrixAdvancing],
  );

  const handleColumnPanUpdate = useCallback(
    (colIndex: number, rowIndex: number) => {
      if (isMatrixAdvancing) {
        return;
      }

      setPendingSelections(prev => {
        if (prev[colIndex] === rowIndex) return prev;
        fireThresholdHaptic(settings);
        return { ...prev, [colIndex]: rowIndex };
      });
    },
    [isMatrixAdvancing, settings],
  );

  const handleColumnPanEnd = useCallback(() => {
    if (isMatrixAdvancing) {
      return;
    }

    setPendingSelections(prev => {
      if (Object.keys(prev).length === 5) {
        startAdvanceTransition(prev);
      }
      return prev;
    });
  }, [isMatrixAdvancing, startAdvanceTransition]);

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
      <GlassCard style={styles.activeCard}>
        <View style={styles.cardHeader}>
          <ContactAvatar contact={currentContact} size={44} />
          <View style={styles.cardHeaderCopy}>
            <Text style={[styles.contactName, { color: theme.text }]}>
              {currentContact.displayName}
            </Text>
          </View>
        </View>
        <EvaluationDotMatrix
          selections={pendingSelections}
          interactionDisabled={isMatrixAdvancing}
          advanceAnimationToken={advanceAnimationToken}
          onColumnSelect={(colIndex, rowIndex) => {
            if (isMatrixAdvancing) {
              return;
            }

            if (pendingSelections[colIndex] === rowIndex) {
              const next = { ...pendingSelections };
              delete next[colIndex];
              setPendingSelections(next);
              return;
            }
            const next = { ...pendingSelections, [colIndex]: rowIndex };
            setPendingSelections(next);
            if (Object.keys(next).length === 5) {
              startAdvanceTransition(next);
            }
          }}
          onColumnPanUpdate={handleColumnPanUpdate}
          onColumnPanEnd={handleColumnPanEnd}
        />
      </GlassCard>
      <FloatingDock
        onUndo={() => void undoLastEvaluation()}
        onSkip={() => void skipCurrentContact()}
        onViewAll={() => navigation.navigate(ROUTES.ContactGrid)}
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
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  activeCard: {
    flex: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  contactMeta: {
    fontSize: 12,
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
    alignItems: 'center',
  },
  instruction: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  quickAction: {
    fontSize: 14,
    fontWeight: '700',
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
