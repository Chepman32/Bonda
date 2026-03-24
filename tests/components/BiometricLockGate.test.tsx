import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { BiometricLockGate } from '@/components/BiometricLockGate';
import { DEFAULT_SETTINGS } from '@/constants/app';
import {
  authenticateBiometricLock,
  getBiometricCapability,
} from '@/services/device/biometricService';
import { useAppStore } from '@/store/useAppStore';

import { resetAppTestState } from '../helpers/resetStore';

const mockAuthenticateBiometricLock = jest.mocked(authenticateBiometricLock);
const mockGetBiometricCapability = jest.mocked(getBiometricCapability);
const mockDiagnosticsLog = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/components/AtmosphereBackdrop', () => ({
  AtmosphereBackdrop: () => null,
}));

jest.mock('@/services/device/biometricService', () => ({
  authenticateBiometricLock: jest.fn(),
  getBiometricCapability: jest.fn(),
}));

jest.mock('@/services/repositories/diagnosticsRepository', () => ({
  getDiagnosticsRepository: () => ({
    log: mockDiagnosticsLog,
  }),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function setCurrentAppState(nextState: AppStateStatus) {
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    value: nextState,
  });
}

function seedGateState(
  bootState: 'idle' | 'booting' | 'ready' | 'error' = 'booting',
) {
  const updateSettings = jest.fn().mockResolvedValue(undefined);

  useAppStore.setState({
    ...useAppStore.getState(),
    bootState,
    settings: {
      ...DEFAULT_SETTINGS,
      preferBiometricUnlock: true,
    },
    updateSettings,
  });

  return { updateSettings };
}

async function renderGate() {
  const screen = render(<BiometricLockGate />);

  await waitFor(() => {
    expect(mockGetBiometricCapability).toHaveBeenCalledTimes(1);
  });

  await act(async () => {
    await Promise.resolve();
  });

  return screen;
}

describe('BiometricLockGate', () => {
  let appStateChangeHandler: ((nextState: AppStateStatus) => void) | undefined;

  const emitAppStateChange = (nextState: AppStateStatus) => {
    setCurrentAppState(nextState);

    act(() => {
      appStateChangeHandler?.(nextState);
    });
  };

  beforeEach(async () => {
    await resetAppTestState();
    jest.clearAllMocks();

    appStateChangeHandler = undefined;
    setCurrentAppState('active');
    mockGetBiometricCapability.mockResolvedValue({
      keychainType: 'FaceID',
      label: 'Face ID',
      toggleLabel: 'Use Face ID',
    });

    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((eventType, handler) => {
        if (eventType === 'change') {
          appStateChangeHandler = handler as (
            nextState: AppStateStatus,
          ) => void;
        }

        return {
          remove: jest.fn(),
        } as never;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prompts on initial boot once the app is ready', async () => {
    const deferred = createDeferred<boolean>();
    mockAuthenticateBiometricLock.mockReturnValueOnce(deferred.promise);
    seedGateState();

    const screen = await renderGate();

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        bootState: 'ready',
      });
    });

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledWith(
        'Unlock Bonda with Face ID',
      );
    });

    expect(screen.getByText('Bonda is locked')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Checking Face ID...' }),
    ).toBeDisabled();

    await act(async () => {
      deferred.resolve(true);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });
  });

  it('reauthenticates when the app returns from inactive', async () => {
    seedGateState();
    mockAuthenticateBiometricLock.mockResolvedValueOnce(true);
    const screen = await renderGate();

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        bootState: 'ready',
      });
    });

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });

    mockAuthenticateBiometricLock.mockClear();
    const deferred = createDeferred<boolean>();
    mockAuthenticateBiometricLock.mockReturnValueOnce(deferred.promise);

    emitAppStateChange('inactive');
    expect(screen.getByText('Bonda is locked')).toBeOnTheScreen();

    emitAppStateChange('active');

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      deferred.resolve(true);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });
  });

  it('reauthenticates when the app returns from background', async () => {
    seedGateState();
    mockAuthenticateBiometricLock.mockResolvedValueOnce(true);
    const screen = await renderGate();

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        bootState: 'ready',
      });
    });

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });

    mockAuthenticateBiometricLock.mockClear();
    const deferred = createDeferred<boolean>();
    mockAuthenticateBiometricLock.mockReturnValueOnce(deferred.promise);

    emitAppStateChange('background');
    expect(screen.getByText('Bonda is locked')).toBeOnTheScreen();

    emitAppStateChange('active');

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      deferred.resolve(true);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });
  });

  it('does not retrigger auth from the biometric prompt app-state changes', async () => {
    const deferred = createDeferred<boolean>();
    mockAuthenticateBiometricLock.mockReturnValueOnce(deferred.promise);
    seedGateState();

    await renderGate();

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        bootState: 'ready',
      });
    });

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });

    emitAppStateChange('inactive');
    emitAppStateChange('active');

    expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(true);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps the overlay visible after a failed auth and clears it after a retry succeeds', async () => {
    seedGateState();
    mockAuthenticateBiometricLock
      .mockRejectedValueOnce(new Error('Face ID failed'))
      .mockResolvedValueOnce(true);

    const screen = await renderGate();

    act(() => {
      useAppStore.setState({
        ...useAppStore.getState(),
        bootState: 'ready',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Face ID failed')).toBeOnTheScreen();
    });

    expect(screen.getByText('Bonda is locked')).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole('button', { name: 'Unlock with Face ID' }),
    );

    await waitFor(() => {
      expect(mockAuthenticateBiometricLock).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.queryByText('Bonda is locked')).toBeNull();
    });
  });
});
