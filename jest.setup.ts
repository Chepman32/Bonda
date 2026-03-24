import '@testing-library/jest-native/extend-expect';
import '@shopify/react-native-skia/jestSetup';

jest.mock('react-native-reanimated', () => {
  const { FlatList, Image, ScrollView, Text, View } = require('react-native');

  const interpolate = (
    value: number,
    inputRange: number[],
    outputRange: number[],
  ) => {
    if (inputRange.length === 0 || outputRange.length === 0) {
      return value;
    }

    if (value <= inputRange[0]) {
      return outputRange[0];
    }

    const lastIndex = inputRange.length - 1;
    if (value >= inputRange[lastIndex]) {
      return outputRange[lastIndex];
    }

    for (let index = 1; index <= lastIndex; index += 1) {
      if (value <= inputRange[index]) {
        const inputStart = inputRange[index - 1];
        const inputEnd = inputRange[index];
        const outputStart = outputRange[index - 1];
        const outputEnd = outputRange[index];
        const progress = (value - inputStart) / (inputEnd - inputStart);

        return outputStart + (outputEnd - outputStart) * progress;
      }
    }

    return outputRange[lastIndex];
  };

  const Animated = {
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    createAnimatedComponent: (Component: unknown) => Component,
    Extrapolation: {
      CLAMP: 'clamp',
    },
    Easing: {
      ease: (value: number) => value,
      inOut: (fn: (value: number) => number) => fn,
    },
    addWhitelistedNativeProps: jest.fn(),
    addWhitelistedUIProps: jest.fn(),
    cancelAnimation: jest.fn(),
    clamp: (value: number, lower: number, upper: number) =>
      Math.min(Math.max(value, lower), upper),
    interpolate,
    runOnJS:
      <Args extends unknown[], Return>(fn: (...args: Args) => Return) =>
      (...args: Args) =>
        fn(...args),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useSharedValue: <Value>(initialValue: Value) => ({ value: initialValue }),
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withSpring: (value: unknown) => value,
    withTiming: (
      value: unknown,
      _config?: Record<string, unknown>,
      callback?: (finished: boolean) => void,
    ) => {
      callback?.(true);
      return value;
    },
  };

  return {
    __esModule: true,
    ...Animated,
    default: Animated,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-screens', () => ({
  enableFreeze: jest.fn(),
}));
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-nitro-modules', () => ({}));
jest.mock('react-native-nitro-sqlite', () => ({
  NitroSQLite: {
    open: jest.fn(),
  },
}));
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    getString: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  })),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-id'),
}));

jest.mock('react-native-config', () => ({
  APP_ENV: 'test',
  APP_DISPLAY_VERSION: 'test',
  ENABLE_DEMO_MODE: 'true',
  ENABLE_DIAGNOSTICS: 'true',
}));

jest.mock('react-native-contacts', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(async () => []),
  },
  getAll: jest.fn(async () => []),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: {
      CONTACTS: 'ios.permission.CONTACTS',
    },
    ANDROID: {
      READ_CONTACTS: 'android.permission.READ_CONTACTS',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    LIMITED: 'limited',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
  check: jest.fn(async () => 'granted'),
  request: jest.fn(async () => 'granted'),
  openSettings: jest.fn(async () => undefined),
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageTag: 'en', isRTL: false }],
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

const mockFileSystem = new Map<string, string>();

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  appendFile: jest.fn(async (path: string, content: string) => {
    const current = mockFileSystem.get(path) ?? '';
    mockFileSystem.set(path, `${current}${content}`);
  }),
  copyFile: jest.fn(async (source: string, destination: string) => {
    mockFileSystem.set(destination, mockFileSystem.get(source) ?? '');
  }),
  exists: jest.fn(async (path: string) => mockFileSystem.has(path)),
  mkdir: jest.fn(async () => undefined),
  readFile: jest.fn(async (path: string) => mockFileSystem.get(path) ?? ''),
  writeFile: jest.fn(async (path: string, content: string) => {
    mockFileSystem.set(path, content);
  }),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'accessible',
  },
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => true),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(async () => undefined),
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => '/tmp/bonda-capture.png'),
}));
