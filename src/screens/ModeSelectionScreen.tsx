import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

import type { EvaluationMode } from '@/models/entities';
import { ROUTES } from '@/navigation/routes';
import type { TabScreenProps } from '@/navigation/types';
import { useAppStore } from '@/store/useAppStore';
import { useAppTheme } from '@/theme';

type Props = TabScreenProps<'ModeSelection'>;

const SHEET_MODES: Array<{
  id: EvaluationMode;
  titleKey: string;
  bodyKey: string;
}> = [
  { id: 'quick', titleKey: 'mode.quick.title', bodyKey: 'mode.quick.body' },
  { id: 'deep', titleKey: 'mode.deep.title', bodyKey: 'mode.deep.body' },
];

export function ModeSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const setSelectedMode = useAppStore(state => state.setSelectedMode);
  const startSession = useAppStore(state => state.startSession);
  const session = useAppStore(state => state.session);
  const hasUnfinishedSession =
    session?.status === 'active' || session?.status === 'paused';

  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const circleSize = width * 0.82;

  const openModal = useCallback(() => {
    setModalVisible(true);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 260,
        mass: 0.7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  }, [opacityAnim, scaleAnim]);

  const pickMode = useCallback(
    async (mode: EvaluationMode) => {
      setSelectedMode(mode);
      closeModal();
      await new Promise(r => setTimeout(r, 160));
      await startSession();
      navigation.navigate(ROUTES.EvaluationDeck);
    },
    [closeModal, navigation, setSelectedMode, startSession],
  );

  const resumeSession = useCallback(() => {
    navigation.navigate(ROUTES.EvaluationDeck);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        {hasUnfinishedSession && (
          <Pressable
            accessibilityRole="button"
            onPress={resumeSession}
            style={styles.resumeButton}
          >
            <Text style={[styles.resumeLabel, { color: theme.textMuted }]}>
              {t('mode.resume.title')}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start evaluation"
          onPress={openModal}
          style={({ pressed }) => [
            styles.circleButton,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            },
            pressed && styles.circlePressed,
          ]}
        >
          <LinearGradient
            colors={theme.gradients.halo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.circleGradient, { borderRadius: circleSize / 2 }]}
          >
            <Text style={styles.circleLabel}>Start{'\n'}evaluation</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Always mounted — no Modal flash */}
      <Animated.View
        pointerEvents={modalVisible ? 'auto' : 'none'}
        style={[styles.modalBackdrop, { opacity: opacityAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeModal} />
        <Animated.View
          style={[
            styles.dialog,
            { backgroundColor: theme.backgroundSecondary },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={[styles.dialogTitle, { color: theme.text }]}>
            Choose mode
          </Text>

          <View style={styles.modeList}>
            {SHEET_MODES.map(mode => (
              <Pressable
                key={mode.id}
                onPress={() => void pickMode(mode.id)}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: theme.panel,
                    borderColor: theme.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[styles.modeTitle, { color: theme.text }]}>
                  {t(mode.titleKey)}
                </Text>
                <Text style={[styles.modeBody, { color: theme.textMuted }]}>
                  {t(mode.bodyKey)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={closeModal} style={styles.cancelRow}>
            <Text style={[styles.cancelLabel, { color: theme.textMuted }]}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  resumeButton: {
    position: 'absolute',
    bottom: -60,
  },
  resumeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  circleButton: {
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  circlePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  // modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  dialog: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 18,
  },
  modeList: {
    gap: 12,
  },
  modeCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modeBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelRow: {
    alignItems: 'center',
    paddingTop: 20,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
