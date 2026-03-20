import '@testing-library/jest-native/extend-expect';
import '@shopify/react-native-skia/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => undefined;
  return Reanimated;
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
