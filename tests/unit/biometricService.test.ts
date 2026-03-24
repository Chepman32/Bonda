import * as Keychain from 'react-native-keychain';

import {
  authenticateBiometricLock,
  disableBiometricLock,
  enableBiometricLock,
  getBiometricCapability,
  hasBiometricLock,
} from '@/services/device/biometricService';

const mockedKeychain = Keychain as unknown as {
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: string;
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: string;
  };
  ACCESSIBLE: {
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: string;
  };
  AUTHENTICATION_TYPE: {
    BIOMETRICS: string;
  };
  BIOMETRY_TYPE: {
    FACE_ID: string;
    TOUCH_ID: string;
  };
  canImplyAuthentication: jest.Mock;
  getGenericPassword: jest.Mock;
  getSupportedBiometryType: jest.Mock;
  hasGenericPassword: jest.Mock;
  resetGenericPassword: jest.Mock;
  setGenericPassword: jest.Mock;
};

describe('biometricService', () => {
  beforeEach(() => {
    mockedKeychain.canImplyAuthentication.mockResolvedValue(true);
    mockedKeychain.getSupportedBiometryType.mockResolvedValue(
      mockedKeychain.BIOMETRY_TYPE.FACE_ID,
    );
    mockedKeychain.hasGenericPassword.mockResolvedValue(false);
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'secret',
      service: 'service',
      storage: 'keychain',
      username: 'user',
    });
    mockedKeychain.resetGenericPassword.mockResolvedValue(true);
    mockedKeychain.setGenericPassword.mockResolvedValue(true);
  });

  it('detects Face ID capability on iOS', async () => {
    await expect(getBiometricCapability()).resolves.toEqual({
      keychainType: mockedKeychain.BIOMETRY_TYPE.FACE_ID,
      label: 'Face ID',
      toggleLabel: 'Use Face ID',
    });

    expect(mockedKeychain.canImplyAuthentication).toHaveBeenCalledWith({
      authenticationType: mockedKeychain.AUTHENTICATION_TYPE.BIOMETRICS,
    });
  });

  it('provisions and verifies the biometric gate entry', async () => {
    const capability = {
      keychainType: mockedKeychain.BIOMETRY_TYPE.FACE_ID,
      label: 'Face ID',
      toggleLabel: 'Use Face ID',
    };

    await enableBiometricLock(capability);

    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'bonda-biometric-lock',
      expect.any(String),
      {
        accessControl: mockedKeychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible:
          mockedKeychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        service: 'com.bonda.storage.key.biometric-lock',
      },
    );
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      authenticationPrompt: {
        title: 'Confirm Face ID to protect Bonda',
      },
      service: 'com.bonda.storage.key.biometric-lock',
    });
  });

  it('clears the biometric lock item when confirmation returns false', async () => {
    const capability = {
      keychainType: mockedKeychain.BIOMETRY_TYPE.FACE_ID,
      label: 'Face ID',
      toggleLabel: 'Use Face ID',
    };
    mockedKeychain.getGenericPassword.mockResolvedValue(false);

    await expect(enableBiometricLock(capability)).rejects.toThrow(
      "Couldn't verify Face ID for Bonda.",
    );

    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.bonda.storage.key.biometric-lock',
    });
  });

  it('returns false when the biometric lock item is missing', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false);

    await expect(authenticateBiometricLock('Unlock Bonda')).resolves.toBe(
      false,
    );
  });

  it('checks and clears the biometric lock entry', async () => {
    mockedKeychain.hasGenericPassword.mockResolvedValue(true);

    await expect(hasBiometricLock()).resolves.toBe(true);
    await disableBiometricLock();

    expect(mockedKeychain.hasGenericPassword).toHaveBeenCalledWith({
      service: 'com.bonda.storage.key.biometric-lock',
    });
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.bonda.storage.key.biometric-lock',
    });
  });
});
