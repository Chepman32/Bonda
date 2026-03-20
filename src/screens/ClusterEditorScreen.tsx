import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BubbleMap } from '@/components/BubbleMap';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { buildBubbleNodes } from '@/services/insightService';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ClusterEditor'>;

export function ClusterEditorScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const clusters = useAppStore(state => state.clusters);
  const moveContactToCluster = useAppStore(state => state.moveContactToCluster);
  const [selectedContactId, setSelectedContactId] = useState<
    string | undefined
  >(contacts[0]?.id);

  const nodes = useMemo(
    () =>
      buildBubbleNodes(
        contacts,
        Object.values(evaluations),
        clusters,
        'cluster',
      ),
    [clusters, contacts, evaluations],
  );

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.text }]}>Cluster editor</Text>
      <BubbleMap
        nodes={nodes}
        onSelect={contactId => setSelectedContactId(contactId)}
      />
      <GlassCard>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          Selected contact
        </Text>
        <Text style={[styles.selectedName, { color: theme.text }]}>
          {contacts.find(contact => contact.id === selectedContactId)
            ?.displayName ?? 'Choose a bubble'}
        </Text>
      </GlassCard>
      <View style={styles.clusterList}>
        {clusters.map(cluster => (
          <GlassCard key={cluster.id} style={styles.clusterCard}>
            <View style={styles.clusterHeader}>
              <View
                style={[
                  styles.clusterSwatch,
                  {
                    backgroundColor: cluster.color,
                  },
                ]}
              />
              <View style={styles.clusterCopy}>
                <Text style={[styles.clusterName, { color: theme.text }]}>
                  {cluster.name}
                </Text>
                <Text style={[styles.clusterMeta, { color: theme.textMuted }]}>
                  {cluster.contactIds.length} contacts
                </Text>
              </View>
            </View>
            <Text
              onPress={() =>
                selectedContactId
                  ? void moveContactToCluster(selectedContactId, cluster.id)
                  : undefined
              }
              style={[styles.assignButton, { color: theme.accent }]}
            >
              Assign selected
            </Text>
          </GlassCard>
        ))}
      </View>
      <Text
        onPress={() => navigation.navigate(ROUTES.EvaluationDeck)}
        style={[styles.returnLink, { color: theme.textMuted }]}
      >
        Return to evaluation deck
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedName: {
    fontSize: 22,
    fontWeight: '700',
  },
  clusterList: {
    gap: 12,
  },
  clusterCard: {
    gap: 14,
  },
  clusterHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  clusterSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  clusterCopy: {
    flex: 1,
  },
  clusterName: {
    fontSize: 16,
    fontWeight: '700',
  },
  clusterMeta: {
    fontSize: 13,
  },
  assignButton: {
    fontSize: 14,
    fontWeight: '700',
  },
  returnLink: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
