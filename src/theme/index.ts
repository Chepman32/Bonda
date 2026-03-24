import { useColorScheme } from 'react-native';

import { gradients, palette, radius, spacing, typography } from './tokens';
import { useAppStore } from '@/store/useAppStore';

export const themes = {
  dark: {
    isDark: true,
    backdrop: ['#080B12', '#111827', '#16203A'] as string[],
    background: palette.graphite,
    backgroundSecondary: '#0F1526',
    panel: 'rgba(255, 255, 255, 0.08)',
    panelStrong: 'rgba(255, 255, 255, 0.14)',
    text: palette.pearl,
    textMuted: '#A9B4C8',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: palette.indigo,
    accentMuted: palette.violet,
    glow: 'rgba(121, 217, 255, 0.20)',
    danger: palette.danger,
    success: palette.success,
    warning: palette.warning,
  },
  light: {
    isDark: false,
    backdrop: ['#EDF2FF', '#DDE8FF', '#E8F0FF'] as string[],
    background: '#EDF2FF',
    backgroundSecondary: '#F8FAFF',
    panel: 'rgba(255, 255, 255, 0.82)',
    panelStrong: 'rgba(255, 255, 255, 0.96)',
    text: '#101826',
    textMuted: '#56647A',
    border: 'rgba(16, 24, 38, 0.10)',
    accent: '#4254E8',
    accentMuted: '#8D7BFF',
    glow: 'rgba(82, 97, 255, 0.12)',
    danger: '#D96880',
    success: '#3BA883',
    warning: '#C58E2D',
  },
  solar: {
    isDark: false,
    backdrop: ['#FEF7E4', '#FDF0C4', '#FEF5DC'] as string[],
    background: '#FEF7E4',
    backgroundSecondary: '#FFFDF5',
    panel: 'rgba(200, 150, 30, 0.10)',
    panelStrong: 'rgba(200, 150, 30, 0.18)',
    text: '#2C1A00',
    textMuted: '#8A6A30',
    border: 'rgba(160, 110, 20, 0.15)',
    accent: '#B86800',
    accentMuted: '#D4901A',
    glow: 'rgba(248, 195, 109, 0.35)',
    danger: '#C0504A',
    success: '#3E8A5F',
    warning: '#B86800',
  },
};

export type AppTheme = (typeof themes)[keyof typeof themes] & {
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  gradients: typeof gradients;
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const themeMode = useAppStore(state => state.settings.themeMode);

  let base: (typeof themes)[keyof typeof themes];
  if (themeMode === 'light') {
    base = themes.light;
  } else if (themeMode === 'dark') {
    base = themes.dark;
  } else if (themeMode === 'solar') {
    base = themes.solar;
  } else {
    base = scheme === 'light' ? themes.light : themes.dark;
  }

  return { ...base, spacing, radius, typography, gradients };
}
