import Config from 'react-native-config';

export const appConfig = {
  appEnv: Config.APP_ENV ?? 'development',
  appDisplayVersion: Config.APP_DISPLAY_VERSION ?? '0.0.1-dev',
  diagnosticsEnabled: Config.ENABLE_DIAGNOSTICS !== 'false',
  demoModeEnabled: Config.ENABLE_DEMO_MODE !== 'false',
};
