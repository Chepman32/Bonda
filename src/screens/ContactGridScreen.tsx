import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';

import { ContactAvatar } from '@/components/ContactAvatar';
import { useHotReloadContactAvatars } from '@/hooks/useHotReloadContactAvatars';
import { Screen } from '@/components/Screen';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';
import type { NormalizedContact } from '@/models/entities';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactGrid'>;

const NUM_COLUMNS = 3;
const AVATAR_SIZE = 124;

export function ContactGridScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const contacts = useAppStore(state => state.contacts);
  const evaluations = useAppStore(state => state.evaluations);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  useHotReloadContactAvatars();

  const evaluatedIds = useMemo(
    () => new Set(Object.values(evaluations).map(e => e.contactId)),
    [evaluations],
  );

  const sortedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [contacts],
  );

  const filteredContacts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return sortedContacts;
    }

    return sortedContacts.filter(contact => {
      const displayName = contact.displayName.toLocaleLowerCase();
      const company = contact.company?.toLocaleLowerCase() ?? '';
      const givenName = contact.givenName.toLocaleLowerCase();
      const familyName = contact.familyName.toLocaleLowerCase();

      return (
        displayName.includes(normalizedQuery) ||
        company.includes(normalizedQuery) ||
        givenName.includes(normalizedQuery) ||
        familyName.includes(normalizedQuery)
      );
    });
  }, [deferredQuery, sortedContacts]);

  const renderItem = ({ item }: { item: NormalizedContact }) => {
    const isEvaluated = evaluatedIds.has(item.id);
    return (
      <Pressable
        style={styles.cell}
        onPress={() =>
          navigation.navigate(ROUTES.ContactDetail, { contactId: item.id })
        }
      >
        <View>
          <ContactAvatar
            contact={item}
            size={AVATAR_SIZE}
            variant="portraitCard"
          />
          {isEvaluated && (
            <View style={[styles.badge, { backgroundColor: '#059669' }]} />
          )}
        </View>
        <Text
          numberOfLines={2}
          style={[
            styles.name,
            { color: isEvaluated ? theme.text : theme.textMuted },
          ]}
        >
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
      <View
        style={[
          styles.searchShell,
          {
            backgroundColor: theme.panelStrong,
            borderColor: theme.border,
          },
        ]}
      >
        <Search color={theme.textMuted} size={18} strokeWidth={2.2} />
        <TextInput
          placeholder="Search contacts"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  grid: {
    gap: 8,
    paddingBottom: 24,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
    maxWidth: `${100 / NUM_COLUMNS}%`,
  },
  badge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#08101E',
  },
  name: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: fontFamilies.semibold,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
