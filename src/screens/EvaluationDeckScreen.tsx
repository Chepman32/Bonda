import React, { useEffect, useState } from 'react';
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
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EvaluationDeck'>;

export function EvaluationDeckScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const session = useAppStore(state => state.session);
  const selectedContactId = useAppStore(state => state.selectedContactId);
  const commitMatrixEvaluation = useAppStore(
    state => state.commitMatrixEvaluation,
  );
  const skipCurrentContact = useAppStore(state => state.skipCurrentContact);
  const undoLastEvaluation = useAppStore(state => state.undoLastEvaluation);
  const completeSession = useAppStore(state => state.completeSession);
  const [pendingSelections, setPendingSelections] = useState<
    Record<number, number>
  >({});

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
        deriveColumnSelectionsFromScores(currentEvaluation.scores, 6),
      );
    } else {
      setPendingSelections({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact?.id]);

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
      <View style={styles.cardArea}>
        <GlassCard style={styles.activeCard}>
          <View style={styles.cardHeader}>
            <ContactAvatar contact={currentContact} size={44} />
            <View style={styles.cardHeaderCopy}>
              <Text style={[styles.contactName, { color: theme.text }]}>
                {currentContact.displayName}
              </Text>
              <Text style={[styles.contactMeta, { color: theme.textMuted }]}>
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
              Confidence {Math.round(currentContact.relationConfidence * 100)}%
            </Text>
          </View>
          <EvaluationDotMatrix
            selections={pendingSelections}
            onColumnSelect={(colIndex, rowIndex) => {
              const next = { ...pendingSelections, [colIndex]: rowIndex };
              setPendingSelections(next);
              if (Object.keys(next).length === 4) {
                void commitMatrixEvaluation({
                  columnCount: 4,
                  rowCount: 6,
                  selections: next,
                });
                setPendingSelections({});
              }
            }}
          />
        </GlassCard>
      </View>
      <FloatingDock
        onUndo={() => void undoLastEvaluation()}
        onSkip={() => void skipCurrentContact()}
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
  activeCard: {
    minHeight: 360,
    justifyContent: 'space-between',
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
