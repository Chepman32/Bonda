declare module 'react-native-config' {
  export interface NativeConfig {
    APP_ENV?: string;
    APP_DISPLAY_VERSION?: string;
    ENABLE_DEMO_MODE?: string;
    ENABLE_DIAGNOSTICS?: string;
  }

  const Config: NativeConfig;
  export default Config;
}
