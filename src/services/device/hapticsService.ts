import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import type { AppSettings } from '@/models/entities';

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export function fireThresholdHaptic(settings: AppSettings): void {
  if (settings.hapticsIntensity === 'off') {
    return;
  }

  ReactNativeHapticFeedback.trigger(
    settings.hapticsIntensity === 'soft' ? 'selection' : 'impactLight',
    HAPTIC_OPTIONS,
  );
}

export function fireConfirmationHaptic(settings: AppSettings): void {
  if (settings.hapticsIntensity === 'off') {
    return;
  }

  ReactNativeHapticFeedback.trigger('notificationSuccess', HAPTIC_OPTIONS);
}
