import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/ContactAvatar';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { CONTACT_TAGS, DEFAULT_SCORES } from '@/constants/app';
import type { ContactTag } from '@/models/entities';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { fontFamilies } from '@/theme/fonts';
import { useAppTheme } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactDetail'>;

export function ContactDetailScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const dismissOffset = useSharedValue(0);
  const sessionId = useAppStore(state => state.session?.id);
  const contact = useAppStore(state =>
    state.contacts.find(item => item.id === route.params.contactId),
  );
  const evaluation = useAppStore(state =>
    Object.values(state.evaluations).find(
      item =>
        item.sessionId === sessionId &&
        item.contactId === route.params.contactId,
    ),
  );
  const saveContactDetail = useAppStore(state => state.saveContactDetail);

  const [scores, setScores] = useState(evaluation?.scores ?? DEFAULT_SCORES);
  const [note, setNote] = useState(evaluation?.note ?? '');
  const [tags, setTags] = useState<ContactTag[]>(evaluation?.tags ?? []);
  const [pinnedToCore, setPinnedToCore] = useState(
    evaluation?.pinnedToCore ?? false,
  );
  const [markedDormant, setMarkedDormant] = useState(
    evaluation?.markedDormant ?? false,
  );
  const [revisit, setRevisit] = useState(evaluation?.revisit ?? false);

  const sliders = useMemo(
    () =>
      [
        { key: 'importance', label: 'Importance' },
        { key: 'comfort', label: 'Comfort' },
        { key: 'activity', label: 'Activity' },
        { key: 'futureAttention', label: 'Future attention' },
      ] as const,
    [],
  );

  const dismiss = () => {
    navigation.goBack();
  };

  const resetSheetPosition = () => {
    dismissOffset.value = withTiming(0, { duration: 180 });
  };

  const dragGesture = Gesture.Pan()
    .onUpdate(event => {
      dismissOffset.value = Math.max(0, event.translationY);
    })
    .onEnd(event => {
      if (event.translationY > 120 || event.velocityY > 900) {
        dismissOffset.value = withTiming(560, { duration: 180 }, finished => {
          if (finished) {
            runOnJS(dismiss)();
          }
        });
        return;
      }

      runOnJS(resetSheetPosition)();
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissOffset.value }],
  }));

  if (!contact) {
    return null;
  }

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={styles.safe}
    >
      <Pressable
        accessibilityLabel="Dismiss contact detail"
        onPress={dismiss}
        style={styles.backdrop}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              shadowColor: theme.isDark ? '#000000' : theme.accent,
            },
            sheetAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={dragGesture}>
            <View style={styles.handleArea}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: theme.border,
                  },
                ]}
              />
            </View>
          </GestureDetector>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <GlassCard style={styles.header}>
              <ContactAvatar contact={contact} size={84} />
              <Text style={[styles.name, { color: theme.text }]}>
                {contact.displayName}
              </Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                Tune the relationship dimensions without leaving the session.
              </Text>
            </GlassCard>
            <GlassCard style={styles.card}>
              {sliders.map(slider => (
                <View key={slider.key} style={styles.sliderRow}>
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sliderLabel, { color: theme.text }]}>
                      {slider.label}
                    </Text>
                    <Text
                      style={[styles.sliderValue, { color: theme.textMuted }]}
                    >
                      {Math.round(scores[slider.key])}
                    </Text>
                  </View>
                  <Slider
                    maximumTrackTintColor={theme.border}
                    maximumValue={100}
                    minimumTrackTintColor={theme.accent}
                    minimumValue={0}
                    step={1}
                    thumbTintColor={theme.accent}
                    value={scores[slider.key]}
                    onValueChange={value =>
                      setScores(current => ({
                        ...current,
                        [slider.key]: value,
                      }))
                    }
                  />
                </View>
              ))}
            </GlassCard>
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Tags
              </Text>
              <View style={styles.tagWrap}>
                {CONTACT_TAGS.map(tag => {
                  const selected = tags.includes(tag.value);
                  return (
                    <Text
                      key={tag.value}
                      onPress={() =>
                        setTags(current =>
                          selected
                            ? current.filter(value => value !== tag.value)
                            : [...current, tag.value],
                        )
                      }
                      style={[
                        styles.tag,
                        {
                          color: selected ? '#FFFFFF' : theme.text,
                          backgroundColor: selected
                            ? theme.accent
                            : theme.panelStrong,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {tag.value.replace('_', ' ')}
                    </Text>
                  );
                })}
              </View>
            </GlassCard>
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Personal note
              </Text>
              <TextInput
                multiline
                placeholder="What makes this relationship distinct?"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.noteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={note}
                onChangeText={setNote}
              />
              <ToggleLine
                label="Pin to core circle"
                value={pinnedToCore}
                onValueChange={setPinnedToCore}
              />
              <ToggleLine
                label="Mark dormant"
                value={markedDormant}
                onValueChange={setMarkedDormant}
              />
              <ToggleLine
                label="Reminder to revisit"
                value={revisit}
                onValueChange={setRevisit}
              />
            </GlassCard>
            <PrimaryButton
              label="Save changes"
              onPress={() =>
                void saveContactDetail({
                  contactId: contact.id,
                  note,
                  tags,
                  scores,
                  pinnedToCore,
                  markedDormant,
                  revisit,
                }).then(() => navigation.goBack())
              }
            />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ToggleLine({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.toggleLine}>
      <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.56)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -10 },
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 52,
    height: 5,
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  meta: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    gap: 14,
  },
  sliderRow: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilies.semibold,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontFamilies.bold,
    textTransform: 'capitalize',
  },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  toggleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamilies.semibold,
  },
});
