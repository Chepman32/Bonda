import type { PropsWithChildren } from 'react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n } from '@/locales/i18n';
import { fontFamilies } from '@/theme/fonts';

type DefaultStyledComponent = {
  defaultProps?: {
    style?: unknown;
  };
};

const TextWithDefaults = Text as typeof Text & DefaultStyledComponent;
const TextInputWithDefaults = TextInput as typeof TextInput &
  DefaultStyledComponent;

TextWithDefaults.defaultProps = {
  ...TextWithDefaults.defaultProps,
  style: [
    { fontFamily: fontFamilies.regular },
    TextWithDefaults.defaultProps?.style,
  ],
};

TextInputWithDefaults.defaultProps = {
  ...TextInputWithDefaults.defaultProps,
  style: [
    { fontFamily: fontFamilies.regular },
    TextInputWithDefaults.defaultProps?.style,
  ],
};

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
