import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ContactAvatar } from '@/components/ContactAvatar';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';
import type { NormalizedContact } from '@/models/entities';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactGrid'>;

const NUM_COLUMNS = 4;

export function ContactGridScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);

  const evaluatedIds = useMemo(
    () => new Set(Object.values(evaluations).map(e => e.contactId)),
    [evaluations],
  );

  const sortedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [contacts],
  );

  const renderItem = ({ item }: { item: NormalizedContact }) => {
    const isEvaluated = evaluatedIds.has(item.id);
    return (
      <Pressable
        style={[styles.cell, { opacity: isEvaluated ? 1 : 0.45 }]}
        onPress={() =>
          navigation.navigate(ROUTES.ContactDetail, { contactId: item.id })
        }
      >
        <View>
          <ContactAvatar contact={item} size={56} />
          {isEvaluated && (
            <View style={[styles.badge, { backgroundColor: '#059669' }]} />
          )}
        </View>
        <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
          {item.displayName}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View style={styles.dragHandleRow}>
        <View style={styles.dragHandle} />
      </View>
      <FlatList
        data={sortedContacts}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dragHandleRow: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
  },
  grid: {
    paddingBottom: 24,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
    maxWidth: `${100 / NUM_COLUMNS}%`,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#000',
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
