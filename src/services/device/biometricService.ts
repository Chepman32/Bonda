import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

import { MMKV_SERVICE } from '@/constants/app';
import { createId } from '@/utils/ids';

const BIOMETRIC_LOCK_SERVICE = `${MMKV_SERVICE}.biometric-lock`;
const BIOMETRIC_LOCK_ACCOUNT = 'bonda-biometric-lock';

export interface BiometricCapability {
  keychainType: string;
  label: string;
  toggleLabel: string;
}

function resolveBiometricLabel(keychainType: string): BiometricCapability {
  if (keychainType === Keychain.BIOMETRY_TYPE.FACE_ID) {
    return {
      keychainType,
      label: 'Face ID',
      toggleLabel: 'Use Face ID',
    };
  }

  if (keychainType === Keychain.BIOMETRY_TYPE.TOUCH_ID) {
    return {
      keychainType,
      label: 'Touch ID',
      toggleLabel: 'Use Touch ID',
    };
  }

  if (keychainType === Keychain.BIOMETRY_TYPE.OPTIC_ID) {
    return {
      keychainType,
      label: 'Optic ID',
      toggleLabel: 'Use Optic ID',
    };
  }

  return {
    keychainType,
    label: 'biometric unlock',
    toggleLabel: 'Use biometric unlock',
  };
}

export async function getBiometricCapability(
  options: { skipAuthCheck?: boolean } = {},
): Promise<BiometricCapability | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  const supportedType = await Keychain.getSupportedBiometryType();
  if (!supportedType) {
    return null;
  }

  if (!options.skipAuthCheck) {
    const canAuthenticate = await Keychain.canImplyAuthentication({
      authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    });

    if (!canAuthenticate) {
      return null;
    }
  }

  return resolveBiometricLabel(supportedType);
}

export async function hasBiometricLock(): Promise<boolean> {
  return Keychain.hasGenericPassword({
    service: BIOMETRIC_LOCK_SERVICE,
  });
}

export async function enableBiometricLock(
  capability: BiometricCapability,
): Promise<void> {
  const created = await Keychain.setGenericPassword(
    BIOMETRIC_LOCK_ACCOUNT,
    createId().replace(/-/g, ''),
    {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      service: BIOMETRIC_LOCK_SERVICE,
    },
  );

  if (!created) {
    throw new Error(`Couldn't prepare ${capability.label} for Bonda.`);
  }

  try {
    const confirmed = await authenticateBiometricLock(
      `Confirm ${capability.label} to protect Bonda`,
    );

    if (!confirmed) {
      throw new Error(`Couldn't verify ${capability.label} for Bonda.`);
    }
  } catch (error) {
    await disableBiometricLock();
    throw error;
  }
}

export async function authenticateBiometricLock(
  promptTitle?: string,
): Promise<boolean> {
  const credentials = await Keychain.getGenericPassword({
    authenticationPrompt: {
      title: promptTitle ?? 'Unlock Bonda',
    },
    service: BIOMETRIC_LOCK_SERVICE,
  });

  return Boolean(credentials);
}

export async function disableBiometricLock(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: BIOMETRIC_LOCK_SERVICE,
  });
}
