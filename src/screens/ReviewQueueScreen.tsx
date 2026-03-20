import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ContactAvatar } from '@/components/ContactAvatar';
import { DismissButton } from '@/components/DismissButton';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewQueue'>;

export function ReviewQueueScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const reviewQueueIds = useAppStore(state => state.reviewQueueIds);
  const saveContactDetail = useAppStore(state => state.saveContactDetail);
  const queueContacts = useMemo(
    () => contacts.filter(contact => reviewQueueIds.includes(contact.id)),
    [contacts, reviewQueueIds],
  );
  const [activeContactId, setActiveContactId] = useState<string | undefined>(
    queueContacts[0]?.id,
  );
  const activeContact = queueContacts.find(
    contact => contact.id === activeContactId,
  );
  const activeEvaluation = Object.values(evaluations).find(
    evaluation => evaluation.contactId === activeContactId,
  );

  return (
    <Screen scroll>
      <DismissButton onPress={() => navigation.goBack()} />
      <Text style={[styles.title, { color: theme.text }]}>Review queue</Text>
      <FlatList
        data={queueContacts}
        horizontal
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.queueCard}>
            <Text
              onPress={() => setActiveContactId(item.id)}
              style={[styles.queueName, { color: theme.text }]}
            >
              {item.displayName}
            </Text>
          </GlassCard>
        )}
      />

      {activeContact ? (
        <GlassCard style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <ContactAvatar contact={activeContact} size={72} />
            <View style={styles.activeCopy}>
              <Text style={[styles.activeName, { color: theme.text }]}>
                {activeContact.displayName}
              </Text>
              <Text style={[styles.activeMeta, { color: theme.textMuted }]}>
                Confidence{' '}
                {Math.round((activeEvaluation?.confidence ?? 0.5) * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.binRow}>
            {(['later', 'unsure', 'done'] as const).map(bin => (
              <PrimaryButton
                key={bin}
                label={bin}
                onPress={() =>
                  void saveContactDetail({
                    contactId: activeContact.id,
                    reviewBin: bin,
                    revisit: bin !== 'done',
                  })
                }
                variant={
                  activeEvaluation?.reviewBin === bin ? 'primary' : 'secondary'
                }
              />
            ))}
          </View>
          <PrimaryButton
            label="Return to deck"
            onPress={() => navigation.goBack()}
          />
        </GlassCard>
      ) : (
        <GlassCard>
          <Text style={[styles.activeMeta, { color: theme.textMuted }]}>
            No low-confidence or skipped contacts are waiting right now.
          </Text>
        </GlassCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  queueCard: {
    width: 140,
    marginRight: 12,
    justifyContent: 'center',
  },
  queueName: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeCard: {
    gap: 18,
  },
  activeHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  activeCopy: {
    flex: 1,
    gap: 6,
  },
  activeName: {
    fontSize: 24,
    fontWeight: '700',
  },
  activeMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  binRow: {
    gap: 10,
  },
});
