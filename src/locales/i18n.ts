import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import { resources } from './resources';

const locales = RNLocalize.getLocales();
const currentLocale = locales[0]?.languageTag ?? 'en';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: currentLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
